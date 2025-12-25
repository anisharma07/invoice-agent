import boto3
import os
import json
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from botocore.exceptions import ClientError
from typing import List, Dict, Optional, Any
from datetime import datetime

class S3Store:
    def __init__(self):
        # Dual bucket architecture
        self.app_bucket_name = os.environ.get('APP_BUCKET_NAME', 'amz-invoice-calc')
        self.user_bucket_name = os.environ.get('USER_BUCKET_NAME', 'amzn-invoice-user')
        
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
            region_name=os.environ.get('AWS_REGION', 'us-east-1')
        )
        self.templates_prefix = "templates/"
        self.metadata_prefix = "templates-metadata/"
        self.invoices_prefix = "invoices/"
        
        # Invoice storage paths - separate meta and data
        self.invoice_meta_prefix = "invoices/meta/"
        self.invoice_data_prefix = "invoices/data/"
        
        # User bucket paths - Updated to match diagram
        self.user_template_meta_prefix = "templates/metadata/"
        self.user_template_data_prefix = "templates/data/"
        
        # Caching configuration
        self._cache = {}
        self._cache_lock = threading.Lock()
        self._cache_ttl = 300  # 5 minutes
        self._max_workers = 10  # Max parallel S3 fetches

    def list_templates(self, template_type: str = 'app', user_id: str = 'default_user', page: int = 1, limit: int = 10) -> Dict[str, Any]:
        """Unified list templates method with pagination"""
        if template_type == 'user':
            return self.list_user_templates(user_id, page, limit)
        return self.list_app_templates(page, limit)

    def _get_cache(self, cache_key: str) -> Optional[Dict]:
        """Get item from cache if not expired"""
        with self._cache_lock:
            if cache_key in self._cache:
                cached_data, timestamp = self._cache[cache_key]
                if time.time() - timestamp < self._cache_ttl:
                    return cached_data
                del self._cache[cache_key]
        return None
    
    def _set_cache(self, cache_key: str, data: Dict):
        """Set item in cache with current timestamp"""
        with self._cache_lock:
            self._cache[cache_key] = (data, time.time())
    
    def _invalidate_cache(self, prefix: str = None):
        """Invalidate cache entries, optionally by prefix"""
        with self._cache_lock:
            if prefix:
                keys_to_delete = [k for k in self._cache.keys() if k.startswith(prefix)]
                for k in keys_to_delete:
                    del self._cache[k]
            else:
                self._cache.clear()

    def list_app_templates(self, page: int = 1, limit: int = 10) -> Dict[str, Any]:
        """List global templates from the App Bucket with parallel fetching and caching"""
        cache_key = "app_templates_all"
        
        # Check cache first
        cached = self._get_cache(cache_key)
        if cached:
            all_templates = cached
        else:
            try:
                # List all metadata files
                response = self.s3_client.list_objects_v2(
                    Bucket=self.app_bucket_name,
                    Prefix=self.metadata_prefix
                )
                
                all_templates = []
                if 'Contents' in response:
                    # Collect keys to fetch
                    objects_to_fetch = [(obj['Key'], obj['LastModified']) for obj in response['Contents'] if obj['Key'].endswith('.json')]
                    
                    # Parallel fetch using ThreadPoolExecutor
                    def fetch_template(key_info):
                        key, last_modified = key_info
                        try:
                            content = self.get_file(self.app_bucket_name, key)
                            if content:
                                meta = json.loads(content['content'])
                                if 'id' in meta:
                                    meta['id'] = str(meta['id'])
                                if not meta.get('id'):
                                    meta['id'] = key.replace(self.metadata_prefix, '').replace('.json', '').replace('-meta', '')
                                
                                return {
                                    'id': meta.get('id'),
                                    'name': meta.get('name', 'Untitled Template'),
                                    'description': meta.get('description', ''),
                                    'type': meta.get('type', 'invoice'),
                                    'device': meta.get('device', 'desktop'),
                                    'isPremium': meta.get('isPremium', False),
                                    'price': meta.get('price', {}),
                                    'image': meta.get('image', ''),
                                    'hashtag': meta.get('hashtag', []),
                                    'bucket': 'app',
                                    'last_modified': last_modified.isoformat()
                                }
                        except Exception as e:
                            print(f"Error reading app template {key}: {e}")
                        return None
                    
                    with ThreadPoolExecutor(max_workers=self._max_workers) as executor:
                        futures = {executor.submit(fetch_template, obj): obj for obj in objects_to_fetch}
                        for future in as_completed(futures):
                            result = future.result()
                            if result:
                                all_templates.append(result)
                
                # Sort by last_modified (newest first)
                all_templates.sort(key=lambda x: x['last_modified'], reverse=True)
                
                # Cache the full list
                self._set_cache(cache_key, all_templates)
                
            except ClientError as e:
                print(f"Error listing app templates: {e}")
                return {'items': [], 'total': 0, 'page': page, 'limit': limit}
        
        # Paginate
        total = len(all_templates)
        start = (page - 1) * limit
        end = start + limit
        paged_templates = all_templates[start:end]
        
        return {
            'items': paged_templates,
            'total': total,
            'page': page,
            'limit': limit
        }

    def list_user_templates(self, user_id: str, page: int = 1, limit: int = 10) -> Dict[str, Any]:
        """List templates from User Bucket - optimized with batch listing and parallel fetches"""
        cache_key = f"user_templates_{user_id}"
        
        # Check cache first
        cached = self._get_cache(cache_key)
        if cached:
            all_templates = cached
        else:
            try:
                # User paths
                meta_prefix = f"{user_id}/{self.user_template_meta_prefix}"
                data_prefix = f"{user_id}/{self.user_template_data_prefix}"
                
                # Step 1: List all data files in ONE call (instead of head_object per template)
                data_response = self.s3_client.list_objects_v2(
                    Bucket=self.user_bucket_name,
                    Prefix=data_prefix
                )
                existing_data_files = set()
                if 'Contents' in data_response:
                    for obj in data_response['Contents']:
                        # Extract just the filename from the data key
                        data_filename = obj['Key'].replace(data_prefix, '')
                        existing_data_files.add(data_filename)
                
                # Step 2: List all metadata files
                meta_response = self.s3_client.list_objects_v2(
                    Bucket=self.user_bucket_name,
                    Prefix=meta_prefix
                )
                
                all_templates = []
                if 'Contents' in meta_response:
                    # Collect objects that have corresponding data files
                    objects_to_fetch = []
                    for obj in meta_response['Contents']:
                        key = obj['Key']
                        if key.endswith('.json'):
                            file_id = key.replace(meta_prefix, '')
                            # Check if data file exists using our pre-fetched set (O(1) lookup)
                            if file_id in existing_data_files:
                                objects_to_fetch.append((key, file_id, obj['LastModified']))
                            else:
                                print(f"Warning: Template {file_id} has metadata but no data file, skipping")
                    
                    # Parallel fetch metadata content
                    def fetch_user_template(obj_info):
                        key, file_id, last_modified = obj_info
                        try:
                            content = self.get_file(self.user_bucket_name, key)
                            if content:
                                meta = json.loads(content['content'])
                                clean_id = file_id.replace('.json', '') if file_id.endswith('.json') else file_id
                                
                                return {
                                    'id': clean_id,
                                    'name': meta.get('name', clean_id),
                                    'description': meta.get('description', ''),
                                    'type': meta.get('type', 'invoice'),
                                    'device': meta.get('device', 'desktop'),
                                    'isPremium': meta.get('isPremium', False),
                                    'price': meta.get('price', {}),
                                    'image': meta.get('image', ''),
                                    'hashtag': meta.get('hashtag', []),
                                    'bucket': 'user',
                                    'last_modified': last_modified.isoformat()
                                }
                        except Exception as e:
                            print(f"Error reading user template {key}: {e}")
                        return None
                    
                    with ThreadPoolExecutor(max_workers=self._max_workers) as executor:
                        futures = {executor.submit(fetch_user_template, obj): obj for obj in objects_to_fetch}
                        for future in as_completed(futures):
                            result = future.result()
                            if result:
                                all_templates.append(result)
                
                # Sort by last_modified (newest first)
                all_templates.sort(key=lambda x: x['last_modified'], reverse=True)
                
                # Cache the full list
                self._set_cache(cache_key, all_templates)
                
            except ClientError as e:
                print(f"Error listing user templates: {e}")
                return {'items': [], 'total': 0, 'page': page, 'limit': limit}
        
        # Paginate
        total = len(all_templates)
        start = (page - 1) * limit
        end = start + limit
        paged_templates = all_templates[start:end]
        
        return {
            'items': paged_templates,
            'total': total,
            'page': page,
            'limit': limit
        }

    def import_template(self, filename: str, target_filename: str = None, user_id: str = 'default_user') -> bool:
        """Import a template from app bucket to user bucket"""
        try:
            # filename is assumed to be the ID or unique identifier
            clean_target = target_filename if target_filename else filename
            if clean_target.endswith('.json'):
                dest_filename = clean_target
            else:
                dest_filename = f"{clean_target}.json"
            
            # 1. Find and Copy Metadata
            # Try multiple metadata path patterns
            src_meta_key = None
            meta_patterns = [
                f"{self.metadata_prefix}{filename}-meta.json",  # e.g. templates-metadata/100009-meta.json
                f"{self.metadata_prefix}{filename}.json",       # e.g. templates-metadata/100009.json
                f"{self.metadata_prefix}{filename}",            # e.g. templates-metadata/100009
            ]
            
            for pattern in meta_patterns:
                try:
                    self.s3_client.head_object(Bucket=self.app_bucket_name, Key=pattern)
                    src_meta_key = pattern
                    print(f"Found metadata at: {pattern}")
                    break
                except ClientError:
                    continue
            
            if not src_meta_key:
                print(f"Could not find metadata for template {filename} in any expected location")
                return False
            
            dest_meta_key = f"{user_id}/{self.user_template_meta_prefix}{dest_filename}"
            
            copy_source_meta = {'Bucket': self.app_bucket_name, 'Key': src_meta_key}
            self.s3_client.copy(copy_source_meta, self.user_bucket_name, dest_meta_key)
            print(f"Copied metadata from {src_meta_key} to {dest_meta_key}")

            # 2. Find and Copy Data
            src_data_key = None
            data_patterns = [
                f"templates/data/{filename}.json",  # e.g. templates/data/100009.json
                f"templates/{filename}.json",       # e.g. templates/100009.json (from screenshot)
                f"templates/data/{filename}",       # e.g. templates/data/100009
                f"templates/{filename}",            # e.g. templates/100009
            ]
            
            for pattern in data_patterns:
                try:
                    self.s3_client.head_object(Bucket=self.app_bucket_name, Key=pattern)
                    src_data_key = pattern
                    print(f"Found data at: {pattern}")
                    break
                except ClientError:
                    continue
            
            if not src_data_key:
                print(f"Could not find data for template {filename} in any expected location")
                return False

            dest_data_key = f"{user_id}/{self.user_template_data_prefix}{dest_filename}"
            
            copy_source_data = {'Bucket': self.app_bucket_name, 'Key': src_data_key}
            self.s3_client.copy(copy_source_data, self.user_bucket_name, dest_data_key)
            print(f"Copied data from {src_data_key} to {dest_data_key}")
            
            # Invalidate user templates cache
            self._invalidate_cache(f"user_templates_{user_id}")
            
            return True
        except ClientError as e:
            print(f"Error importing template {filename}: {e}")
            return False

    def save_invoice(self, filename: str, content: Any, template_id: str, bill_type: int = 1, 
                     user_id: str = 'default_user', invoice_id: str = None, total: float = None,
                     invoice_name: str = None, status: str = 'draft', invoice_number: str = None,
                     app_mapping: Dict = None, footer: Any = None) -> bool:
        """Save a user invoice to User Bucket using separate meta/data folders.
        
        Args:
            filename: Invoice filename (without .json extension)
            content: Invoice MSC content (string or dict) - can be raw MSC or complete {msc, appMapping, footer}
            template_id: Template ID used for this invoice
            bill_type: Bill type/footer index
            user_id: User identifier
            invoice_id: Unique invoice ID (generated if not provided)
            total: Total amount from invoice
            invoice_name: Display name for the invoice
            status: Invoice status (draft, sent, paid, etc.)
            invoice_number: User-defined invoice number
            app_mapping: App mapping configuration for dynamic form
            footer: Footer configuration
        """
        try:
            # Ensure filename has .json extension
            clean_filename = filename if filename.endswith('.json') else f"{filename}.json"
            
            # Generate invoice_id if not provided
            if not invoice_id:
                import uuid
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                invoice_id = f"INV-{timestamp}-{uuid.uuid4().hex[:6].upper()}"
            
            now = datetime.now().isoformat()
            
            # 1. Save invoice metadata
            meta = {
                'invoice_id': invoice_id,
                'filename': clean_filename,
                'template_id': str(template_id),
                'bill_type': bill_type,
                'total': total,
                'invoice_name': invoice_name or filename.replace('.json', ''),
                'status': status,
                'invoice_number': invoice_number,
                'created_at': now,  # Will be preserved on updates via get_invoice
                'modified_at': now
            }
            
            # Check if invoice already exists to preserve created_at and invoice_id
            existing = self.get_invoice_meta(filename, user_id)
            if existing and existing.get('created_at'):
                meta['created_at'] = existing['created_at']
                meta['invoice_id'] = existing.get('invoice_id', invoice_id)
            
            meta_key = f"{user_id}/{self.invoice_meta_prefix}{clean_filename}"
            self.s3_client.put_object(
                Bucket=self.user_bucket_name,
                Key=meta_key,
                Body=json.dumps(meta),
                ContentType='application/json'
            )
            
            # 2. Save invoice data (content)
            data_key = f"{user_id}/{self.invoice_data_prefix}{clean_filename}"
            
            # Build complete invoice data structure if appMapping/footer provided
            if app_mapping is not None or footer is not None:
                # Create complete invoice structure
                invoice_data = {
                    'msc': content,  # MSC content (can be string or dict)
                    'appMapping': app_mapping or {},
                    'footer': footer
                }
                body = json.dumps(invoice_data)
            else:
                # Legacy: Content might be a string (encoded MSC) or dict
                if isinstance(content, str):
                    body = content
                else:
                    body = json.dumps(content)
            
            self.s3_client.put_object(
                Bucket=self.user_bucket_name,
                Key=data_key,
                Body=body,
                ContentType='application/json'
            )
            
            return True
        except ClientError as e:
            print(f"Error saving invoice: {e}")
            return False

    def list_invoices(self, user_id: str = 'default_user') -> List[Dict[str, Any]]:
        """List all invoices from User Bucket by reading metadata files."""
        try:
            prefix = f"{user_id}/{self.invoice_meta_prefix}"
            response = self.s3_client.list_objects_v2(
                Bucket=self.user_bucket_name,
                Prefix=prefix
            )
            
            invoices = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']
                    if key.endswith('.json'):
                        try:
                            # Read metadata file
                            file_data = self.get_file(self.user_bucket_name, key)
                            if file_data:
                                meta = json.loads(file_data['content'])
                                invoices.append({
                                    'filename': key.replace(prefix, ''),
                                    'invoice_id': meta.get('invoice_id'),
                                    'template_id': meta.get('template_id'),
                                    'bill_type': meta.get('bill_type', 1),
                                    'total': meta.get('total'),
                                    'invoice_name': meta.get('invoice_name'),
                                    'status': meta.get('status', 'draft'),
                                    'invoice_number': meta.get('invoice_number'),
                                    'created_at': meta.get('created_at'),
                                    'modified_at': meta.get('modified_at'),
                                    'last_modified': obj['LastModified'].isoformat(),
                                    'size': obj['Size']
                                })
                        except Exception as e:
                            print(f"Error reading invoice meta {key}: {e}")
                            continue
            
            # Sort by modified_at DESC
            invoices.sort(key=lambda x: x.get('modified_at', ''), reverse=True)
            return invoices
        except ClientError as e:
            print(f"Error listing invoices: {e}")
            return []

    def get_invoice_meta(self, filename: str, user_id: str = 'default_user') -> Optional[Dict[str, Any]]:
        """Get invoice metadata only."""
        clean_filename = filename if filename.endswith('.json') else f"{filename}.json"
        meta_key = f"{user_id}/{self.invoice_meta_prefix}{clean_filename}"
        file_data = self.get_file(self.user_bucket_name, meta_key)
        if file_data:
            return json.loads(file_data['content'])
        return None

    def get_invoice(self, filename: str, user_id: str = 'default_user') -> Optional[Dict[str, Any]]:
        """Get specific invoice content and metadata from User Bucket."""
        clean_filename = filename if filename.endswith('.json') else f"{filename}.json"
        
        # Get metadata
        meta = self.get_invoice_meta(filename, user_id)
        
        # Get data
        data_key = f"{user_id}/{self.invoice_data_prefix}{clean_filename}"
        file_data = self.get_file(self.user_bucket_name, data_key)
        
        if file_data:
            content = file_data['content']
            # Try to parse as JSON, but it might be a raw MSC string
            try:
                content = json.loads(content)
            except json.JSONDecodeError:
                pass  # Keep as string
            
            return {
                'content': content,
                'template_id': meta.get('template_id') if meta else file_data.get('template_id'),
                'bill_type': meta.get('bill_type') if meta else file_data.get('bill_type', '1'),
                'invoice_id': meta.get('invoice_id') if meta else None,
                'total': meta.get('total') if meta else None,
                'invoice_name': meta.get('invoice_name') if meta else None,
                'status': meta.get('status', 'draft') if meta else 'draft',
                'invoice_number': meta.get('invoice_number') if meta else None,
                'created_at': meta.get('created_at') if meta else None,
                'modified_at': meta.get('modified_at') if meta else None
            }
        return None
        
    def get_template(self, filename: str, bucket_type: str = 'user', user_id: str = 'default_user') -> Optional[Dict[str, Any]]:
        """
        Get specific template content.
        bucket_type: 'user' or 'app'
        
        Attempts to find the file in:
        App: templates/data/{filename}
        User: {user_id}/templates/data/{filename}
        """
        # Ensure filename has .json extension
        clean_filename = filename if filename.endswith('.json') else f"{filename}.json"
        
        if bucket_type == 'app':
            target_bucket = self.app_bucket_name
            key = f"templates/data/{clean_filename}"
        else:
            target_bucket = self.user_bucket_name
            key = f"{user_id}/{self.user_template_data_prefix}{clean_filename}"
            
        file_data = self.get_file(target_bucket, key)
        if file_data:
            return json.loads(file_data['content'])
        return None

    def get_file(self, bucket: str, key: str) -> Optional[Dict[str, Any]]:
        """Helper to get file content and metadata from S3"""
        try:
            response = self.s3_client.get_object(Bucket=bucket, Key=key)
            content = response['Body'].read().decode('utf-8')
            metadata = response.get('Metadata', {})
            return {
                'content': content,
                'template_id': metadata.get('template_id'),
                'bill_type': metadata.get('bill_type', '1')
            }
        except ClientError as e:
            # print(f"Error getting file {key} from {bucket}: {e}")
            return None

    def save_template_seed(self, filename: str, meta_content: Dict, data_content: Dict) -> bool:
        """Seed template to App Bucket (Admin utility)
           Saves metadata to templates/metadata/
           Saves data to templates/data/
        """
        try:
            # Save Metadata
            meta_key = f"{self.metadata_prefix}{filename}"
            self.s3_client.put_object(
                Bucket=self.app_bucket_name,
                Key=meta_key,
                Body=json.dumps(meta_content),
                ContentType='application/json'
            )
            
            # Save Data
            data_key = f"templates/data/{filename}"
            self.s3_client.put_object(
                Bucket=self.app_bucket_name,
                Key=data_key,
                Body=json.dumps(data_content),
                ContentType='application/json'
            )
            return True
        except ClientError as e:
            print(f"Error seeding template {filename}: {e}")
            return False

    def delete_invoice(self, filename: str, user_id: str = 'default_user') -> bool:
        """Delete invoice from User Bucket (both meta and data files)."""
        try:
            clean_filename = filename if filename.endswith('.json') else f"{filename}.json"
            
            # Delete metadata file
            meta_key = f"{user_id}/{self.invoice_meta_prefix}{clean_filename}"
            self.s3_client.delete_object(Bucket=self.user_bucket_name, Key=meta_key)
            
            # Delete data file
            data_key = f"{user_id}/{self.invoice_data_prefix}{clean_filename}"
            self.s3_client.delete_object(Bucket=self.user_bucket_name, Key=data_key)
            
            return True
        except ClientError as e:
            print(f"Error deleting invoice {filename}: {e}")
            return False

    def delete_user_template(self, filename: str, user_id: str = 'default_user') -> bool:
        """Delete template from User Bucket"""
        try:
            # Delete Metadata
            # Note: We must handle .json extension if it's there or not. 
            # list_user_templates returns ID which might be filename without extension.
            # import_template saves as {filename}.json.
            
            target_file = filename if filename.endswith('.json') else f"{filename}.json"
            
            meta_key = f"{user_id}/{self.user_template_meta_prefix}{target_file}"
            self.s3_client.delete_object(Bucket=self.user_bucket_name, Key=meta_key)
            
            # Delete Data
            data_key = f"{user_id}/{self.user_template_data_prefix}{target_file}"
            self.s3_client.delete_object(Bucket=self.user_bucket_name, Key=data_key)
            
            # Invalidate user templates cache
            self._invalidate_cache(f"user_templates_{user_id}")
            
            return True
        except ClientError as e:
            print(f"Error deleting user template {filename}: {e}")
            return False

    def update_user_template_meta(self, filename: str, updates: Dict[str, Any], user_id: str = 'default_user') -> bool:
        """Update template metadata in User Bucket
        
        Args:
            filename: Template filename (with or without .json)
            updates: Dict with fields to update (name, description, type, device, etc.)
            user_id: User identifier
            
        Returns:
            True if successful, False otherwise
        """
        try:
            target_file = filename if filename.endswith('.json') else f"{filename}.json"
            meta_key = f"{user_id}/{self.user_template_meta_prefix}{target_file}"
            
            # Get existing metadata
            existing = self.get_file(self.user_bucket_name, meta_key)
            if not existing:
                print(f"Template metadata not found: {meta_key}")
                return False
            
            current_meta = json.loads(existing['content'])
            
            # Merge updates
            allowed_fields = ['name', 'description', 'type', 'device', 'image', 'hashtag', 'isPremium', 'price']
            for field in allowed_fields:
                if field in updates:
                    current_meta[field] = updates[field]
            
            # Save updated metadata
            self.s3_client.put_object(
                Bucket=self.user_bucket_name,
                Key=meta_key,
                Body=json.dumps(current_meta),
                ContentType='application/json'
            )
            
            # Invalidate user templates cache
            self._invalidate_cache(f"user_templates_{user_id}")
            
            return True
        except ClientError as e:
            print(f"Error updating template metadata {filename}: {e}")
            return False

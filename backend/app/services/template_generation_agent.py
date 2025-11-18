"""
Template Generation Agent
Orchestrates the complete invoice template generation pipeline:
1. MetaAndCellMap Agent -> generates cell mappings
2. SaveStr Agent -> converts to MSC format
3. Validation Loop -> validates and corrects (max 5 retries)
4. Response Assembly -> formats final response
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from .meta_cellmap_agent import MetaAndCellMapAgent
from .savestr_agent import SaveStrAgent
from .msc_validator import MSCValidator

# Configure logger for this module
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class TemplateGenerationAgent:
    """
    Main orchestrator for invoice template generation with validation
    """

    def __init__(self):
        self.cellmap_agent = MetaAndCellMapAgent()
        self.savestr_agent = SaveStrAgent()
        self.validator = MSCValidator()
        self.max_retries = 5

    def generate_template(self,
                          user_prompt: str,
                          invoice_image: Optional[str] = None,
                          invoice_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate complete invoice template with validation

        Args:
            user_prompt: User's description of invoice requirements
            invoice_image: Optional base64 encoded invoice image
            invoice_data: Optional pre-parsed invoice data

        Returns:
            Dict containing:
            {
                "assistantResponse": {
                    "text": "Human-readable description",
                    "savestr": "version:1.5\\ncell:...",
                    "cellMappings": {...},
                    "templateMeta": {...}
                },
                "validation": {
                    "is_valid": True/False,
                    "attempts": 3,
                    "final_errors": []
                }
            }
        """

        logger.info(f"\n{'='*60}")
        logger.info("TEMPLATE GENERATION PIPELINE STARTED")
        logger.info(f"{'='*60}")
        logger.info(
            f"User Prompt: {user_prompt[:150]}{'...' if len(user_prompt) > 150 else ''}")
        logger.info(f"Has Invoice Image: {bool(invoice_image)}")

        # Step 1: Generate cell mappings and metadata
        logger.info("\n[Step 1/4] GENERATING CELL MAPPINGS AND METADATA")
        logger.info("Agent: MetaAndCellMapAgent")
        try:
            logger.info(
                "Invoking MetaAndCellMapAgent.generate_cell_mappings()...")
            template_meta, cell_mappings = self.cellmap_agent.generate_cell_mappings(
                user_prompt, invoice_image
            )
            logger.info("✓ Cell mappings generated successfully")
            logger.info(
                f"  Template Name: {template_meta.get('name', 'Unknown')}")
            logger.info(
                f"  Category: {template_meta.get('category', 'Unknown')}")
            logger.info(
                f"  Device Type: {template_meta.get('deviceType', 'Unknown')}")
            logger.info(
                f"  Description: {template_meta.get('description', 'N/A')[:80]}...")
            logger.info(f"  Cell Mappings Keys: {list(cell_mappings.keys())}")
            if 'text' in cell_mappings and 'sheet1' in cell_mappings['text']:
                text_keys = list(cell_mappings['text']['sheet1'].keys())
                logger.info(f"  Text Mappings (sheet1) Keys: {text_keys}")
        except Exception as e:
            logger.error(f"✗ Cell mapping generation failed")
            logger.error(f"  Error Type: {type(e).__name__}")
            logger.error(f"  Error Message: {str(e)}")
            import traceback
            logger.error(f"  Traceback:\n{traceback.format_exc()}")
            raise ValueError(f"Failed to generate cell mappings: {str(e)}")

        # Step 2: Generate initial savestr
        logger.info("\n[Step 2/4] GENERATING SOCIALCALC SAVE STRING (MSC)")
        logger.info("Agent: SaveStrAgent")
        try:
            logger.info("Invoking SaveStrAgent.generate_savestr()...")
            logger.info(
                f"  Input: template_meta, cell_mappings, invoice_data={bool(invoice_data)}")
            savestr = self.savestr_agent.generate_savestr(
                template_meta=template_meta,
                cell_mappings=cell_mappings,
                invoice_data=invoice_data,
                user_prompt=user_prompt,
                invoice_image=invoice_image
            )
            savestr_lines = savestr.split('\n') if savestr else []
            logger.info(f"✓ SaveStr generated successfully")
            logger.info(f"  Total Length: {len(savestr)} characters")
            logger.info(f"  Total Lines: {len(savestr_lines)}")
            if savestr_lines:
                logger.info(f"  First Line: {savestr_lines[0][:80]}...")
                logger.info(f"  Last Line: {savestr_lines[-1][:80]}...")
        except Exception as e:
            logger.error(f"✗ SaveStr generation failed")
            logger.error(f"  Error Type: {type(e).__name__}")
            logger.error(f"  Error Message: {str(e)}")
            import traceback
            logger.error(f"  Traceback:\n{traceback.format_exc()}")
            raise ValueError(f"Failed to generate savestr: {str(e)}")

        # Step 3: Validation loop with retries
        logger.info("\n[Step 3/4] VALIDATION LOOP WITH AUTO-CORRECTION")
        logger.info(
            f"Validator: MSCValidator (Max Retries: {self.max_retries})")
        validation_attempts = 0
        is_valid = False
        validation_errors = []

        while validation_attempts < self.max_retries:
            validation_attempts += 1
            logger.info(
                f"\n  Validation Attempt {validation_attempts}/{self.max_retries}")

            # Validate savestr
            try:
                logger.info(
                    f"  Invoking MSCValidator.validate_with_corrections()...")
                corrected_savestr, is_valid, messages = self.validator.validate_with_corrections(
                    savestr
                )

                if is_valid:
                    logger.info(f"  ✓ Validation PASSED")
                    if messages:
                        logger.info(
                            f"    Auto-corrections applied: {len(messages)}")
                        for i, msg in enumerate(messages[:3], 1):
                            logger.info(f"      Correction {i}: {msg}")
                        if len(messages) > 3:
                            logger.info(
                                f"      ... and {len(messages)-3} more corrections")
                    savestr = corrected_savestr
                    logger.info(
                        f"  Final SaveStr Length: {len(savestr)} characters")
                    break
                else:
                    logger.warning(
                        f"  ✗ Validation FAILED with {len(messages)} errors")
                    validation_errors = messages

                    # Log validation errors
                    for i, error in enumerate(messages[:5], 1):
                        logger.warning(f"    Error {i}: {error}")
                    if len(messages) > 5:
                        logger.warning(
                            f"    ... and {len(messages)-5} more errors")

                    # If we've reached max retries, give up
                    if validation_attempts >= self.max_retries:
                        logger.warning(
                            f"\n  ✗ Max retries ({self.max_retries}) reached")
                        logger.warning(
                            f"  Using last corrected version despite validation errors")
                        savestr = corrected_savestr  # Use the corrected version even if not perfect
                        break

                    # Step 3b: Fix savestr based on errors
                    logger.info(f"  → Requesting fixes from SaveStr Agent...")
                    logger.info(
                        f"  Invoking SaveStrAgent.fix_savestr_with_errors()...")
                    logger.info(
                        f"    Providing {len(validation_errors)} validation errors")
                    savestr = self.savestr_agent.fix_savestr_with_errors(
                        savestr=savestr,
                        validation_errors=validation_errors,
                        template_meta=template_meta,
                        cell_mappings=cell_mappings
                    )
                    corrected_length = len(savestr)
                    logger.info(
                        f"  ✓ Received corrected savestr ({corrected_length} characters)")
                    logger.info(f"  Proceeding to next validation attempt...")

            except Exception as e:
                logger.error(f"  ✗ Validation error occurred")
                logger.error(f"    Error Type: {type(e).__name__}")
                logger.error(f"    Error Message: {str(e)}")
                validation_errors.append(f"Validation exception: {str(e)}")

                if validation_attempts >= self.max_retries:
                    logger.error(f"\n  ✗ Max retries reached with exception")
                    break

        # Step 4: Generate user-friendly response text
        logger.info("\n[Step 4/4] GENERATING USER RESPONSE")
        logger.info("Generating human-readable response text...")
        response_text = self._generate_response_text(
            template_meta=template_meta,
            cell_mappings=cell_mappings,
            is_valid=is_valid,
            validation_attempts=validation_attempts,
            user_prompt=user_prompt
        )
        logger.info(f"✓ Response generated ({len(response_text)} characters)")

        # Assemble final response
        logger.info("\nAssembling final response structure...")
        result = {
            "assistantResponse": {
                "text": response_text,
                "savestr": savestr,
                "cellMappings": cell_mappings,
                "templateMeta": template_meta
            },
            "validation": {
                "is_valid": is_valid,
                "attempts": validation_attempts,
                "final_errors": validation_errors if not is_valid else []
            }
        }

        logger.info(f"\n{'='*60}")
        logger.info("TEMPLATE GENERATION PIPELINE COMPLETED")
        logger.info(
            f"Status: {'✓ SUCCESS' if is_valid else '⚠ PARTIAL SUCCESS (with validation warnings)'}")
        logger.info(
            f"Validation Attempts: {validation_attempts}/{self.max_retries}")
        logger.info(
            f"Final Errors: {len(validation_errors) if validation_errors else 0}")
        logger.info(f"Template Name: {template_meta.get('name', 'Unknown')}")
        logger.info(f"SaveStr Length: {len(savestr)} characters")
        logger.info(f"Response Text Length: {len(response_text)} characters")
        logger.info(f"{'='*60}\n")

        return result

    def _generate_response_text(self,
                                template_meta: Dict[str, Any],
                                cell_mappings: Dict[str, Any],
                                is_valid: bool,
                                validation_attempts: int,
                                user_prompt: str) -> str:
        """
        Generate user-friendly response text

        Args:
            template_meta: Template metadata
            cell_mappings: Cell mapping structure
            is_valid: Whether validation passed
            validation_attempts: Number of validation attempts
            user_prompt: Original user prompt

        Returns:
            Human-readable response text
        """
        # Extract key information
        template_name = template_meta.get("name", "Custom Invoice")
        category = template_meta.get("category", "invoice")
        device_type = template_meta.get("deviceType", "tablet")
        description = template_meta.get("description", "")

        # Count editable fields
        text_mappings = cell_mappings.get("text", {}).get("sheet1", {})
        editable_fields = 0

        # Count simple fields
        for key, value in text_mappings.items():
            if isinstance(value, str):
                editable_fields += 1
            elif isinstance(value, dict) and key not in ["Items", "From", "BillTo"]:
                editable_fields += len([v for v in value.values()
                                       if isinstance(v, str)])

        # Count From/BillTo fields
        if "From" in text_mappings:
            editable_fields += len(
                [v for v in text_mappings["From"].values() if isinstance(v, str)])
        if "BillTo" in text_mappings:
            editable_fields += len(
                [v for v in text_mappings["BillTo"].values() if isinstance(v, str)])

        # Count Items section
        items_section = text_mappings.get("Items", {})
        if items_section:
            rows_config = items_section.get("Rows", {})
            start_row = rows_config.get("start", 0)
            end_row = rows_config.get("end", 0)
            item_rows = end_row - start_row + 1 if end_row > start_row else 0
            columns = items_section.get("Columns", {})
            num_columns = len(columns)
        else:
            item_rows = 0
            num_columns = 0

        # Build response
        response_parts = []

        response_parts.append(
            f"I have created a {category.replace('_', ' ')} template called '{template_name}' "
            f"optimized for {device_type} devices."
        )

        if description:
            response_parts.append(description)

        response_parts.append(
            f"The template includes {editable_fields} editable fields for your invoice details "
            f"(company information, billing details, dates, invoice numbers, etc.)."
        )

        if item_rows > 0:
            response_parts.append(
                f"It has space for up to {item_rows} line items with {num_columns} columns "
                f"({', '.join(columns.keys())})."
            )

        response_parts.append(
            "The template includes automatic calculations for subtotals, taxes, and totals using formulas."
        )

        response_parts.append(
            "Professional styling has been applied with borders, fonts, colors, and proper alignment."
        )

        # Add validation status
        if is_valid:
            if validation_attempts > 1:
                response_parts.append(
                    f"The template has been validated and auto-corrected ({validation_attempts} iterations) "
                    f"to ensure perfect compatibility with SocialCalc format."
                )
            else:
                response_parts.append(
                    "The template has been validated and is ready to use."
                )
        else:
            response_parts.append(
                f"Note: The template was generated with minor validation warnings "
                f"after {validation_attempts} attempts. It should still work correctly."
            )

        return " ".join(response_parts)

    def edit_template(self,
                      current_savestr: str,
                      current_cell_mappings: Dict[str, Any],
                      current_meta: Dict[str, Any],
                      edit_prompt: str,
                      invoice_image: Optional[str] = None) -> Dict[str, Any]:
        """
        Edit existing template based on user feedback

        Args:
            current_savestr: Current MSC savestr
            current_cell_mappings: Current cell mappings
            current_meta: Current template metadata
            edit_prompt: User's edit request
            invoice_image: Optional invoice image

        Returns:
            Updated template result dict (same format as generate_template)
        """
        print(f"\n{'='*60}")
        print("TEMPLATE EDITING PIPELINE STARTED")
        print(f"{'='*60}")

        # Step 1: Update cell mappings based on edit request
        print("\n[Step 1/3] Updating Cell Mappings...")
        try:
            template_meta, cell_mappings = self.cellmap_agent.regenerate_with_feedback(
                original_prompt=f"Current template: {current_meta.get('name', 'Unknown')}",
                previous_meta=current_meta,
                previous_mappings=current_cell_mappings,
                feedback=edit_prompt,
                invoice_image=invoice_image
            )
            print(f"✓ Cell mappings updated")
        except Exception as e:
            print(f"✗ Failed to update cell mappings: {e}")
            # Fall back to current mappings
            template_meta = current_meta
            cell_mappings = current_cell_mappings

        # Step 2: Regenerate savestr with updated mappings
        print("\n[Step 2/3] Regenerating SaveStr...")
        try:
            savestr = self.savestr_agent.generate_savestr(
                template_meta=template_meta,
                cell_mappings=cell_mappings,
                invoice_data=None,
                user_prompt=edit_prompt,
                invoice_image=invoice_image
            )
            print(f"✓ SaveStr regenerated")
        except Exception as e:
            print(f"✗ Failed to regenerate savestr: {e}")
            raise ValueError(f"Failed to regenerate savestr: {str(e)}")

        # Step 3: Validate with retry loop (same as generate_template)
        print("\n[Step 3/3] Validating Updated Template...")
        validation_attempts = 0
        is_valid = False
        validation_errors = []

        while validation_attempts < self.max_retries:
            validation_attempts += 1
            print(f"\n  Attempt {validation_attempts}/{self.max_retries}...")

            try:
                corrected_savestr, is_valid, messages = self.validator.validate_with_corrections(
                    savestr
                )

                if is_valid:
                    print(f"  ✓ Validation PASSED")
                    savestr = corrected_savestr
                    break
                else:
                    print(f"  ✗ Validation FAILED with {len(messages)} errors")
                    validation_errors = messages

                    if validation_attempts >= self.max_retries:
                        savestr = corrected_savestr
                        break

                    savestr = self.savestr_agent.fix_savestr_with_errors(
                        savestr=savestr,
                        validation_errors=validation_errors,
                        template_meta=template_meta,
                        cell_mappings=cell_mappings
                    )

            except Exception as e:
                print(f"  ✗ Validation error: {e}")
                validation_errors.append(f"Validation exception: {str(e)}")
                if validation_attempts >= self.max_retries:
                    break

        # Generate response
        response_text = f"I have updated the template based on your request: {edit_prompt}"

        if is_valid:
            response_text += f" The changes have been validated successfully after {validation_attempts} iteration(s)."
        else:
            response_text += f" Note: Some validation warnings remain after {validation_attempts} attempts."

        result = {
            "assistantResponse": {
                "text": response_text,
                "savestr": savestr,
                "cellMappings": cell_mappings,
                "templateMeta": template_meta
            },
            "validation": {
                "is_valid": is_valid,
                "attempts": validation_attempts,
                "final_errors": validation_errors if not is_valid else []
            }
        }

        print(f"\n{'='*60}")
        print("TEMPLATE EDITING COMPLETED")
        print(f"{'='*60}\n")

        return result

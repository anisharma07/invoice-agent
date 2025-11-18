import redis
import json
import tiktoken
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from ..config import settings


class RedisSessionManager:
    """Manages chat sessions in Redis with token counting and expiry"""

    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )
        self.encoding = tiktoken.get_encoding(
            "cl100k_base")  # Claude tokenizer approximation
        self.max_tokens = settings.MAX_TOKEN_LIMIT
        self.session_expiry = settings.SESSION_EXPIRY_SECONDS

    def _get_session_key(self, session_id: str) -> str:
        """Generate Redis key for session"""
        return f"session:{session_id}"

    def _count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))

    def _calculate_total_tokens(self, messages: List[Dict[str, Any]]) -> int:
        """Calculate total tokens in conversation"""
        total = 0
        for msg in messages:
            total += self._count_tokens(msg.get("content", ""))
        return total

    def create_session(self, session_id: str, initial_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a new session"""
        session_data = {
            "session_id": session_id,
            "created_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat(),
            "messages": [],
            "invoice_data": initial_data or {},
            "token_count": 0
        }

        session_key = self._get_session_key(session_id)
        self.redis_client.setex(
            session_key,
            self.session_expiry,
            json.dumps(session_data)
        )

        return session_data

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data"""
        session_key = self._get_session_key(session_id)
        session_json = self.redis_client.get(session_key)

        if not session_json:
            return None

        return json.loads(session_json)

    def update_session(self, session_id: str, messages: List[Dict[str, Any]],
                       invoice_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Update session with new messages"""
        session_data = self.get_session(session_id)

        if not session_data:
            raise ValueError(f"Session {session_id} not found or expired")

        # Calculate token count
        token_count = self._calculate_total_tokens(messages)

        # Check token limit
        if token_count > self.max_tokens:
            raise ValueError(
                f"Token limit exceeded: {token_count}/{self.max_tokens}")

        # Update session data
        session_data["messages"] = messages
        session_data["last_activity"] = datetime.now().isoformat()
        session_data["token_count"] = token_count

        if invoice_data:
            session_data["invoice_data"] = invoice_data

        # Save back to Redis with extended expiry
        session_key = self._get_session_key(session_id)
        self.redis_client.setex(
            session_key,
            self.session_expiry,
            json.dumps(session_data)
        )

        return session_data

    def add_message(self, session_id: str, role: str, content: str) -> Dict[str, Any]:
        """Add a message to session"""
        session_data = self.get_session(session_id)

        if not session_data:
            raise ValueError(f"Session {session_id} not found or expired")

        # Add new message
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        session_data["messages"].append(message)

        # Calculate token count
        token_count = self._calculate_total_tokens(session_data["messages"])

        # Check token limit
        if token_count > self.max_tokens:
            raise ValueError(
                f"Token limit exceeded: {token_count}/{self.max_tokens}")

        session_data["token_count"] = token_count
        session_data["last_activity"] = datetime.now().isoformat()

        # Save back to Redis
        session_key = self._get_session_key(session_id)
        self.redis_client.setex(
            session_key,
            self.session_expiry,
            json.dumps(session_data)
        )

        return session_data

    def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        session_key = self._get_session_key(session_id)
        return bool(self.redis_client.delete(session_key))

    def session_exists(self, session_id: str) -> bool:
        """Check if session exists"""
        session_key = self._get_session_key(session_id)
        return bool(self.redis_client.exists(session_key))

    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session metadata"""
        session_data = self.get_session(session_id)

        if not session_data:
            return None

        session_key = self._get_session_key(session_id)
        ttl = self.redis_client.ttl(session_key)

        return {
            "session_id": session_id,
            "created_at": session_data["created_at"],
            "last_activity": session_data["last_activity"],
            "token_count": session_data["token_count"],
            "message_count": len(session_data["messages"]),
            "expires_in_seconds": ttl
        }

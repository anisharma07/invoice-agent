from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.now)


class AssistantResponse(BaseModel):
    """Assistant response with template data"""
    text: str = Field(..., description="Human-readable response")
    savestr: str = Field(...,
                         description="SocialCalc save string (MSC format)")
    cellMappings: Dict[str, Any] = Field(...,
                                         description="Cell mapping configuration")
    templateMeta: Dict[str, Any] = Field(..., description="Template metadata")


class ValidationInfo(BaseModel):
    """Validation information"""
    is_valid: bool = Field(..., description="Whether validation passed")
    attempts: int = Field(..., description="Number of validation attempts")
    final_errors: List[str] = Field(
        default_factory=list, description="Remaining validation errors")


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    session_id: str = Field(..., description="Unique session identifier")
    message: str = Field(..., description="User message/prompt")
    invoice_image: Optional[str] = Field(
        None, description="Base64 encoded invoice image for reference")


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    session_id: str
    assistantResponse: AssistantResponse
    validation: ValidationInfo
    token_count: int
    token_limit: int = 200000
    timestamp: datetime = Field(default_factory=datetime.now)


class InvoiceGenerateRequest(BaseModel):
    """Request model for generating new invoice"""
    session_id: Optional[str] = None
    initial_prompt: str = Field(...,
                                description="Initial invoice requirements")
    invoice_image: Optional[str] = Field(
        None, description="Base64 encoded invoice image for reference")


class InvoiceGenerateResponse(BaseModel):
    """Response model for invoice generation"""
    session_id: str
    assistantResponse: AssistantResponse
    validation: ValidationInfo
    token_count: int
    timestamp: datetime = Field(default_factory=datetime.now)


class SessionInfo(BaseModel):
    """Session information model"""
    session_id: str
    created_at: datetime
    last_activity: datetime
    token_count: int
    message_count: int
    expires_in_seconds: int


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: Optional[str] = None
    session_id: Optional[str] = None


# Invoice Editing Agent Models

class CellMapping(BaseModel):
    """Cell mapping structure for invoice editing"""
    mappings: Dict[str, Any] = Field(...,
                                     description="Cell mappings for sheets")


class EditInvoiceRequest(BaseModel):
    """Request model for editing invoice cells"""
    session_id: Optional[str] = None
    prompt: str = Field(..., description="Natural language editing request")
    cell_mappings: Dict[str,
                        Any] = Field(..., description="Available cell mappings")
    current_values: Optional[Dict[str, str]] = Field(
        None, description="Current cell values")
    invoice_image: Optional[str] = Field(
        None, description="Base64 encoded invoice image")


class EditInvoiceResponse(BaseModel):
    """Response model for invoice editing"""
    session_id: str
    message: str = Field(..., description="Explanation of changes")
    cell_updates: Dict[str, str] = Field(...,
                                         description="Cell address to value mappings")
    token_count: int
    timestamp: datetime = Field(default_factory=datetime.now)


class EditChatRequest(BaseModel):
    """Request model for continuing editing conversation"""
    session_id: str = Field(..., description="Unique session identifier")
    prompt: str = Field(..., description="Follow-up editing request")
    cell_mappings: Optional[Dict[str, Any]] = Field(
        None, description="Cell mappings (if changed)")
    current_values: Optional[Dict[str, str]] = Field(
        None, description="Updated cell values")
    invoice_image: Optional[str] = Field(
        None, description="New invoice image if provided")


class EditChatResponse(BaseModel):
    """Response model for editing chat"""
    session_id: str
    message: str = Field(..., description="Explanation of changes")
    cell_updates: Dict[str, str] = Field(...,
                                         description="Cell address to value mappings")
    token_count: int
    timestamp: datetime = Field(default_factory=datetime.now)

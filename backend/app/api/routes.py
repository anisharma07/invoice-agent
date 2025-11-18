from fastapi import APIRouter, HTTPException, status
from typing import Optional
import uuid
import logging
from datetime import datetime

from ..models.schemas import (
    ChatRequest, ChatResponse, InvoiceGenerateRequest,
    InvoiceGenerateResponse, SessionInfo, ErrorResponse,
    EditInvoiceRequest, EditInvoiceResponse, EditChatRequest, EditChatResponse
)
from ..services.redis_manager import RedisSessionManager
from ..services.template_generation_agent import TemplateGenerationAgent
from ..services.invoice_editing_agent import InvoiceEditingAgent

# Configure logger for this module
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/api", tags=["invoice"])

# Initialize services
session_manager = RedisSessionManager()
template_agent = TemplateGenerationAgent()
editing_agent = InvoiceEditingAgent()
# Separate session manager for editing
editing_session_manager = RedisSessionManager()


@router.post("/generate-invoice", response_model=InvoiceGenerateResponse)
async def generate_invoice(request: InvoiceGenerateRequest):
    """Generate a new invoice template using the template generation pipeline"""
    request_id = str(uuid.uuid4())[:8]  # Short request ID for tracking

    logger.info("="*80)
    logger.info(f"[{request_id}] GENERATE-INVOICE API REQUEST STARTED")
    logger.info("="*80)

    try:
        # Log request details
        logger.info(f"[{request_id}] Request Details:")
        logger.info(
            f"[{request_id}]   - Initial Prompt: {request.initial_prompt[:100]}{'...' if len(request.initial_prompt) > 100 else ''}")
        logger.info(
            f"[{request_id}]   - Has Invoice Image: {bool(request.invoice_image)}")
        logger.info(
            f"[{request_id}]   - Requested Session ID: {request.session_id}")

        # Create or get session
        session_id = request.session_id or str(uuid.uuid4())
        logger.info(f"[{request_id}] Session Management:")
        logger.info(f"[{request_id}]   - Session ID: {session_id}")

        if not session_manager.session_exists(session_id):
            logger.info(f"[{request_id}]   - Creating new session")
            session_manager.create_session(session_id)
        else:
            logger.info(f"[{request_id}]   - Using existing session")

        # Generate template using the new pipeline
        # This orchestrates: MetaAndCellMap -> SaveStr -> Validation Loop
        logger.info(f"[{request_id}] Starting Template Generation Pipeline:")
        logger.info(
            f"[{request_id}]   → Pipeline: MetaAndCellMap → SaveStr → Validation Loop")

        result = template_agent.generate_template(
            user_prompt=request.initial_prompt,
            invoice_image=request.invoice_image
        )

        logger.info(f"[{request_id}] Template Generation Completed")

        # Extract components
        assistant_response = result["assistantResponse"]
        validation_info = result["validation"]

        # Log generated template details
        logger.info(f"[{request_id}] Generated Template Details:")
        template_meta = assistant_response.get("templateMeta", {})
        logger.info(
            f"[{request_id}]   - Template Name: {template_meta.get('name', 'Unknown')}")
        logger.info(
            f"[{request_id}]   - Category: {template_meta.get('category', 'Unknown')}")
        logger.info(
            f"[{request_id}]   - Device Type: {template_meta.get('deviceType', 'Unknown')}")
        logger.info(
            f"[{request_id}]   - Description: {template_meta.get('description', 'N/A')[:80]}...")

        # Log cell mappings summary
        cell_mappings = assistant_response.get("cellMappings", {})
        text_mappings = cell_mappings.get("text", {}).get("sheet1", {})
        logger.info(f"[{request_id}]   - Cell Mappings:")
        logger.info(
            f"[{request_id}]     • Top-level keys: {list(text_mappings.keys())}")
        logger.info(
            f"[{request_id}]     • Total mapping entries: {len(text_mappings)}")

        # Log savestr details
        savestr = assistant_response.get("savestr", "")
        savestr_lines = savestr.split('\n') if savestr else []
        logger.info(f"[{request_id}]   - SaveStr (MSC Format):")
        logger.info(
            f"[{request_id}]     • Total length: {len(savestr)} characters")
        logger.info(f"[{request_id}]     • Total lines: {len(savestr_lines)}")
        if savestr_lines:
            logger.info(
                f"[{request_id}]     • First line: {savestr_lines[0][:80]}...")

        # Log validation details
        logger.info(f"[{request_id}] Validation Results:")
        logger.info(
            f"[{request_id}]   - Valid: {validation_info.get('is_valid', False)}")
        logger.info(
            f"[{request_id}]   - Validation Attempts: {validation_info.get('attempts', 0)}")
        final_errors = validation_info.get('final_errors', [])
        if final_errors:
            logger.warning(
                f"[{request_id}]   - Final Errors Count: {len(final_errors)}")
            for i, error in enumerate(final_errors[:3], 1):
                logger.warning(f"[{request_id}]     Error {i}: {error}")
            if len(final_errors) > 3:
                logger.warning(
                    f"[{request_id}]     ... and {len(final_errors) - 3} more errors")
        else:
            logger.info(f"[{request_id}]   - No validation errors")

        # Add messages to session
        logger.info(f"[{request_id}] Updating Session:")
        session_manager.add_message(session_id, "user", request.initial_prompt)
        session_manager.add_message(
            session_id, "assistant", assistant_response["text"])
        logger.info(f"[{request_id}]   - Added user and assistant messages")

        # Store template data in session
        template_data = {
            "savestr": assistant_response["savestr"],
            "cellMappings": assistant_response["cellMappings"],
            "templateMeta": assistant_response["templateMeta"]
        }

        updated_session = session_manager.update_session(
            session_id,
            session_manager.get_session(session_id)["messages"],
            template_data
        )

        logger.info(f"[{request_id}]   - Stored template data in session")
        logger.info(
            f"[{request_id}]   - Session token count: {updated_session['token_count']}")

        # Build response using new schema
        from ..models.schemas import AssistantResponse as AssistantResponseModel
        from ..models.schemas import ValidationInfo as ValidationInfoModel

        response = InvoiceGenerateResponse(
            session_id=session_id,
            assistantResponse=AssistantResponseModel(**assistant_response),
            validation=ValidationInfoModel(**validation_info),
            token_count=updated_session["token_count"],
            timestamp=datetime.now()
        )

        # Log response summary
        logger.info(f"[{request_id}] Response Summary:")
        logger.info(f"[{request_id}]   - Session ID: {session_id}")
        logger.info(
            f"[{request_id}]   - Response Text Length: {len(response.assistantResponse.text)} characters")
        logger.info(f"[{request_id}]   - Token Count: {response.token_count}")
        logger.info(
            f"[{request_id}]   - Status: {'SUCCESS' if validation_info.get('is_valid') else 'PARTIAL SUCCESS'}")

        logger.info("="*80)
        logger.info(
            f"[{request_id}] GENERATE-INVOICE API REQUEST COMPLETED SUCCESSFULLY")
        logger.info("="*80)

        return response

    except ValueError as e:
        logger.error(f"[{request_id}] ValueError occurred: {str(e)}")
        if "Token limit exceeded" in str(e):
            logger.error(f"[{request_id}] Token limit exceeded error")
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=str(e)
            )
        logger.error(f"[{request_id}] Bad request error")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("="*80)
        logger.error(f"[{request_id}] GENERATE-INVOICE API REQUEST FAILED")
        logger.error(f"[{request_id}] Exception Type: {type(e).__name__}")
        logger.error(f"[{request_id}] Exception Message: {str(e)}")
        logger.error("="*80)
        import traceback
        logger.error(f"[{request_id}] Traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating invoice template: {str(e)}"
        )


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Continue conversation and edit invoice template"""
    try:
        # Check if session exists
        if not session_manager.session_exists(request.session_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {request.session_id} not found or expired. Please create a new invoice."
            )

        # Get session data
        session_data = session_manager.get_session(request.session_id)
        current_template = session_data.get("invoice_data", {})

        # Edit or generate template based on whether we have existing data
        if current_template and "savestr" in current_template:
            # Edit existing template
            result = template_agent.edit_template(
                current_savestr=current_template.get("savestr", ""),
                current_cell_mappings=current_template.get("cellMappings", {}),
                current_meta=current_template.get("templateMeta", {}),
                edit_prompt=request.message,
                invoice_image=request.invoice_image
            )
        else:
            # Generate new template
            result = template_agent.generate_template(
                user_prompt=request.message,
                invoice_image=request.invoice_image
            )

        # Extract components
        assistant_response = result["assistantResponse"]
        validation_info = result["validation"]

        # Add messages to session
        session_manager.add_message(
            request.session_id, "user", request.message)
        session_manager.add_message(
            request.session_id, "assistant", assistant_response["text"])

        # Store template data in session
        template_data = {
            "savestr": assistant_response["savestr"],
            "cellMappings": assistant_response["cellMappings"],
            "templateMeta": assistant_response["templateMeta"]
        }

        updated_session = session_manager.update_session(
            request.session_id,
            session_manager.get_session(request.session_id)["messages"],
            template_data
        )

        # Build response using new schema
        from ..models.schemas import AssistantResponse as AssistantResponseModel
        from ..models.schemas import ValidationInfo as ValidationInfoModel

        return ChatResponse(
            session_id=request.session_id,
            assistantResponse=AssistantResponseModel(**assistant_response),
            validation=ValidationInfoModel(**validation_info),
            token_count=updated_session["token_count"],
            token_limit=200000,
            timestamp=datetime.now()
        )

    except ValueError as e:
        if "Token limit exceeded" in str(e):
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
        )


@router.get("/session/{session_id}", response_model=SessionInfo)
async def get_session_info(session_id: str):
    """Get session information and status"""
    try:
        session_info = session_manager.get_session_info(session_id)

        if not session_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found or expired"
            )

        return SessionInfo(**session_info)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving session info: {str(e)}"
        )


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    try:
        if session_manager.delete_session(session_id):
            return {"message": f"Session {session_id} deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting session: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        session_manager.redis_client.ping()
        return {
            "status": "healthy",
            "redis": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "redis": "disconnected",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


# Invoice Editing Agent Endpoints

@router.post("/edit-invoice/session", response_model=EditInvoiceResponse)
async def create_editing_session(request: EditInvoiceRequest):
    """Create a new invoice editing session"""
    try:
        # Create or get session
        session_id = request.session_id or str(uuid.uuid4())

        if not editing_session_manager.session_exists(session_id):
            editing_session_manager.create_session(
                session_id,
                initial_data={
                    "cell_mappings": request.cell_mappings,
                    "current_values": request.current_values or {}
                }
            )

        # Get session data
        session_data = editing_session_manager.get_session(session_id)

        # Process editing request
        explanation, cell_updates = editing_agent.process_edit_request(
            prompt=request.prompt,
            cell_mappings=request.cell_mappings,
            current_values=request.current_values,
            invoice_image=request.invoice_image,
            conversation_history=session_data["messages"]
        )

        # Add messages to session
        editing_session_manager.add_message(session_id, "user", request.prompt)
        editing_session_manager.add_message(
            session_id, "assistant", explanation)

        # Update session with cell updates
        updated_session = editing_session_manager.update_session(
            session_id,
            editing_session_manager.get_session(session_id)["messages"],
            invoice_data={
                "cell_mappings": request.cell_mappings,
                "current_values": request.current_values or {},
                "cell_updates": cell_updates
            }
        )

        return EditInvoiceResponse(
            session_id=session_id,
            message=explanation,
            cell_updates=cell_updates,
            token_count=updated_session["token_count"],
            timestamp=datetime.now()
        )

    except ValueError as e:
        if "Token limit exceeded" in str(e):
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating editing session: {str(e)}"
        )


@router.post("/edit-invoice/chat", response_model=EditChatResponse)
async def continue_editing(request: EditChatRequest):
    """Continue editing conversation"""
    try:
        # Check if session exists
        if not editing_session_manager.session_exists(request.session_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {request.session_id} not found or expired. Please create a new editing session."
            )

        # Get session data
        session_data = editing_session_manager.get_session(request.session_id)
        stored_data = session_data.get("invoice_data", {})

        # Use stored cell mappings if not provided
        cell_mappings = request.cell_mappings or stored_data.get(
            "cell_mappings", {})
        current_values = request.current_values or stored_data.get(
            "current_values", {})

        if not cell_mappings:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cell mappings are required. Please provide them in the request or session."
            )

        # Process editing request
        explanation, cell_updates = editing_agent.process_edit_request(
            prompt=request.prompt,
            cell_mappings=cell_mappings,
            current_values=current_values,
            invoice_image=request.invoice_image,
            conversation_history=session_data["messages"]
        )

        # Add messages to session
        editing_session_manager.add_message(
            request.session_id, "user", request.prompt)
        editing_session_manager.add_message(
            request.session_id, "assistant", explanation)

        # Update session
        updated_session = editing_session_manager.update_session(
            request.session_id,
            editing_session_manager.get_session(
                request.session_id)["messages"],
            invoice_data={
                "cell_mappings": cell_mappings,
                "current_values": current_values,
                "cell_updates": cell_updates
            }
        )

        return EditChatResponse(
            session_id=request.session_id,
            message=explanation,
            cell_updates=cell_updates,
            token_count=updated_session["token_count"],
            timestamp=datetime.now()
        )

    except ValueError as e:
        if "Token limit exceeded" in str(e):
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing editing request: {str(e)}"
        )


@router.get("/edit-invoice/session/{session_id}", response_model=SessionInfo)
async def get_editing_session_info(session_id: str):
    """Get editing session information"""
    try:
        session_info = editing_session_manager.get_session_info(session_id)

        if not session_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Editing session {session_id} not found or expired"
            )

        return SessionInfo(**session_info)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving editing session info: {str(e)}"
        )


@router.delete("/edit-invoice/session/{session_id}")
async def delete_editing_session(session_id: str):
    """Delete an editing session"""
    try:
        if editing_session_manager.delete_session(session_id):
            return {"message": f"Editing session {session_id} deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Editing session {session_id} not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting editing session: {str(e)}"
        )

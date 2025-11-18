# Logging Implementation for Generate-Invoice API

## Overview

Comprehensive logging has been implemented for the `/api/generate-invoice` endpoint to track every step of the template generation pipeline, including agent interactions, validations, loops, and output responses.

## Logging Architecture

### 1. Main API Endpoint (`app/api/routes.py`)

#### Request Tracking
- Each request is assigned a unique 8-character request ID for traceability
- Logs include:
  - Request start/end markers
  - Initial prompt (truncated to 100 chars)
  - Invoice image presence
  - Session ID (requested or generated)

#### Session Management Logging
- Session creation or retrieval
- Session ID assignment
- Message additions to session
- Template data storage
- Token count tracking

#### Template Generation Details
- Template name, category, device type
- Template description
- Cell mappings summary (keys and structure)
- SaveStr details (length, line count, first line preview)

#### Validation Results
- Validation status (valid/invalid)
- Number of validation attempts
- Detailed error messages (first 3 errors with truncation)

#### Response Summary
- Final session ID
- Response text length
- Total token count
- Overall status (SUCCESS/PARTIAL SUCCESS)

#### Error Handling
- Captures ValueError, HTTPException, and general exceptions
- Logs exception type and message
- Full traceback for debugging
- Separate logging for token limit errors

### 2. Template Generation Pipeline (`app/services/template_generation_agent.py`)

#### Pipeline Overview Logging
- Pipeline start/end markers
- User prompt preview (first 150 chars)
- Invoice image presence indicator

#### Step 1: Cell Mappings Generation
- Agent identification (MetaAndCellMapAgent)
- Method invocation logging
- Success/failure indication
- Template metadata details:
  - Name, category, device type
  - Description preview
  - Cell mappings structure
- Error logging with traceback

#### Step 2: SaveStr Generation
- Agent identification (SaveStrAgent)
- Input parameters summary
- Generated SaveStr details:
  - Total character count
  - Line count
  - First and last line previews
- Error logging with traceback

#### Step 3: Validation Loop
- Validator identification (MSCValidator)
- Max retry count
- Per-attempt logging:
  - Attempt number (X/Y format)
  - Validation method invocation
  - Pass/fail status
  - Auto-corrections applied (with details)
  - Validation errors (first 5 with truncation)
  - Retry logic and fix requests
  - Corrected SaveStr length
- Max retry handling
- Exception handling in validation

#### Step 4: Response Generation
- Response text generation notification
- Character count
- Final assembly logging

#### Pipeline Completion Summary
- Overall status (SUCCESS or PARTIAL SUCCESS)
- Validation attempts used
- Final error count
- Template name
- SaveStr final length
- Response text length

### 3. Application-Level Configuration (`app/main.py`)

#### Logging Setup
- **Format**: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- **Handlers**:
  - Console output (stdout)
  - File output (`invoice_agent.log`)
- **Levels**:
  - Application logs: INFO
  - HTTP libraries (httpx, httpcore, urllib3): WARNING (reduced noise)

## Log File Location

Logs are written to: `backend/invoice_agent.log`

## Log Levels Used

| Level | Usage |
|-------|-------|
| **INFO** | Normal operation flow, successful steps, pipeline progress |
| **WARNING** | Validation failures, retry attempts, partial successes |
| **ERROR** | Exceptions, failures, critical errors with tracebacks |

## Example Log Flow

```
2025-11-15 10:30:15 - app.api.routes - INFO - ================================================================================
2025-11-15 10:30:15 - app.api.routes - INFO - [a1b2c3d4] GENERATE-INVOICE API REQUEST STARTED
2025-11-15 10:30:15 - app.api.routes - INFO - ================================================================================
2025-11-15 10:30:15 - app.api.routes - INFO - [a1b2c3d4] Request Details:
2025-11-15 10:30:15 - app.api.routes - INFO - [a1b2c3d4]   - Initial Prompt: Create an invoice template for a coffee shop...
2025-11-15 10:30:15 - app.api.routes - INFO - [a1b2c3d4]   - Has Invoice Image: True
2025-11-15 10:30:15 - app.api.routes - INFO - [a1b2c3d4]   - Requested Session ID: None
2025-11-15 10:30:15 - app.api.routes - INFO - [a1b2c3d4] Session Management:
2025-11-15 10:30:15 - app.api.routes - INFO - [a1b2c3d4]   - Session ID: 12345678-1234-5678-1234-567812345678
2025-11-15 10:30:15 - app.api.routes - INFO - [a1b2c3d4]   - Creating new session
2025-11-15 10:30:15 - app.api.routes - INFO - [a1b2c3d4] Starting Template Generation Pipeline:
2025-11-15 10:30:15 - app.api.routes - INFO - [a1b2c3d4]   → Pipeline: MetaAndCellMap → SaveStr → Validation Loop

2025-11-15 10:30:15 - app.services.template_generation_agent - INFO - 
============================================================
2025-11-15 10:30:15 - app.services.template_generation_agent - INFO - TEMPLATE GENERATION PIPELINE STARTED
2025-11-15 10:30:15 - app.services.template_generation_agent - INFO - ============================================================

2025-11-15 10:30:16 - app.services.template_generation_agent - INFO - 
[Step 1/4] GENERATING CELL MAPPINGS AND METADATA
2025-11-15 10:30:16 - app.services.template_generation_agent - INFO - Agent: MetaAndCellMapAgent
2025-11-15 10:30:18 - app.services.template_generation_agent - INFO - ✓ Cell mappings generated successfully
2025-11-15 10:30:18 - app.services.template_generation_agent - INFO -   Template Name: Coffee Shop Invoice
2025-11-15 10:30:18 - app.services.template_generation_agent - INFO -   Category: invoice

2025-11-15 10:30:18 - app.services.template_generation_agent - INFO - 
[Step 2/4] GENERATING SOCIALCALC SAVE STRING (MSC)
2025-11-15 10:30:18 - app.services.template_generation_agent - INFO - Agent: SaveStrAgent
2025-11-15 10:30:20 - app.services.template_generation_agent - INFO - ✓ SaveStr generated successfully
2025-11-15 10:30:20 - app.services.template_generation_agent - INFO -   Total Length: 4532 characters

2025-11-15 10:30:20 - app.services.template_generation_agent - INFO - 
[Step 3/4] VALIDATION LOOP WITH AUTO-CORRECTION
2025-11-15 10:30:20 - app.services.template_generation_agent - INFO - Validator: MSCValidator (Max Retries: 5)
2025-11-15 10:30:20 - app.services.template_generation_agent - INFO -   Validation Attempt 1/5
2025-11-15 10:30:21 - app.services.template_generation_agent - WARNING -   ✗ Validation FAILED with 3 errors
2025-11-15 10:30:21 - app.services.template_generation_agent - INFO -   → Requesting fixes from SaveStr Agent...
2025-11-15 10:30:23 - app.services.template_generation_agent - INFO -   Validation Attempt 2/5
2025-11-15 10:30:24 - app.services.template_generation_agent - INFO -   ✓ Validation PASSED

2025-11-15 10:30:24 - app.services.template_generation_agent - INFO - 
[Step 4/4] GENERATING USER RESPONSE
2025-11-15 10:30:25 - app.services.template_generation_agent - INFO - ✓ Response generated (450 characters)

2025-11-15 10:30:25 - app.services.template_generation_agent - INFO - 
============================================================
2025-11-15 10:30:25 - app.services.template_generation_agent - INFO - TEMPLATE GENERATION PIPELINE COMPLETED
2025-11-15 10:30:25 - app.services.template_generation_agent - INFO - Status: ✓ SUCCESS
2025-11-15 10:30:25 - app.services.template_generation_agent - INFO - Validation Attempts: 2/5
2025-11-15 10:30:25 - app.services.template_generation_agent - INFO - ============================================================

2025-11-15 10:30:25 - app.api.routes - INFO - [a1b2c3d4] Template Generation Completed
2025-11-15 10:30:25 - app.api.routes - INFO - [a1b2c3d4] Generated Template Details:
2025-11-15 10:30:25 - app.api.routes - INFO - [a1b2c3d4]   - Template Name: Coffee Shop Invoice
2025-11-15 10:30:25 - app.api.routes - INFO - [a1b2c3d4] Response Summary:
2025-11-15 10:30:25 - app.api.routes - INFO - [a1b2c3d4]   - Status: SUCCESS
2025-11-15 10:30:25 - app.api.routes - INFO - ================================================================================
2025-11-15 10:30:25 - app.api.routes - INFO - [a1b2c3d4] GENERATE-INVOICE API REQUEST COMPLETED SUCCESSFULLY
2025-11-15 10:30:25 - app.api.routes - INFO - ================================================================================
```

## Benefits

1. **Request Traceability**: Unique request IDs allow tracking individual requests through the entire pipeline
2. **Performance Monitoring**: Timestamps enable performance analysis of each step
3. **Error Debugging**: Full tracebacks and error context simplify troubleshooting
4. **Validation Insights**: Detailed validation loop logging shows retry patterns and error evolution
5. **Agent Interaction Tracking**: Clear visibility into which agents are called and their outputs
6. **Production Monitoring**: Structured logs facilitate log aggregation and monitoring tools

## Viewing Logs

### Console Output
```bash
# View in real-time during development
python -m app.main
```

### Log File
```bash
# View the log file
cat backend/invoice_agent.log

# Tail the log file (follow new entries)
tail -f backend/invoice_agent.log

# Filter by request ID
grep "a1b2c3d4" backend/invoice_agent.log

# Filter by log level
grep "ERROR" backend/invoice_agent.log
grep "WARNING" backend/invoice_agent.log
```

### Using with Docker
```bash
# View logs from Docker container
docker logs <container_name> -f

# Or if using docker-compose
docker-compose logs -f backend
```

## Future Enhancements

1. **Structured JSON Logging**: Implement JSON-formatted logs for better machine parsing
2. **Log Rotation**: Add log rotation to prevent file size issues
3. **Metrics Collection**: Export metrics (attempt counts, latencies) to monitoring systems
4. **Log Levels by Environment**: Different verbosity for dev/staging/production
5. **Distributed Tracing**: Integration with tools like OpenTelemetry for distributed systems
6. **Performance Profiling**: Add timing decorators for method-level performance tracking

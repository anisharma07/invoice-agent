# Backend Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                    (React Frontend / API Consumers)                          │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ HTTP/REST
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                                   │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    FastAPI Application (main.py)                    │    │
│  │  - CORS Middleware                                                  │    │
│  │  - Request/Response Handling                                        │    │
│  │  - Error Management                                                 │    │
│  └────────────────────────────┬───────────────────────────────────────┘    │
│                                │                                             │
│                                ▼                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                   API Routes (routes.py)                            │    │
│  │                                                                     │    │
│  │  POST /api/generate-invoice  - Create new invoice                  │    │
│  │  POST /api/chat             - Continue conversation                │    │
│  │  GET  /api/session/{id}     - Get session info                     │    │
│  │  DELETE /api/session/{id}   - Delete session                       │    │
│  │  GET  /api/health           - Health check                         │    │
│  └─────────────┬──────────────────────────────┬────────────────────────┘    │
└────────────────┼──────────────────────────────┼─────────────────────────────┘
                 │                               │
                 │                               │
    ┌────────────▼────────────┐     ┌───────────▼──────────────┐
    │                         │     │                           │
    │  SESSION MANAGEMENT     │     │   AI AGENT LAYER          │
    │                         │     │                           │
    └─────────────────────────┘     └───────────────────────────┘
```

## Detailed Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SESSION MANAGEMENT LAYER                              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │            RedisSessionManager (redis_manager.py)                   │    │
│  │                                                                     │    │
│  │  • Session Creation & Retrieval                                    │    │
│  │  • Message History Storage                                         │    │
│  │  • Token Counting (tiktoken)                                       │    │
│  │  • Session Expiry Management                                       │    │
│  │  • Invoice Data Persistence                                        │    │
│  └─────────────────────────────┬───────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    Redis Database                                   │    │
│  │                                                                     │    │
│  │  Key-Value Store:                                                   │    │
│  │  • session:{id} → Session Data (JSON)                              │    │
│  │    - created_at                                                     │    │
│  │    - last_activity                                                  │    │
│  │    - messages[]                                                     │    │
│  │    - invoice_data                                                   │    │
│  │    - token_count                                                    │    │
│  │                                                                     │    │
│  │  Features:                                                          │    │
│  │  • TTL-based expiry (24 hours)                                     │    │
│  │  • 200K token limit tracking                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI AGENT LAYER                                      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │              InvoiceAgent (invoice_agent.py)                        │    │
│  │                                                                     │    │
│  │  Core Functions:                                                    │    │
│  │  ├─ generate_invoice_with_msc()                                    │    │
│  │  ├─ edit_invoice_with_msc()                                        │    │
│  │  ├─ _build_system_prompt()                                         │    │
│  │  ├─ _parse_invoice_from_response()                                 │    │
│  │  └─ _clean_markdown()                                              │    │
│  └──────────────┬────────────────────────────────┬─────────────────────┘    │
│                 │                                │                           │
│                 │                                │                           │
│        ┌────────▼────────┐              ┌────────▼────────┐                 │
│        │                 │              │                 │                 │
│        │   LangChain     │              │   MSC Layer     │                 │
│        │   Integration   │              │                 │                 │
│        │                 │              │                 │                 │
│        └─────────────────┘              └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                       LANGCHAIN INTEGRATION LAYER                            │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    ChatBedrock (LangChain)                          │    │
│  │                                                                     │    │
│  │  Configuration:                                                     │    │
│  │  • Model: us.anthropic.claude-sonnet-4-20250514-v1:0              │    │
│  │  • Max Tokens: 4096                                                │    │
│  │  • Temperature: 0.7                                                │    │
│  │  • Region: us-east-1                                               │    │
│  │                                                                     │    │
│  │  Message Types:                                                     │    │
│  │  • SystemMessage  - Agent instructions                             │    │
│  │  • HumanMessage   - User prompts                                   │    │
│  │  • AIMessage      - Assistant responses                            │    │
│  └─────────────────────────────┬───────────────────────────────────────┘    │
│                                 │                                            │
│                                 │ AWS SDK                                    │
│                                 ▼                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    AWS Bedrock Service                              │    │
│  │                                                                     │    │
│  │  • Claude AI Model Hosting                                         │    │
│  │  • Request/Response Processing                                     │    │
│  │  • Authentication & Authorization                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         MSC PROCESSING LAYER                                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                  MSCParser (msc_parser.py)                          │    │
│  │                                                                     │    │
│  │  Functions:                                                         │    │
│  │  • parse() - Parse MSC content to structured data                  │    │
│  │  • _parse_cell() - Extract cell data                               │    │
│  │  • _parse_sheet() - Extract sheet info                             │    │
│  │  • _parse_format() - Extract formatting                            │    │
│  └─────────────────────────────┬───────────────────────────────────────┘    │
│                                 │                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                MSCCorrector (msc_parser.py)                         │    │
│  │                                                                     │    │
│  │  Validation & Correction:                                          │    │
│  │  • correct() - Main correction entry point                         │    │
│  │  • _validate_version() - Check version format                      │    │
│  │  • _validate_cells() - Validate cell references                    │    │
│  │  • _validate_formulas() - Check formula syntax                     │    │
│  │  • _fix_cell_references() - Correct cell coords                    │    │
│  └─────────────────────────────┬───────────────────────────────────────┘    │
│                                 │                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │            create_invoice_msc() (msc_parser.py)                     │    │
│  │                                                                     │    │
│  │  Convert JSON → MSC:                                                │    │
│  │  • Generate MSC header                                              │    │
│  │  • Create cell definitions                                          │    │
│  │  • Apply formatting                                                 │    │
│  │  • Set column widths                                                │    │
│  │  • Define formulas                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Send Message/Prompt
     ▼
┌──────────────────┐
│   FastAPI        │
│   Routes         │
└────┬─────────────┘
     │
     │ 2. Check/Create Session
     ▼
┌──────────────────┐
│ RedisSession     │◄──────┐
│ Manager          │       │
└────┬─────────────┘       │
     │                     │
     │ 3. Get History      │ 8. Store Updated
     │    & Validate       │    Session Data
     │    Token Limit      │
     ▼                     │
┌──────────────────┐       │
│ InvoiceAgent     │       │
└────┬─────────────┘       │
     │                     │
     │ 4. Build Messages   │
     │    (System +        │
     │     History +       │
     │     User Prompt)    │
     ▼                     │
┌──────────────────┐       │
│  LangChain       │       │
│  ChatBedrock     │       │
└────┬─────────────┘       │
     │                     │
     │ 5. Invoke Claude    │
     ▼                     │
┌──────────────────┐       │
│  AWS Bedrock     │       │
│  (Claude AI)     │       │
└────┬─────────────┘       │
     │                     │
     │ 6. AI Response      │
     ▼                     │
┌──────────────────┐       │
│ InvoiceAgent     │       │
│ - Parse JSON     │       │
│ - Clean Markdown │       │
└────┬─────────────┘       │
     │                     │
     │ 7. Convert to MSC   │
     ▼                     │
┌──────────────────┐       │
│  MSCParser &     │       │
│  MSCCorrector    │       │
└────┬─────────────┘       │
     │                     │
     │ MSC Content         │
     ├─────────────────────┘
     │
     │ 9. Return Response
     │    (message + msc_content)
     ▼
┌──────────────────┐
│   FastAPI        │
│   Response       │
└────┬─────────────┘
     │
     │ 10. JSON Response
     ▼
┌─────────┐
│  Client │
└─────────┘
```

## Key Technologies & Libraries

### Core Framework
- **FastAPI**: High-performance web framework
- **Uvicorn**: ASGI server

### AI/ML Layer
- **LangChain**: LLM orchestration framework
- **AWS Bedrock**: Managed AI service
- **Claude Sonnet 4**: Large language model
- **tiktoken**: Token counting

### Data Storage
- **Redis**: Session & conversation storage
- **JSON**: Data serialization

### Utilities
- **Pydantic**: Data validation & schemas
- **Python-dotenv**: Environment configuration
- **re (regex)**: Text parsing & cleaning

## Configuration (config.py)

```python
Settings:
├── API Configuration
│   ├── API_HOST (0.0.0.0)
│   ├── API_PORT (8000)
│   └── CORS_ORIGINS
│
├── Redis Configuration
│   ├── REDIS_HOST (localhost)
│   ├── REDIS_PORT (6379)
│   ├── REDIS_DB (0)
│   └── REDIS_PASSWORD
│
├── Session Management
│   ├── MAX_TOKEN_LIMIT (200,000)
│   └── SESSION_EXPIRY_SECONDS (86,400)
│
└── AWS Configuration
    ├── AWS_REGION (us-east-1)
    ├── AWS_ACCESS_KEY_ID
    ├── AWS_SECRET_ACCESS_KEY
    └── ANTHROPIC_MODEL
```

## API Request/Response Flow

### Generate Invoice Request
```json
POST /api/generate-invoice
{
  "session_id": "optional-uuid",
  "initial_prompt": "Create invoice for..."
}
```

### Response
```json
{
  "session_id": "uuid",
  "message": "Plain text response",
  "msc_content": "MSC format spreadsheet",
  "token_count": 1234,
  "timestamp": "2025-11-01T..."
}
```

## Security & Performance Features

1. **Token Limiting**: Prevents excessive API usage (200K token limit)
2. **Session Expiry**: Auto-cleanup after 24 hours
3. **CORS Protection**: Configured allowed origins
4. **Error Handling**: Comprehensive exception management
5. **Redis Persistence**: Fast session retrieval
6. **Markdown Cleaning**: Sanitized user-facing output

## Scalability Considerations

- **Stateless API**: Session data in Redis, not in-memory
- **Horizontal Scaling**: Multiple FastAPI instances possible
- **Redis Clustering**: Can scale Redis for higher loads
- **AWS Bedrock**: Managed, auto-scaling AI service
- **Connection Pooling**: Efficient resource management

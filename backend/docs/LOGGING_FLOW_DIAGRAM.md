# Logging Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GENERATE-INVOICE API ENDPOINT                         │
│                           (app/api/routes.py)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: [Request ID] API REQUEST STARTED              │
        │  - Initial prompt preview                            │
        │  - Invoice image presence                            │
        │  - Session ID                                        │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Session Management                             │
        │  - Create new / Use existing session                 │
        │  - Session ID assignment                             │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Starting Template Generation Pipeline          │
        │  - Pipeline overview                                 │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TEMPLATE GENERATION PIPELINE                              │
│              (app/services/template_generation_agent.py)                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ╔═════════════════════════════════════════════════════╗
        ║  STEP 1: CELL MAPPINGS GENERATION                   ║
        ║  Agent: MetaAndCellMapAgent                         ║
        ╚═════════════════════════════════════════════════════╝
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Invoking MetaAndCellMapAgent                   │
        │  - Method call                                       │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  Agent processes prompt + image                      │
        │  Generates template metadata + cell mappings         │
        └─────────────────────────────────────────────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │                                  │
                     ▼                                  ▼
        ┌──────────────────────┐         ┌──────────────────────┐
        │  ✓ SUCCESS           │         │  ✗ FAILURE           │
        │  LOG: Template name  │         │  LOG: Error details  │
        │  LOG: Category       │         │  LOG: Traceback      │
        │  LOG: Device type    │         │  RAISE Exception     │
        │  LOG: Cell mappings  │         └──────────────────────┘
        └──────────────────────┘
                     │
                     ▼
        ╔═════════════════════════════════════════════════════╗
        ║  STEP 2: SAVESTR GENERATION                         ║
        ║  Agent: SaveStrAgent                                ║
        ╚═════════════════════════════════════════════════════╝
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Invoking SaveStrAgent                          │
        │  - Input parameters                                  │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  Agent converts mappings to MSC format               │
        │  Generates SocialCalc save string                    │
        └─────────────────────────────────────────────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │                                  │
                     ▼                                  ▼
        ┌──────────────────────┐         ┌──────────────────────┐
        │  ✓ SUCCESS           │         │  ✗ FAILURE           │
        │  LOG: SaveStr length │         │  LOG: Error details  │
        │  LOG: Line count     │         │  LOG: Traceback      │
        │  LOG: Content preview│         │  RAISE Exception     │
        └──────────────────────┘         └──────────────────────┘
                     │
                     ▼
        ╔═════════════════════════════════════════════════════╗
        ║  STEP 3: VALIDATION LOOP (Max 5 Retries)           ║
        ║  Validator: MSCValidator                            ║
        ╚═════════════════════════════════════════════════════╝
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Validation Loop Started                        │
        │  - Max retries: 5                                    │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │  VALIDATION ATTEMPT LOOP         │
                    │  (attempts = 1 to max_retries)   │
                    └─────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Validation Attempt X/5                         │
        │  - Invoking MSCValidator                             │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  Validator checks MSC format                         │
        │  Applies auto-corrections                            │
        └─────────────────────────────────────────────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │                                  │
                     ▼                                  ▼
        ┌──────────────────────┐         ┌──────────────────────┐
        │  ✓ VALIDATION PASSED │         │  ✗ VALIDATION FAILED │
        │  LOG: Success        │         │  LOG: Error count    │
        │  LOG: Auto-correct   │         │  LOG: Error list     │
        │  BREAK loop          │         │                      │
        └──────────────────────┘         └──────────┬───────────┘
                     │                              │
                     │              ┌───────────────┴────────────┐
                     │              │                             │
                     │              ▼                             ▼
                     │   ┌────────────────────┐     ┌──────────────────┐
                     │   │ attempts < max?    │     │ attempts >= max? │
                     │   │ YES: Request fix   │     │ YES: Use last    │
                     │   └─────────┬──────────┘     │      version     │
                     │             │                 └────────┬─────────┘
                     │             ▼                          │
                     │   ┌─────────────────────────┐         │
                     │   │ LOG: Request fixes      │         │
                     │   │ Invoke SaveStr fix      │         │
                     │   │ LOG: Received corrected │         │
                     │   │ Loop back to attempt    │         │
                     │   └─────────┬───────────────┘         │
                     │             │                          │
                     │             └──────────────────────────┘
                     │                        │
                     └────────────────────────┘
                                      │
                                      ▼
        ╔═════════════════════════════════════════════════════╗
        ║  STEP 4: RESPONSE GENERATION                        ║
        ╚═════════════════════════════════════════════════════╝
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Generating User Response                       │
        │  - Generate human-readable text                      │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Response generated                             │
        │  - Character count                                   │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Assembling final response                      │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: PIPELINE COMPLETED                             │
        │  - Status: SUCCESS / PARTIAL SUCCESS                 │
        │  - Validation attempts used                          │
        │  - Final error count                                 │
        │  - Template name                                     │
        │  - SaveStr length                                    │
        │  - Response text length                              │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACK TO API ENDPOINT                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Template Generation Completed                  │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Generated Template Details                     │
        │  - Template name, category, device type              │
        │  - Cell mappings summary                             │
        │  - SaveStr details                                   │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Validation Results                             │
        │  - Valid/invalid status                              │
        │  - Attempts used                                     │
        │  - Final errors (if any)                             │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Updating Session                               │
        │  - Add messages to session                           │
        │  - Store template data                               │
        │  - Token count                                       │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: Response Summary                               │
        │  - Session ID                                        │
        │  - Response text length                              │
        │  - Token count                                       │
        │  - Final status                                      │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: [Request ID] API REQUEST COMPLETED             │
        │       SUCCESSFULLY                                   │
        └─────────────────────────────────────────────────────┘
                                      │
                                      ▼
                                  [RETURN]


ERROR PATHS (at any stage):
═══════════════════════════════

        ┌─────────────────────────────────────────────────────┐
        │  Exception caught                                    │
        └──────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │ValueError│   │HTTPExcept│   │ General      │
    │          │   │ion       │   │ Exception    │
    └────┬─────┘   └────┬─────┘   └──────┬───────┘
         │              │                 │
         └──────────────┴─────────────────┘
                        │
                        ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: ERROR details                                  │
        │  - Exception type                                    │
        │  - Exception message                                 │
        │  - Full traceback                                    │
        └─────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌─────────────────────────────────────────────────────┐
        │  LOG: [Request ID] API REQUEST FAILED                │
        └─────────────────────────────────────────────────────┘
                        │
                        ▼
                [RAISE HTTPException]


LEGEND:
═══════
╔═══╗  Pipeline Steps (numbered)
║   ║
╚═══╝

┌───┐  Log entries and operations
│   │
└───┘

  │    Sequential flow
  ▼

  ┌──┴──┐  Decision point
  │     │
  ▼     ▼

✓ Success indicator
✗ Failure indicator
```

## Key Logging Points

1. **Request Tracking**: Unique request ID assigned at API entry
2. **Agent Invocations**: Each agent call is logged before execution
3. **Success/Failure**: Explicit success (✓) or failure (✗) logging
4. **Validation Loop**: Each attempt logged separately with results
5. **Auto-Corrections**: Tracked when validator applies fixes
6. **Error Context**: Full tracebacks and error details
7. **Metrics**: Lengths, counts, attempts tracked throughout
8. **Response Assembly**: Final structure logged before return

## Log Volume Estimates

- **Successful request (1 validation attempt)**: ~40-50 log lines
- **Request with 3 validation attempts**: ~80-100 log lines
- **Failed request**: ~30-40 log lines (depending on stage)

## Performance Impact

- Minimal overhead (< 1% typical)
- File I/O buffered by Python logging
- String formatting only when logged
- No impact when log level is WARNING/ERROR

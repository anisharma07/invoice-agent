# Backend Folder Structure

## Overview

All backend code, including the JavaScript validator, is now self-contained in the `backend/` directory.

## Directory Structure

```
backend/
├── app/                          # Main application code
│   ├── __init__.py
│   ├── main.py                   # FastAPI application
│   ├── config.py                 # Configuration
│   ├── api/                      # API routes
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── models/                   # Data models
│   │   ├── __init__.py
│   │   └── schemas.py
│   └── services/                 # Business logic
│       ├── __init__.py
│       ├── invoice_agent.py      # Invoice generation agent
│       ├── invoice_editing_agent.py
│       ├── msc_validator.py      # Python wrapper for validator
│       ├── msc_parser.py         # (Deprecated) Old parser
│       └── redis_manager.py
│
├── msc_validator/                # JavaScript validator (self-contained)
│   ├── validate-cli.js           # CLI interface
│   ├── validator.js              # Core validator
│   └── README.md                 # Validator documentation
│
├── docs/                         # Documentation
│   ├── MSC_VALIDATOR_MIGRATION.md
│   ├── BEFORE_AFTER_COMPARISON.md
│   ├── VALIDATOR_INTEGRATION_SUMMARY.md
│   ├── DOCKER_QUICKSTART.md
│   ├── DOCKER_SETUP.md
│   └── DOCKER_IMPLEMENTATION_SUMMARY.md
│
├── tests/                        # Test files (if any)
├── venv/                         # Python virtual environment
│
├── docker/                       # Docker-related files
│   ├── Dockerfile                # Docker configuration
│   ├── docker-compose.yml        # Docker Compose config
│   ├── docker-compose.prod.yml   # Production Docker config
│   ├── docker-manager.sh         # Docker management script
│   └── .dockerignore             # Docker ignore file
│
├── test_validator_standalone.py # Standalone validator test
├── test_msc_validator.py         # Integration test
├── QUICKSTART.md                 # Quick start guide
├── requirements.txt              # Python dependencies
└── README.md                     # (if exists)
```

## Key Components

### MSC Validator (`msc_validator/`)

All JavaScript validator files are now in `backend/msc_validator/`:
- **`validator.js`**: Core SocialCalc validator class
- **`validate-cli.js`**: Command-line interface
- **`README.md`**: Validator documentation

**Why this location?**
- Self-contained backend
- No external dependencies on parent directories
- Easy to deploy with backend
- Simpler path resolution

### Python Wrapper (`app/services/msc_validator.py`)

Python interface to the JavaScript validator:
```python
from app.services.msc_validator import MSCValidator, create_invoice_msc

validator = MSCValidator()
result = validator.validate(msc_content)
```

**Location**: `backend/app/services/msc_validator.py`

### Invoice Agent (`app/services/invoice_agent.py`)

Invoice generation with automatic MSC validation:
```python
from app.services.invoice_agent import InvoiceAgent

agent = InvoiceAgent()
response, invoice_data, msc_content = agent.generate_invoice_with_msc(prompt)
```

**Location**: `backend/app/services/invoice_agent.py`

## Path References

### Python to JavaScript Validator

```python
# In msc_validator.py
validator_dir = Path(__file__).parent.parent.parent / "msc_validator"
# Resolves to: backend/msc_validator/
```

### Standalone Tests

```python
# In test_validator_standalone.py
validator_dir = Path(__file__).parent / "msc_validator"
# Resolves to: backend/msc_validator/
```

## Benefits of This Structure

1. **Self-Contained**: All backend code in one directory
2. **No External Dependencies**: Doesn't rely on parent directory structure
3. **Easy Deployment**: Just deploy the `backend/` folder
4. **Docker-Friendly**: Simple to containerize
5. **Clear Separation**: Backend code separated from frontend/renderer

## Running Tests

### From Backend Directory

```bash
cd backend
python3 test_validator_standalone.py
```

### Direct Validator Test

```bash
cd backend/msc_validator
node validate-cli.js --string "version:1.5\ncell:A1:v:100"
```

## Docker Deployment

When deploying with Docker, the `msc_validator/` directory is included:

```dockerfile
# In Dockerfile
COPY msc_validator/ /app/msc_validator/
```

The validator is accessible from the Python code via the same relative path.

## Dependencies

### Python Dependencies
- Listed in `requirements.txt`
- Includes: FastAPI, langchain, redis, etc.

### JavaScript Dependencies
- **Node.js v14+** (system requirement)
- No npm packages needed (validator is standalone)

## Maintenance

### Updating the Validator

If the validator in `../socialcalc-validator/` is updated:

1. Copy updated files:
```bash
cp ../socialcalc-validator/validator.js backend/msc_validator/
cp ../socialcalc-validator/validate-cli.js backend/msc_validator/
```

2. Test:
```bash
cd backend
python3 test_validator_standalone.py
```

### Version Sync

The validator files in `backend/msc_validator/` should be kept in sync with the main validator. Consider:
- Using git submodules (if validator is in separate repo)
- Build scripts to copy files
- Automated tests to verify versions match

## Environment Variables

No additional environment variables needed for the validator. It works out of the box.

## Troubleshooting

### "JavaScript validator not found"

```bash
# Check files exist
ls backend/msc_validator/validate-cli.js
ls backend/msc_validator/validator.js

# Verify from Python
python3 -c "from pathlib import Path; print((Path('app/services') / '../../msc_validator').resolve())"
```

### Path Issues

All paths are relative to the backend directory:
- From `app/services/`: `../../msc_validator/`
- From `backend/`: `./msc_validator/`
- From tests: `./msc_validator/`

## Documentation

- **Quick Start**: `QUICKSTART.md`
- **Migration Guide**: `docs/MSC_VALIDATOR_MIGRATION.md`
- **Comparison**: `docs/BEFORE_AFTER_COMPARISON.md`
- **Validator Details**: `msc_validator/README.md`

## Summary

✅ All backend code is in `backend/`
✅ JavaScript validator is in `backend/msc_validator/`
✅ Python wrapper automatically finds the validator
✅ No external path dependencies
✅ Ready for deployment

This structure makes the backend fully self-contained and easy to deploy independently.

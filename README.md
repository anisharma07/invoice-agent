# Strk-Invoice-AI 🤖📊

> An AI-powered invoice generation and spreadsheet management system with natural language processing capabilities, powered by Claude Sonnet 3.5 and AWS Bedrock.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.8+-green.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

## 🌟 Overview

Strk-Invoice-AI is a comprehensive AI-powered invoice generation and spreadsheet management platform that combines conversational AI with advanced spreadsheet capabilities. Create, edit, and manage invoices using natural language commands, with real-time preview and export functionality.

### Key Features

- 🤖 **AI-Powered Generation**: Generate invoices using natural language with Claude Sonnet 3.5
- 💬 **Conversational Interface**: Chat-based interaction for creating and editing spreadsheets
- 📊 **MSC Format Support**: Native Multi-Sheet Calc (MSC) syntax for complex spreadsheets
- 🔄 **Real-time Preview**: Instant visualization of generated invoices and spreadsheets
- 📱 **Progressive Web App**: Works offline and installable on mobile devices
- 🐳 **Docker Ready**: One-command deployment with Docker Compose
- 🎨 **Professional Templates**: Pre-built templates for various invoice types
- 🔐 **Session Management**: Persistent conversations with Redis caching

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│            React Frontend (Vite + Ionic)            │
│  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ Chat Interface   │  │  Invoice Preview     │   │
│  │ • Natural Lang.  │  │  • SocialCalc render │   │
│  │ • Token counter  │  │  • Export (PDF/JSON) │   │
│  └──────────────────┘  └──────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────┐
│              FastAPI Backend                        │
│  ┌──────────────────────────────────────────────┐  │
│  │  Invoice Agent Service                       │  │
│  │  • Claude Sonnet 3.5 (AWS Bedrock)          │  │
│  │  • LangChain orchestration                  │  │
│  │  • MSC parser & validator                   │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Redis Session Manager                       │  │
│  │  • Conversation history                      │  │
│  │  • Token tracking                            │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (recommended)
  - OR Python 3.8+ and Node.js 18+ for manual setup
- **AWS Account** with Bedrock access
- **Claude Sonnet 3.5** API access via AWS Bedrock

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/anisharma07/Strk-Invoice-AI.git
   cd Strk-Invoice-AI
   ```

2. **Configure environment variables**
   ```bash
   # Create .env file in root directory
   cat > .env << EOF
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   AWS_REGION=us-east-1
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   CLAUDE_CODE_USE_BEDROCK=true
   REDIS_HOST=redis
   REDIS_PORT=6379
   EOF
   ```

3. **Start the application**
   ```bash
   cd backend/docker
   chmod +x docker-manager.sh
   ./docker-manager.sh start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1

# Start Redis (required)
docker run -d -p 6379:6379 redis:alpine

# Run the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📖 Usage

### Creating an Invoice

1. Open the application at http://localhost:3000
2. Click on "Chat" or "AI Invoice Editor"
3. Use natural language to create an invoice:
   ```
   Create an invoice for John Doe for consulting services worth $5000
   ```

4. The AI will generate a formatted invoice in real-time
5. Export to PDF, MSC, or JSON format

### Example Commands

- `"Create a medical invoice for dental services"`
- `"Add a line item for software development at $150/hour for 40 hours"`
- `"Change the invoice date to January 15, 2025"`
- `"Add a 10% discount to the total"`
- `"Create a budget spreadsheet with 5 categories"`

### Editing Invoices

The AI agent supports conversational editing:
- Add/remove line items
- Update prices and quantities
- Change dates and customer information
- Apply discounts and taxes
- Modify formatting and styling

## 🛠️ Technology Stack

### Frontend
- **React 18.3** - UI framework
- **Vite** - Build tool and dev server
- **Ionic Framework** - Mobile-first components
- **TypeScript** - Type-safe development
- **SocialCalc** - Spreadsheet rendering engine
- **PWA Support** - Offline functionality

### Backend
- **FastAPI** - High-performance API framework
- **Python 3.8+** - Backend language
- **LangChain** - LLM orchestration
- **AWS Bedrock** - Claude AI integration
- **Redis** - Session and cache management
- **Pydantic** - Data validation

### AI & ML
- **Claude Sonnet 3.5** - Language model
- **Amazon Bedrock** - AI service platform
- **LangChain** - Agent framework
- **Custom MSC Parser** - Spreadsheet format handling

## 📁 Project Structure

```
Strk-Invoice-AI/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # REST API endpoints
│   │   ├── services/       # Business logic
│   │   │   ├── invoice_agent.py
│   │   │   ├── invoice_editing_agent.py
│   │   │   ├── msc_parser.py
│   │   │   └── redis_manager.py
│   │   ├── models/         # Data models
│   │   └── config.py       # Configuration
│   └── requirements.txt
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API clients
│   │   ├── contexts/       # React contexts
│   │   └── pages/          # Page components
│   └── package.json
├── docs/                    # Documentation
│   ├── QUICKSTART.md
│   ├── TESTING_GUIDE.md
│   └── FRONTEND_API_DOCUMENTATION.md
├── data/
│   └── training.jsonl      # AI training examples
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | Required |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Required |
| `AWS_REGION` | AWS region | `us-east-1` |
| `ANTHROPIC_MODEL` | Claude model version | `claude-3-5-sonnet-20241022` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `CLAUDE_CODE_USE_BEDROCK` | Use Bedrock API | `true` |

## 📚 Documentation

- [Quick Start Guide](docs/QUICKSTART.md) - Get started in 5 minutes
- [Docker Quick Start](DOCKER_QUICKSTART.md) - Docker deployment guide
- [Testing Guide](docs/TESTING_GUIDE.md) - Testing instructions
- [API Documentation](docs/FRONTEND_API_DOCUMENTATION.md) - Frontend API reference
- [Architecture Overview](ARCHITECTURE.txt) - System architecture details
- [Backend Architecture](docs/BACKEND_ARCHITECTURE.md) - Backend design
- [Security Guide](SECURITY.md) - Security best practices

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test.e2e
```

## 🐳 Docker Commands

All Docker files are located in `backend/docker/`:

```bash
# Navigate to docker directory
cd backend/docker

# Start all services
./docker-manager.sh start

# Stop all services
./docker-manager.sh stop

# View logs
./docker-manager.sh logs

# Restart services
./docker-manager.sh restart

# Clean up
./docker-manager.sh clean
```

## 📊 Supported Document Types

- ✅ Business Invoices
- ✅ Medical Invoices (various specialties)
- ✅ Service Invoices
- ✅ Product Invoices
- ✅ Budget Spreadsheets
- ✅ Financial Reports
- ✅ Data Tables with Formulas
- ✅ Custom Spreadsheets

## 🎨 Features in Detail

### AI-Powered Invoice Generation
- Natural language understanding
- Context-aware responses
- Multi-turn conversations
- Error correction and validation
- Professional formatting

### Spreadsheet Capabilities
- Cell formulas (SUM, AVERAGE, IF, etc.)
- Date functions (TODAY, DATE)
- Cell merging (colspan/rowspan)
- Styling (fonts, colors, borders)
- Alignment and formatting
- Complex calculations

### Export Options
- PDF export with professional styling
- JSON format for data interchange
- MSC format for SocialCalc compatibility
- HTML for web viewing

### Session Management
- Persistent conversations
- Token usage tracking (200k limit)
- Automatic session cleanup
- Redis-backed storage

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic** for Claude AI
- **AWS** for Bedrock platform
- **SocialCalc** for spreadsheet rendering
- **LangChain** for LLM orchestration
- **FastAPI** and **React** communities

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/anisharma07/Strk-Invoice-AI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/anisharma07/Strk-Invoice-AI/discussions)
- **Documentation**: [docs/](docs/)

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] More invoice templates
- [ ] Advanced formula support
- [ ] Collaborative editing
- [ ] Mobile app (iOS/Android)
- [ ] Export to Excel/Google Sheets
- [ ] Custom branding options
- [ ] API rate limiting
- [ ] User authentication

---

**Made with ❤️ by the Strk-Invoice-AI Team**

For detailed setup instructions, see [QUICKSTART.md](docs/QUICKSTART.md) or [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md)
# invoice-agent

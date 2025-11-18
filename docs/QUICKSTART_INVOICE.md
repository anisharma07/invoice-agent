# 🚀 Quick Start Guide - Invoice Agent

## Fastest Way to Get Started

### Step 1: Verify Your Setup

Your `.env` file is already configured with AWS credentials. ✅

### Step 2: Choose Your Method

#### Method A: Docker (Easiest - One Command)

```bash
cd "/home/anirudh-sharma/Desktop/SocialCalc Stuff/Starknet/Langchain-Claude-Agent"
chmod +x run_docker.sh
./run_docker.sh
```

**That's it!** Everything (Redis, Backend, Frontend) starts automatically.

- 🌐 Open browser: http://localhost:3000
- 📚 API Docs: http://localhost:8000/docs

#### Method B: Manual (More Control)

**One-time setup**:
```bash
cd "/home/anirudh-sharma/Desktop/SocialCalc Stuff/Starknet/Langchain-Claude-Agent"
chmod +x setup_invoice_agent.sh run_invoice_agent.sh
./setup_invoice_agent.sh
```

**Start Redis** (if not already running):
```bash
redis-server --daemonize yes
```

**Run the app**:
```bash
./run_invoice_agent.sh
```

- 🌐 Frontend: http://localhost:3000
- 🔧 Backend: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs

### Step 3: Start Creating Invoices!

Once the app is running, try these prompts:

1. **"Create an invoice for web development services worth $5000"**

2. **"Change the client name to Acme Corporation"**

3. **"Add a line item for $500 consulting and set due date to February 28, 2025"**

4. **"Add 10% tax"**

## 🎯 Key Features

- ✨ **Natural Language**: Just type what you want
- 💬 **Real-time Chat**: Conversational invoice editing
- 👀 **Live Preview**: See changes instantly
- 💾 **Session Management**: Your work is saved automatically
- 📊 **Token Tracking**: Know how much of your 200k limit you've used
- 🔄 **Export**: Download invoices as JSON

## 🛑 To Stop

- **Docker**: Press `Ctrl+C` then run `docker-compose down`
- **Manual**: Press `Ctrl+C` in the terminal

## 🆘 Troubleshooting

### Redis Not Running
```bash
redis-server --daemonize yes
# Or with Docker
docker run -d -p 6379:6379 redis:alpine
```

### Port Already in Use
Kill existing processes:
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Can't Connect to Backend
- Check if backend is running on http://localhost:8000
- Verify `.env` file has correct AWS credentials
- Check Redis is accessible: `redis-cli ping`

## 📖 Full Documentation

See `INVOICE_AGENT_README.md` for complete documentation.

## 🎉 You're Ready!

Your Invoice Agent is configured and ready to use with your AWS Bedrock credentials. Start the application and begin creating invoices with AI! 🚀

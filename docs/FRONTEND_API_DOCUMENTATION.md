# Frontend API & Chat Functionality Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [API Service Layer](#api-service-layer)
3. [Component Architecture](#component-architecture)
4. [Chat Functionality](#chat-functionality)
5. [State Management](#state-management)
6. [Data Flow](#data-flow)
7. [Error Handling](#error-handling)
8. [Session Management](#session-management)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                             │
│                                                                      │
│  ┌────────────────────────┐         ┌─────────────────────────┐    │
│  │   ChatInterface.jsx    │         │    MSCViewer.jsx        │    │
│  │                        │         │                         │    │
│  │  • Message Display     │         │  • MSC Parsing          │    │
│  │  • Input Form          │         │  • Table Rendering      │    │
│  │  • Token Counter       │         │  • Format Application   │    │
│  │  • Typing Indicator    │         │  • Cell Merging         │    │
│  └────────────┬───────────┘         └───────────┬─────────────┘    │
│               │                                  │                  │
│               └──────────────┬───────────────────┘                  │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER (App.jsx)                    │
│                                                                      │
│  State Management:                                                   │
│  ├─ sessionId          (Current session UUID)                       │
│  ├─ messages[]         (Chat history)                               │
│  ├─ mscContent         (Generated MSC spreadsheet)                  │
│  ├─ sessionInfo        (Token count, metadata)                      │
│  ├─ isLoading          (Loading state)                              │
│  ├─ error              (Error messages)                             │
│  └─ lastApiResponse    (Debug data)                                 │
│                                                                      │
│  Event Handlers:                                                     │
│  ├─ handleSendMessage()    - Process user messages                  │
│  ├─ handleNewSession()     - Reset session                          │
│  ├─ handleExportMSC()      - Download MSC file                      │
│  └─ loadSession()          - Restore session from localStorage      │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API SERVICE LAYER (api.js)                      │
│                                                                      │
│  invoiceAPI:                                                         │
│  ├─ generateInvoice()      - POST /api/generate-invoice             │
│  ├─ chat()                 - POST /api/chat                          │
│  ├─ getSessionInfo()       - GET  /api/session/{id}                 │
│  ├─ deleteSession()        - DELETE /api/session/{id}               │
│  └─ healthCheck()          - GET  /api/health                        │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND API (FastAPI)                           │
│                     http://localhost:8000                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Service Layer

### Location: `src/services/api.js`

### Configuration

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
```

### API Methods

#### 1. `generateInvoice(initialPrompt, sessionId)`

**Purpose**: Create a new invoice or start a new conversation session.

**Parameters**:
- `initialPrompt` (string, required): User's initial request/prompt
- `sessionId` (string, optional): Existing session ID to continue

**Request**:
```javascript
POST /api/generate-invoice
{
  "initial_prompt": "Create an invoice for web development services",
  "session_id": "uuid-or-null"
}
```

**Response**:
```javascript
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "I've created an invoice for web development services...",
  "msc_content": "version:1.5\ncell:A1:t:INVOICE...",
  "token_count": 1234,
  "timestamp": "2025-11-01T10:30:00.000Z"
}
```

**Usage Example**:
```javascript
const response = await invoiceAPI.generateInvoice(
    "Create an invoice for consulting services",
    null  // No existing session
);
```

---

#### 2. `chat(sessionId, message)`

**Purpose**: Continue an existing conversation and edit the invoice.

**Parameters**:
- `sessionId` (string, required): Active session UUID
- `message` (string, required): User's message/edit request

**Request**:
```javascript
POST /api/chat
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Add a line item for $500 consulting"
}
```

**Response**:
```javascript
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "I've added a consulting line item for $500...",
  "msc_content": "version:1.5\ncell:A1:t:INVOICE...",
  "token_count": 2456,
  "token_limit": 200000,
  "timestamp": "2025-11-01T10:35:00.000Z"
}
```

**Usage Example**:
```javascript
const response = await invoiceAPI.chat(
    sessionId,
    "Change the due date to next month"
);
```

---

#### 3. `getSessionInfo(sessionId)`

**Purpose**: Retrieve metadata about a session.

**Parameters**:
- `sessionId` (string, required): Session UUID

**Request**:
```javascript
GET /api/session/{session_id}
```

**Response**:
```javascript
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-11-01T10:00:00.000Z",
  "last_activity": "2025-11-01T10:35:00.000Z",
  "token_count": 2456,
  "message_count": 8,
  "expires_in_seconds": 82800
}
```

**Usage Example**:
```javascript
const sessionInfo = await invoiceAPI.getSessionInfo(sessionId);
console.log(`Session expires in: ${sessionInfo.expires_in_seconds}s`);
```

---

#### 4. `deleteSession(sessionId)`

**Purpose**: Delete a session and free up resources.

**Parameters**:
- `sessionId` (string, required): Session UUID

**Request**:
```javascript
DELETE /api/session/{session_id}
```

**Response**:
```javascript
{
  "message": "Session {session_id} deleted successfully"
}
```

**Usage Example**:
```javascript
await invoiceAPI.deleteSession(sessionId);
```

---

#### 5. `healthCheck()`

**Purpose**: Check API and backend service health.

**Request**:
```javascript
GET /api/health
```

**Response**:
```javascript
{
  "status": "healthy",
  "redis": "connected",
  "timestamp": "2025-11-01T10:00:00.000Z"
}
```

**Usage Example**:
```javascript
const health = await invoiceAPI.healthCheck();
if (health.status !== 'healthy') {
    console.warn('Backend service is unhealthy');
}
```

---

## Component Architecture

### 1. App Component (`App.jsx`)

**Purpose**: Main application container managing state and orchestrating child components.

#### State Variables

```javascript
const [sessionId, setSessionId] = useState(null);
// Current session UUID, null if no active session

const [messages, setMessages] = useState([]);
// Array of chat messages: [{ role, content, timestamp }]

const [mscContent, setMscContent] = useState(null);
// MSC format spreadsheet content string

const [isLoading, setIsLoading] = useState(false);
// Loading state during API calls

const [sessionInfo, setSessionInfo] = useState(null);
// Session metadata: { token_count, message_count, ... }

const [error, setError] = useState(null);
// Error messages for display

const [showDebug, setShowDebug] = useState(false);
// Toggle debug panel visibility

const [lastApiResponse, setLastApiResponse] = useState(null);
// Last API response for debugging
```

#### Key Methods

##### `loadSession(sid)`
```javascript
const loadSession = async (sid) => {
    try {
        const info = await invoiceAPI.getSessionInfo(sid);
        setSessionId(sid);
        setSessionInfo(info);
    } catch (err) {
        // Session expired or not found
        localStorage.removeItem('invoice_session_id');
        setSessionId(null);
        setSessionInfo(null);
    }
};
```
**Purpose**: Restore a previous session from localStorage on app load.

---

##### `handleSendMessage(message)`
```javascript
const handleSendMessage = async (message) => {
    setIsLoading(true);
    setError(null);

    // Add user message to UI immediately
    const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
        let response;

        if (!sessionId) {
            // First message - generate new invoice
            response = await invoiceAPI.generateInvoice(message);
            setSessionId(response.session_id);
            localStorage.setItem('invoice_session_id', response.session_id);
        } else {
            // Continue conversation
            response = await invoiceAPI.chat(sessionId, message);
        }

        // Add assistant message
        const assistantMessage = {
            role: 'assistant',
            content: response.message,
            timestamp: response.timestamp,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update MSC content
        if (response.msc_content) {
            setMscContent(response.msc_content);
        }

        // Update session info
        if (response.token_count !== undefined) {
            setSessionInfo({
                ...sessionInfo,
                token_count: response.token_count,
                message_count: messages.length + 2,
            });
        }
    } catch (err) {
        // Error handling...
    } finally {
        setIsLoading(false);
    }
};
```
**Purpose**: Main message handling logic - determines whether to start new session or continue existing one.

---

##### `handleNewSession()`
```javascript
const handleNewSession = () => {
    setSessionId(null);
    setMessages([]);
    setMscContent(null);
    setSessionInfo(null);
    setError(null);
    localStorage.removeItem('invoice_session_id');
};
```
**Purpose**: Reset application state and start fresh session.

---

##### `handleExportMSC()`
```javascript
const handleExportMSC = () => {
    if (!mscContent) return;

    const dataBlob = new Blob([mscContent], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${new Date().getTime()}.msc`;
    link.click();
    URL.revokeObjectURL(url);
};
```
**Purpose**: Download MSC content as a file.

---

### 2. ChatInterface Component (`ChatInterface.jsx`)

**Purpose**: Chat UI for user interaction with the AI agent.

#### Props

```javascript
{
  messages: Array,        // Chat message history
  onSendMessage: Function,  // Callback when user sends message
  isLoading: Boolean,     // Loading state
  sessionInfo: Object     // Session metadata for token display
}
```

#### Features

1. **Message Display**
   - User messages (right-aligned, blue)
   - Assistant messages (left-aligned, gray)
   - Timestamps
   - Auto-scroll to latest message

2. **Input Form**
   - Text input field
   - Send button
   - Disabled during loading
   - Enter key to submit

3. **Token Counter**
   - Visual progress bar
   - Current count / 200,000 limit
   - Color changes (green → red at 80%)

4. **Welcome Message**
   - Shows when no messages exist
   - Example prompts to guide users

5. **Typing Indicator**
   - Animated dots during loading

#### Key Methods

##### `scrollToBottom()`
```javascript
const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};
```
**Purpose**: Auto-scroll to latest message when new message arrives.

##### `formatTimestamp(timestamp)`
```javascript
const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};
```
**Purpose**: Format ISO timestamp to readable time (e.g., "10:30 AM").

---

### 3. MSCViewer Component (`MSCViewer.jsx`)

**Purpose**: Parse and render MSC format spreadsheets as HTML tables.

#### Props

```javascript
{
  mscContent: String  // MSC format content
}
```

#### Features

1. **MSC Parsing**
   - Cell data extraction
   - Format definitions
   - Column/row specifications
   - Border and style parsing

2. **Table Rendering**
   - Dynamic HTML table generation
   - Cell merging (colspan/rowspan)
   - Style application (fonts, borders, colors)
   - Text alignment
   - Number formatting

3. **Format Support**
   - Bold/italic text
   - Font sizes and families
   - Cell borders
   - Background colors
   - Text alignment
   - Cell padding

#### Key Methods

##### `parseInvoiceData(data)`
```javascript
const parseInvoiceData = (data) => {
    const lines = data.trim().split('\n');
    const cells = {};
    const cols = {};
    const rows = {};
    // ... parsing logic
    return { cells, cols, rows, sheetInfo, borders, cellformats, ... };
};
```
**Purpose**: Parse MSC string format into structured JavaScript objects.

##### `renderMSC(data)`
```javascript
const renderMSC = (data) => {
    const parsed = parseInvoiceData(data);
    
    // Create grid for merged cell tracking
    const grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
    
    // Build HTML table with proper formatting
    // Apply styles, borders, merges, etc.
};
```
**Purpose**: Convert parsed MSC data into rendered HTML table.

##### `columnToIndex(col)`
```javascript
const columnToIndex = (col) => {
    let index = 0;
    for (let i = 0; i < col.length; i++) {
        index = index * 26 + (col.charCodeAt(i) - 64);
    }
    return index;
};
```
**Purpose**: Convert Excel-style column letters (A, B, AA) to numeric indices.

---

## Chat Functionality

### Message Flow

```
┌─────────────┐
│    User     │
│ Types Msg   │
└──────┬──────┘
       │
       │ 1. User types and presses Enter
       ▼
┌──────────────────┐
│  ChatInterface   │
│  handleSubmit()  │
└──────┬───────────┘
       │
       │ 2. Call onSendMessage prop
       ▼
┌──────────────────┐
│   App.jsx        │
│ handleSendMessage│
└──────┬───────────┘
       │
       │ 3. Add user message to state immediately
       │    (Optimistic UI update)
       ▼
┌──────────────────┐
│  Update State    │
│  messages.push() │
└──────┬───────────┘
       │
       │ 4. Determine if new session or existing
       ▼
   ┌───────────────────┐
   │  sessionId exists?│
   └───────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
    Yes         No
     │           │
     │           │ 5a. generateInvoice()
     │           │     (First message)
     │           │
     │           └─────────┐
     │                     │
     │ 5b. chat()          │
     │     (Continue)      │
     │                     │
     └─────────┬───────────┘
               │
               │ 6. API call via axios
               ▼
       ┌──────────────┐
       │  Backend API │
       └──────┬───────┘
              │
              │ 7. AI processes request
              │    Generates MSC content
              ▼
       ┌──────────────┐
       │   Response   │
       │  {message,   │
       │  msc_content}│
       └──────┬───────┘
              │
              │ 8. Add assistant message to state
              │    Update MSC content
              ▼
       ┌──────────────┐
       │  Update UI   │
       │  • Messages  │
       │  • MSC View  │
       │  • Tokens    │
       └──────────────┘
```

### Message Object Structure

```javascript
{
  role: 'user' | 'assistant',  // Message sender
  content: String,              // Message text
  timestamp: String             // ISO 8601 timestamp
}
```

### Example Message Flow

```javascript
// Initial state
messages = []

// User sends: "Create an invoice"
messages = [
  { role: 'user', content: 'Create an invoice', timestamp: '2025-11-01T10:00:00Z' }
]

// AI responds
messages = [
  { role: 'user', content: 'Create an invoice', timestamp: '2025-11-01T10:00:00Z' },
  { role: 'assistant', content: 'I've created an invoice...', timestamp: '2025-11-01T10:00:05Z' }
]

// User edits: "Add $500 item"
messages = [
  { role: 'user', content: 'Create an invoice', timestamp: '2025-11-01T10:00:00Z' },
  { role: 'assistant', content: 'I've created an invoice...', timestamp: '2025-11-01T10:00:05Z' },
  { role: 'user', content: 'Add $500 item', timestamp: '2025-11-01T10:01:00Z' }
]
// ... and so on
```

---

## State Management

### Session State

```javascript
// Session Lifecycle
localStorage.getItem('invoice_session_id')
    ↓
sessionId (null or UUID)
    ↓
┌─────────────────────────────┐
│  No sessionId               │  ┌─────────────────────────┐
│  • First message            │  │  sessionId exists       │
│  • Call generateInvoice()   │  │  • Subsequent messages  │
│  • Create new session       │  │  • Call chat()          │
│  • Save to localStorage     │  │  • Use existing session │
└─────────────────────────────┘  └─────────────────────────┘
```

### Message State

```javascript
// Optimistic UI Updates
User types → Add to messages immediately → API call → Update on response

// Benefits:
// - Instant feedback
// - No perceived lag
// - Smooth UX
```

### MSC Content State

```javascript
mscContent = null  // No invoice yet

    ↓ (First response)
    
mscContent = "version:1.5\ncell:A1..."  // Initial invoice

    ↓ (Edit request)
    
mscContent = "version:1.5\ncell:A1..."  // Updated invoice
// Replaces previous content completely
```

---

## Data Flow

### Complete Request/Response Cycle

```
┌──────────────────────────────────────────────────────────────────┐
│                        DATA FLOW DIAGRAM                          │
└──────────────────────────────────────────────────────────────────┘

1. USER INPUT
   └─> ChatInterface (input field)
       │
       └─> onSendMessage callback
           │
           └─> App.handleSendMessage()

2. STATE UPDATE (Optimistic)
   └─> setMessages([...messages, userMessage])
       └─> ChatInterface re-renders with new message

3. API CALL
   └─> invoiceAPI.generateInvoice() OR invoiceAPI.chat()
       │
       ├─> axios.post('/api/generate-invoice', {...})
       │   OR
       └─> axios.post('/api/chat', {...})

4. BACKEND PROCESSING
   └─> FastAPI receives request
       └─> InvoiceAgent processes with Claude
           └─> Generates response + MSC content

5. RESPONSE RECEIVED
   └─> {
         session_id: "uuid",
         message: "text",
         msc_content: "msc...",
         token_count: 1234
       }

6. STATE UPDATE (Response)
   ├─> setMessages([...messages, assistantMessage])
   ├─> setMscContent(response.msc_content)
   ├─> setSessionInfo({ token_count, ... })
   └─> localStorage.setItem('invoice_session_id', session_id)

7. UI RE-RENDER
   ├─> ChatInterface shows new assistant message
   └─> MSCViewer renders updated invoice
```

---

## Error Handling

### Error Types

#### 1. Network Errors
```javascript
catch (err) {
    if (!err.response) {
        // Network error - server unreachable
        errorMessage = 'Unable to connect to server. Please check your connection.';
    }
}
```

#### 2. HTTP Error Responses

##### 413 - Token Limit Exceeded
```javascript
if (err.response?.status === 413) {
    errorMessage = 'Token limit exceeded (200,000 tokens). Please start a new session.';
    handleNewSession();
}
```

##### 404 - Session Not Found
```javascript
if (err.response?.status === 404) {
    errorMessage = 'Session expired. Starting a new session...';
    handleNewSession();
}
```

##### 400 - Bad Request
```javascript
if (err.response?.status === 400) {
    errorMessage = err.response.data.detail || 'Invalid request';
}
```

##### 500 - Server Error
```javascript
if (err.response?.status === 500) {
    errorMessage = 'Server error. Please try again later.';
}
```

### Error Display

```javascript
// Error Toast
{error && (
    <div className="error-toast">
        {error}
        <button onClick={() => setError(null)}>✕</button>
    </div>
)}

// Error Message in Chat
const errorMsg = {
    role: 'assistant',
    content: `❌ ${errorMessage}`,
    timestamp: new Date().toISOString(),
};
setMessages((prev) => [...prev, errorMsg]);
```

---

## Session Management

### Session Creation

```javascript
// On first message
const response = await invoiceAPI.generateInvoice(message);
setSessionId(response.session_id);
localStorage.setItem('invoice_session_id', response.session_id);
```

### Session Restoration

```javascript
// On app mount
useEffect(() => {
    const savedSessionId = localStorage.getItem('invoice_session_id');
    if (savedSessionId) {
        loadSession(savedSessionId);
    }
}, []);
```

### Session Expiry

```javascript
// Backend: 24 hour TTL
// If session expired, user sees 404 error
// Frontend automatically creates new session
```

### Session Reset

```javascript
const handleNewSession = () => {
    setSessionId(null);
    setMessages([]);
    setMscContent(null);
    setSessionInfo(null);
    setError(null);
    localStorage.removeItem('invoice_session_id');
};
```

---

## Usage Examples

### Example 1: Starting a New Invoice

```javascript
// User opens app for first time
// No session in localStorage
sessionId = null

// User types: "Create an invoice for web development"
handleSendMessage("Create an invoice for web development")

// Flow:
// 1. Add user message to UI
// 2. Call invoiceAPI.generateInvoice()
// 3. Backend creates new session
// 4. Response includes session_id
// 5. Save session_id to localStorage
// 6. Display assistant response and MSC invoice
```

### Example 2: Editing an Invoice

```javascript
// Continuing from Example 1
// sessionId = "550e8400-e29b-41d4-a716-446655440000"

// User types: "Add a $500 consulting item"
handleSendMessage("Add a $500 consulting item")

// Flow:
// 1. Add user message to UI
// 2. Call invoiceAPI.chat(sessionId, message)
// 3. Backend edits existing invoice
// 4. Response includes updated msc_content
// 5. MSCViewer re-renders with new content
```

### Example 3: Session Restoration

```javascript
// User closes tab
// Later, user returns to app

// On mount:
useEffect(() => {
    const savedSessionId = localStorage.getItem('invoice_session_id');
    // savedSessionId = "550e8400-e29b-41d4-a716-446655440000"
    
    loadSession(savedSessionId);
    // Verifies session still exists
    // If valid: setSessionId + setSessionInfo
    // If expired: clears localStorage
}, []);
```

### Example 4: Exporting Invoice

```javascript
// User has generated invoice
mscContent = "version:1.5\ncell:A1:t:INVOICE..."

// User clicks "Export MSC" button
handleExportMSC()

// Downloads file: invoice-1698765432000.msc
// Contains complete MSC spreadsheet
```

---

## Performance Optimizations

### 1. Optimistic UI Updates
```javascript
// Add user message immediately, don't wait for API
setMessages((prev) => [...prev, userMessage]);
// Then make API call
```

### 2. Debounced Auto-scroll
```javascript
useEffect(() => {
    scrollToBottom();
}, [messages]);
// Only scrolls when messages change
```

### 3. Conditional Rendering
```javascript
{mscContent && <MSCViewer mscContent={mscContent} />}
// Only renders when content exists
```

### 4. Session Caching
```javascript
// localStorage persists across page reloads
// Avoids creating new sessions unnecessarily
```

---

## Development & Testing

### Environment Variables

```bash
# .env file
VITE_API_URL=http://localhost:8000
```

### Running Development Server

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### API Testing

```javascript
// Manual API test
import { invoiceAPI } from './services/api';

// Test health check
const health = await invoiceAPI.healthCheck();
console.log(health);

// Test invoice generation
const response = await invoiceAPI.generateInvoice("Test invoice");
console.log(response);
```

### Debug Mode

```javascript
// Enable debug panel
setShowDebug(true);

// Shows last API response in JSON format
{showDebug && lastApiResponse && (
    <div className="debug-panel">
        <pre>{JSON.stringify(lastApiResponse, null, 2)}</pre>
    </div>
)}
```

---

## Common Issues & Solutions

### Issue 1: Session Expired

**Symptoms**: 404 error, "Session not found" message

**Solution**:
```javascript
// Automatic handling in error catch
if (err.response?.status === 404) {
    handleNewSession();
}
```

### Issue 2: Token Limit Exceeded

**Symptoms**: 413 error, conversation stops working

**Solution**:
```javascript
// Start new session
handleNewSession();
// User starts fresh with 0 tokens
```

### Issue 3: CORS Errors

**Symptoms**: Network errors in browser console

**Solution**:
```javascript
// Ensure backend CORS is configured
// Backend: CORS_ORIGINS includes frontend URL
```

### Issue 4: MSC Not Rendering

**Symptoms**: Blank preview panel

**Troubleshooting**:
```javascript
// Check if mscContent exists
console.log('MSC Content:', mscContent);

// Check for parsing errors
// Open browser console for MSCViewer errors
```

---

## Future Enhancements

1. **Offline Support**: PWA with service workers
2. **Message Persistence**: Save message history in backend
3. **Multi-Invoice Management**: Handle multiple invoices in one session
4. **Real-time Collaboration**: WebSocket for multi-user editing
5. **Template System**: Pre-built invoice templates
6. **Advanced Formatting**: Rich text editor for descriptions
7. **PDF Export**: Direct PDF generation from MSC
8. **Undo/Redo**: Track invoice edit history

---

## Conclusion

This frontend application provides a clean, intuitive interface for AI-powered invoice generation. The architecture separates concerns effectively:

- **API Layer**: Clean abstraction over HTTP calls
- **Component Layer**: Reusable, focused components
- **State Management**: React hooks for simple state flow
- **Error Handling**: Comprehensive error catching and user feedback

The chat-based interface makes invoice creation as simple as having a conversation, while the MSC viewer provides instant visual feedback.

# DaChat Product Requirements Document

## 1. Overview

### Product Description

A lightweight web interface for interacting with multiple AI inference endpoints, built with modern web technologies.

### Key Features

- Support for multiple AI inference endpoints (Ollama, Llama.cpp, OpenAI-compatible, custom APIs)
- Modern, responsive UI with Tailwind CSS
- Real-time text streaming
- Context-aware conversations
- JSON formatting support
- Performance metrics tracking

## 2. Detailed Requirements

### 2.1 UI Requirements

- **Modern Styling**: Must use Tailwind CSS for responsive, utility-first styling
- **Responsive Behavior**:
  - Mobile-first approach with burger menu toggle for navigation (under 768px)
  - Tablet layout (768px-1024px) with optimized sidebar width
  - Desktop layout (1024px+) with full sidebar visibility and additional whitespace
  - Fluid transitions between breakpoints with appropriate padding/margins
- **Main Interface**: Clean layout with sidebar navigation and main chat area
- **Forms**:
  - Server/Model selection dropdowns
  - Instruction textarea for query guidance
    - Allows users to enter custom instructions that guide the AI's responses
    - Content syncs with the instruction select dropdown in chat interface
  - Context textarea with URL input capability
  - Main query input with submit button
  - Toggles for JSON formatting and context inclusion
  - Instruction select dropdown:
    - Provides preset instruction templates (Explain, Summarize, Translate, Code)
    - 'Custom' option loads content from sidebar instruction textarea
- **Menus**:
  - Server configuration panel
  - Model selection dropdown
  - Context management controls
  - Settings for response formatting

### 2.2 Functional Requirements

- **Endpoint Support**: Must support:
  - Ollama (all locally hosted models)
  - Llama.cpp (gguf model formats)
  - OpenAI-compatible (including ArliAI and Gemini)
  - Custom API endpoints
- **Real-time Streaming**: Text must appear character-by-character as generated
- **Context Integration**: Must combine URL content or direct text with queries
- **JSON Support**: Must format responses as structured JSON when enabled
- **Performance Metrics**: Must track response speed and efficiency
- **Mobile Optimization**: Must provide full functionality on all device sizes
- **Web Context Injection**: Must support:
  - Search information retrieval endpoint (/api/search)
  - URL to markdown conversion endpoint (/api/markdown)
  - Both endpoints must support CORS for cross-origin requests
  - Rate limiting protection (100 requests/minute)
  - JSON response format with error handling

### 2.3 Technical Requirements

- **Frontend**: Vanilla JavaScript with ES6 modules
- **Styling**: Tailwind CSS
- **Compatibility**: Must work on modern browsers (Chrome, Firefox, Safari, Edge)
- **Performance**: Fast loading (<2s) and responsive interactions

## 3. User Flows

### 3.1 Basic Usage

1. User selects a Server from configured AI inference endpoints
2. User selects a Model (available models loaded based on server)
3. User enters Query
4. User optionally enables Context toggle
5. User optionally enables JSON toggle
6. User submits query
7. System displays streaming response
8. User can interrupt with Stop button if needed

### 3.2 Context Usage

1. User enters text directly in context field OR inputs URL
2. System validates URL if provided
3. System fetches web content through proxy if URL provided
4. User enables Context checkbox
5. System combines context with query when submitted

## 4. Success Metrics

- **Performance**: Time to first character <1s, characters per second >50
- **Compatibility**: Support all listed endpoint types
- **Usability**: Average session duration >5 minutes
- **Adoption**: At least 3 active endpoints configured per user

## 5. Technical Architecture

- Modular frontend design with separate endpoint handlers
- Core application logic in main.js
- Helper functions in utils.js
- Endpoint-specific API handlers (ollama.js, llamacpp.js, etc.)
- Web content fetching in web.js
- Search API handler in search.js (handles /api/search endpoint)
- Markdown conversion handler in markdown.js (handles /api/markdown endpoint)
- Both handlers must validate input URLs and sanitize output
- Implement caching for frequently requested URLs (5 minute TTL)

## 6. Future Enhancements

- Additional endpoint support
- Enhanced context management
- Advanced formatting options
- User authentication and preferences

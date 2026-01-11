# DerChat - AI Inference Web Interface

![Project Screenshot](image.png)

A lightweight web interface for interacting with multiple AI inference endpoints, built with vanilla HTML/JS and Bootstrap.

## Features

### UI Design

- **Main Interface**: Clean, responsive layout with sidebar navigation and main chat area
- **Forms**:
  - Server/Model selection dropdowns
  - Context textarea with URL input capability
  - Main query input with submit button
  - Toggles for JSON formatting and context inclusion
- **Menus**:
  - Server configuration panel
  - Model selection dropdown
  - Context management controls
  - Settings for response formatting

### Supported Endpoints

- Ollama
- Llama.cpp
- OpenAI-compatible (including ArliAI and Gemini)
- Custom API endpoints

### Available Servers and Models

- **Ollama**: Supports all locally hosted Ollama models (e.g., llama2, mistral)
- **Llama.cpp**: Compatible with gguf model formats
- **OpenAI**: Works with GPT-3.5, GPT-4, and compatible models
- **ArliAI**: Custom fine-tuned models
- **Gemini**: Google's latest AI models

### UI Features

- Real-time text streaming
- Interruptible requests (Stop button)
- Context-aware conversations
- JSON formatting support
- Response metrics (time to first character, characters per second)
- Mobile-responsive design
- Markdown rendering in responses

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/derchat.git
   ```

2. Configure your endpoints:

   - Copy `config.js.template` to `config.js`
   - Edit `config.js` to add your AI servers and endpoints

3. Serve the application:

   - Use any static file server like Python's `http.server`:
     ```bash
     python -m http.server
     ```
   - Or use Node.js with a package like `http-server`:
     ```bash
     npx http-server
     ```

4. Open the application in your browser:
   - Navigate to `http://localhost:8000` (or the appropriate port)

## User Guide

### Detailed Functionality

- **Real-time Streaming**: Text appears character-by-character as generated
- **Context Integration**: Combine URL content or direct text with queries
- **JSON Support**: Format responses as structured JSON when enabled
- **Performance Metrics**: Track response speed and efficiency
- **Mobile Optimization**: Full functionality on all device sizes

### Basic Usage

1. **Select a Server**: Choose from configured AI inference endpoints
2. **Select a Model**: Available models will be loaded based on the selected server
3. **Enter Query**: Type your question or prompt
4. **Context Toggle**: Enable to use content from the context field
5. **JSON Toggle**: Enable to format responses as JSON
6. **Submit**: Send your query to the selected model
7. **Stop**: Interrupt a running inference if needed

### Using Context

The context feature allows you to provide additional information for the AI model to consider:

- **Direct Text Input**: Enter text directly in the context field
- **URL Input**: Enter a URL to automatically fetch and use its content as context
- **Toggle Context**: Use the "Context" checkbox to include or exclude the context in your query

### Working with JSON

Enable the JSON checkbox to:

- Format the response as valid JSON (when supported by the model)
- Parse and display structured data responses

## Developer Documentation

### Architecture Overview

DerChat is designed as a modular frontend application that communicates with various AI inference endpoints. It uses vanilla JavaScript with ES6 modules to separate concerns:

- `main.js`: Core application logic and event handling
- `utils.js`: Helper functions for UI manipulation
- `ollama.js`, `llamacpp.js`, etc.: Endpoint-specific API handlers
- `modelFetcher.js`: Dynamic model discovery
- `config.js`: Server configuration

### Context Handling

The context system enables rich interactions with AI models by providing relevant background information:

#### How Context Works

1. **Context Collection**:

   - User can input text directly in the context field
   - User can input a URL, which is fetched through a proxy service
   - Content is normalized and sanitized

2. **Context Integration**:

   - When the context checkbox is enabled, the application combines the user query with the context
   - The assembled query is structured as:

     ```
     User Input:
     [user's question]

     Context:
     [context content]
     ```

3. **Handling Web Content**:
   - URLs are validated with regex
   - Web content is fetched through a proxy (`https://amd1.mooo.com/api/v1/w3m`) to avoid CORS issues
   - Content is returned as JSON and extracted for use as context

#### Implementation Details

```javascript
// Context assembly in main.js
if (contextCheckbox.checked) {
  // Process URL or direct text context
  assembledQuery = `User Input:\n${inputField}\n\nContext:\n${context}`;
}
```

### JSON and Web Functionality

#### JSON Handling

1. **Request Formatting**:

   - Each endpoint adapter formats requests according to the API's requirements
   - Requests are sent as JSON with proper headers and authentication

2. **Response Processing**:
   - Streamed responses are handled through Fetch API and ReadableStream
   - JSON responses are parsed and formatted when JSON toggle is enabled
   - Special handling is implemented for different endpoint behaviors

#### Web Communication

1. **Fetch API Usage**:

   - The application uses the Fetch API for all network requests
   - Requests are made with proper headers and can be aborted using AbortController

2. **Streaming Implementation**:

   - Text is streamed in real-time from supported endpoints
   - The UI updates progressively as tokens arrive
   - Performance metrics (time to first token, tokens per second) are calculated

3. **Error Handling**:
   - Network errors are caught and displayed to the user
   - Timeouts and connection issues are properly managed

#### Cross-Origin Considerations

- DerChat uses a proxy service for fetching web content to avoid CORS restrictions
- API requests are made directly to configured endpoints and may require CORS headers on those services

### Extending DerChat

#### Adding a New Endpoint

1. Create a new adapter file (e.g., `newprovider.js`):

   ```javascript
   export async function sendNewProviderRequest(
     endpoint,
     model,
     query,
     responseDiv,
     signal,
     startTime
   ) {
     // Implementation for the new provider
   }
   ```

2. Import and use the adapter in `main.js`:

   ```javascript
   import { sendNewProviderRequest } from "./newprovider.js";

   // Add to the server type detection logic
   if (description.includes("newprovider")) {
     await sendNewProviderRequest(...);
   }
   ```

3. Update the `config.js` to include the new provider:
   ```javascript
   {
     url: "https://your-new-provider.com",
     description: "newprovider"
   }
   ```

#### Customizing the UI

The application uses Bootstrap classes and custom CSS for styling. Main components:

- Sidebar: Contains settings and context inputs
- Main content: Chat interface and response area
- Messages: User and assistant messages with different styling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License]

## Acknowledgements

- Bootstrap for UI components
- Marked.js for Markdown rendering

# AGENTS.md - DerChat Development Guide

This document provides guidelines for AI agents working on the DerChat codebase.

## Project Overview

DerChat is a lightweight vanilla JavaScript web interface for interacting with AI inference endpoints (Ollama, Llama.cpp, OpenAI-compatible APIs). It uses ES6 modules, Bootstrap for UI, and runs directly in the browser without a build step.

## Commands

### Running the Application

Since this is a static web application, serve it with any static file server:

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

### Linting

No linting tools are currently configured. Before committing, manually check:

- No console.log statements (use console.error for errors)
- All imports are used
- No hardcoded sensitive values (use config.js for endpoints)

### Testing

No automated tests exist. Manual testing checklist:

1. Select each server type and verify model fetching works
2. Submit a query and verify streaming response displays
3. Test the Stop button during streaming
4. Test context feature with both direct text and URL input
5. Verify JSON formatting toggle works

## Code Style Guidelines

### General Principles

- Write clean, readable code with clear function purposes
- Keep functions small and focused on a single task
- Use descriptive names for variables, functions, and files
- Handle errors gracefully with user-friendly messages

### File Organization

- One export per file (or few closely related exports)
- ES6 modules with `.js` extension
- Main application logic in main.js
- Reusable utilities in utils.js
- API adapters in dedicated files (ollama.js, llamacpp.js, openai.js)

### Imports

```javascript
// Group imports by source, alphabetically within groups
import {
  displayUserMessage,
  addSpinner,
  removeSpinner,
  displayAssistantMessage,
  handleError,
} from "./utils.js";
import { sendOpenAIRequest } from "./openai.js";
```

### Naming Conventions

```javascript
// Variables: camelCase
const serverUrl = "https://api.example.com";
let selectedModel = "";

// Constants: SCREAMING_SNAKE_CASE
const DEFAULT_TIMEOUT = 30000;
const API_BASE_URL = "https://api.example.com";

// Functions: camelCase, verb-noun pattern
function fetchAvailableModels(serverUrl, serverType) {}
function displayAssistantMessage(responseDiv, message, isStreaming) {}
```

### Types

- Use `const` by default, `let` only when reassignment is necessary
- Avoid `var` entirely
- Use default parameters for optional function arguments

### String Literals

```javascript
// Use single quotes
const message = "User input received";

// Template literals for dynamic content
const assembledQuery = `User Input:\n${inputField}\n\nContext:\n${context}`;
```

### Indentation and Formatting

- 2-space indentation
- Braces on same line for control statements:

```javascript
if (condition) {
  doSomething();
} else {
  doSomethingElse();
}

for (let i = 0; i < items.length; i++) {
  processItem(items[i]);
}
```

### Error Handling

```javascript
// Always use try/catch for async operations
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error("Error description:", error);
  throw error; // Re-throw for caller to handle
}

// For AbortController signals, check for abort
if (error.name === "AbortError") {
  console.log("Fetch aborted");
  return;
}
```

### DOM Manipulation

```javascript
// Use querySelector/querySelectorAll for element selection
const inputField = document.getElementById("inputField");
const responseDiv = document.getElementById("response");

// Create elements with createElement
const message = document.createElement("div");
message.className = "message user";
message.textContent = userMessage;

// Append to DOM and scroll
responseDiv.appendChild(message);
responseDiv.scrollTop = responseDiv.scrollHeight;
```

### Async/Await

```javascript
// Prefer async/await over promise chains
async function fetchModels(serverUrl, serverType) {
  try {
    const response = await fetch(`${serverUrl}/models`);
    const data = await response.json();
    return data.models;
  } catch (error) {
    console.error("Failed to fetch models:", error);
    throw error;
  }
}

// Always handle AbortError gracefully
try {
  await longRunningOperation(signal);
} catch (error) {
  if (error.name === "AbortError") {
    return; // User cancelled, exit silently
  }
  throw error;
}
```

### Comments

```javascript
// Function description comment above functions
// Fetches available models from the specified server
async function fetchAvailableModels(serverUrl, serverType) {
  // Implementation
}

// Inline comments for complex logic
// Validate URL with regex pattern
const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
```

### Console Statements

```javascript
// console.error for errors
console.error("Fetch error:", error);

// console.log for debugging (remove before committing)
console.log("Debug info:", someValue);

// Never commit console.log statements
```

## Architecture Patterns

### API Adapter Pattern

Each endpoint type has a dedicated adapter file:

```javascript
// endpoint.js
import { displayAssistantMessage } from "./utils.js";

export async function sendEndpointRequest(
  url,
  model,
  input,
  responseDiv,
  signal,
  startTime
) {
  // Implementation
}
```

### Context Assembly

```javascript
// Assemble query with context when enabled
let assembledQuery = inputField;
if (contextCheckbox.checked && contextValue) {
  assembledQuery = `User Input:\n${inputField}\n\nContext:\n${contextValue}`;
}
```

### Server Type Detection

```javascript
// Detect server type from description attribute
const description = selectedOption.getAttribute("data-description");
if (description.includes("ollama")) {
  // Handle Ollama
} else if (description.includes("llama.cpp")) {
  // Handle Llama.cpp
}
```

## Configuration

All configurable endpoints are in `config.js`. Copy `config.js.template` to create new configurations:

```javascript
{
  url: "https://your-server.com",
  description: "openai" // Used for server type detection
}
```

## Extending the Application

To add a new endpoint:

1. If it's OpenAI-compatible, just add it to `servers` in `config.js`.
2. For a unique provider, create a new adapter file (e.g., `newprovider.js`).
3. Export `sendNewProviderRequest(url, model, input, responseDiv, signal, startTime, apiKey)`.
4. Import and use it in `main.js`.
5. Add the server to `config.js` with matching description and apiKey.

## Common Pitfalls

- Forgetting to import new functions in main.js
- Not handling AbortError in fetch operations
- Leaving debug console.log statements
- Not updating scroll position after appending messages
- Hardcoding server URLs instead of using config.js

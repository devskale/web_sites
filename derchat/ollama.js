// ollama.js
import { displayAssistantMessage, createReasoningBlock } from "./utils.js";
import { AVAILABLE_TOOLS, TOOL_IMPLEMENTATIONS } from "./tools.js";

// Configure marked to use highlight.js for code syntax highlighting
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: "hljs language-",
});

// System prompt - similar to LeChat
const SYSTEM_PROMPT = `You are a helpful assistant.

RULES:
1. For trivial/casual inputs (greetings, simple questions): Think BRIEFLY (1 sentence max), respond concisely.
2. For complex problems (coding, analysis, multi-step): Think more, give detailed elaborate answers.

WEB SEARCH:
- Use web_search ONLY for current info (news, weather, prices, recent events)
- Do NOT use web_search for: greetings, opinions, coding, general knowledge, casual chat
- If unsure about facts → search. Otherwise → respond directly.

Examples:
"Hi" → Brief thought: "Greeting" → Reply: "Hello! How can I help?"
"What's 2+2?" → Brief thought: "Simple math" → Reply: "4"
"What's the weather in Tokyo?" → Search for current info, then elaborate answer
"Explain quantum computing" → Think through it, give detailed elaborate answer`;

export async function sendOllamaRequest(
  url,
  model,
  input,
  responseDiv,
  signal,
  startTime,
  apiKey,
  toolsEnabled = false,
  useJson = false,
) {
  let messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: input },
  ];

  const data = {
    model: model,
    messages: messages,
    stream: true,
  };

  if (toolsEnabled && AVAILABLE_TOOLS.length > 0) {
    data.tools = AVAILABLE_TOOLS;
  }

  if (useJson) {
    data.format = "json";
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
      signal: signal,
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let reasoningBlock = null;
    let assistantMessage = null;
    let result = "";
    let firstCharTime = null;

    // Helper to ensure assistant message exists
    const ensureAssistantMessage = () => {
      if (!assistantMessage) {
        assistantMessage = displayAssistantMessage(responseDiv, "", true);
      }
      return assistantMessage;
    };

    // Helper function to update thinking display
    const updateThinkingDisplay = (text) => {
      const msg = ensureAssistantMessage();
      if (!reasoningBlock) {
        reasoningBlock = createReasoningBlock(msg);
      }
      reasoningBlock.content.textContent += text;
    };

    // Read first chunk
    const firstChunk = await reader.read();
    if (!firstChunk.done) {
      firstCharTime = performance.now();
      await processChunk(
        firstChunk.value,
        decoder,
        responseDiv,
        (content) => {
          const msg = ensureAssistantMessage();
          result += content;
          msg.contentDiv.innerHTML = marked.parse(result);
        },
        (reasoning) => {
          updateThinkingDisplay(reasoning);
        },
        (toolCalls) => {
          handleToolCalls(responseDiv, toolCalls, messages);
        },
      );
    }

    // Read remaining chunks
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      await processChunk(
        value,
        decoder,
        responseDiv,
        (content) => {
          const msg = ensureAssistantMessage();
          result += content;
          msg.contentDiv.innerHTML = marked.parse(result);
        },
        (reasoning) => {
          updateThinkingDisplay(reasoning);
        },
        (toolCalls) => {
          handleToolCalls(responseDiv, toolCalls, messages);
        },
      );
    }

    // Stop spinner when done
    if (reasoningBlock) {
      reasoningBlock.spinner.style.animation = "none";
      reasoningBlock.spinner.style.borderRightColor = "inherit";
    }

    // Display stats
    const endTime = performance.now();
    if (firstCharTime) {
      const tfc = ((firstCharTime - startTime) / 1000).toFixed(1);
      const totalTime = (endTime - startTime) / 1000;
      const cps = (result.length / totalTime).toFixed(1);

      const statsDiv = document.createElement("div");
      const statsElement = document.createElement("p");
      statsElement.className = "status-light";
      statsElement.innerHTML = `1st: ${tfc} s, tot ${totalTime.toFixed(1)} s<br>${cps} char/s`;
      statsDiv.appendChild(statsElement);
      responseDiv.appendChild(statsDiv);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Fetch aborted");
    } else {
      console.error("Fetch error:", error);
      throw error;
    }
  }

  // Helper function to process chunks
  async function processChunk(
    chunkValue,
    decoder,
    responseDiv,
    onContent,
    onReasoning,
    onToolCalls,
  ) {
    const textChunk = decoder.decode(chunkValue);
    const lines = textChunk.split("\n");

    for (const line of lines) {
      if (line.trim() === "") continue;
      try {
        const json = JSON.parse(line);
        if (json.done === false) {
          // Handle thinking/reasoning
          if (json.message?.reasoning || json.message?.thinking) {
            onReasoning(json.message.reasoning || json.message.thinking);
          }

          // Handle regular content
          if (json.message?.content) {
            onContent(json.message.content);
            responseDiv.scrollTop = responseDiv.scrollHeight;
          }

          // Handle tool calls
          if (json.message?.tool_calls && json.message.tool_calls.length > 0) {
            onToolCalls(json.message.tool_calls);
          }
        }
      } catch (error) {
        console.error("JSON parse error:", error);
      }
    }
  }
}

// Handle tool calls - executes tools and displays results
async function handleToolCalls(responseDiv, toolCalls, messages) {
  // Add assistant message with tool calls to history
  messages.push({
    role: "assistant",
    content: "",
    tool_calls: toolCalls.map((tc) => ({
      id: tc.id,
      type: tc.type,
      function: tc.function,
    })),
  });

  for (const toolCall of toolCalls) {
    const toolName = toolCall.function.name;
    let toolArgs = {};

    try {
      toolArgs = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool arguments:", e);
      continue;
    }

    // Display tool call
    const toolCallDiv = document.createElement("div");
    toolCallDiv.className = "tool-call";
    toolCallDiv.innerHTML = `
      <div class="tool-header">🔧 Tool Call: ${toolName}</div>
      <div class="tool-args"><pre>${JSON.stringify(toolArgs, null, 2)}</pre></div>
    `;
    responseDiv.appendChild(toolCallDiv);

    // Execute tool
    if (TOOL_IMPLEMENTATIONS[toolName]) {
      try {
        const result = await TOOL_IMPLEMENTATIONS[toolName](toolArgs);

        // Display result
        const resultDiv = document.createElement("div");
        resultDiv.className = "tool-result";
        resultDiv.innerHTML = `
          <div class="result-header">✓ Result:</div>
          <div class="result-content"><pre>${result}</pre></div>
        `;
        responseDiv.appendChild(resultDiv);

        // Add tool result to messages
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      } catch (error) {
        console.error(`Tool execution error: ${error.message}`);
        const errorDiv = document.createElement("div");
        errorDiv.className = "tool-result error";
        errorDiv.innerHTML = `
          <div class="result-header">❌ Error:</div>
          <div class="result-content">${error.message}</div>
        `;
        responseDiv.appendChild(errorDiv);
      }
    } else {
      console.warn(`Tool ${toolName} not implemented`);
    }
  }
}

// ollama.js
import { displayAssistantMessage } from "./utils.js";
import { AVAILABLE_TOOLS, TOOL_IMPLEMENTATIONS } from "./tools.js";

// Configure marked to use highlight.js for code syntax highlighting
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: "hljs language-",
});

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
"Explain quantum computing" → Think through it give detailed elaborate answer`;

export async function sendOllamaRequest(
  url,
  model,
  input,
  responseDiv,
  signal,
  startTime,
  apiKey,
  toolsEnabled = false,
  useJson = false
) {
    const messages = [
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

        // Create thinking container (like LeChat)
        let thinkingContainer = null;
        let assistantMessage = null;
        let result = "";
        let fullReasoning = "";
        let reasoningDiv = null;

        let firstCharTime = null;
        const firstChunk = await reader.read();
        if (!firstChunk.done) {
            firstCharTime = performance.now();
            const textChunk = decoder.decode(firstChunk.value);
            const lines = textChunk.split("\n");
            for (const line of lines) {
                if (line.trim() === "") continue;
                try {
                    const json = JSON.parse(line);
                    if (json.done === false) {
                        // Handle thinking/reasoning (LFM2.5-thinking)
                        if (json.message?.reasoning || json.message?.thinking) {
                            fullReasoning += json.message.reasoning || json.message.thinking;
                            
                            // Create thinking display if not exists
                            if (!thinkingContainer) {
                                thinkingContainer = document.createElement("div");
                                thinkingContainer.className = "thinking-container";
                                thinkingContainer.innerHTML = `
                                    <details class="thinking-details">
                                        <summary class="thinking-summary">
                                            <span class="thinking-spinner">💭</span>
                                            <span>Thinking Process</span>
                                        </summary>
                                        <div class="thinking-content">${fullReasoning}</div>
                                    </details>
                                `;
                                responseDiv.appendChild(thinkingContainer);
                            } else {
                                // Update existing thinking content
                                const contentDiv = thinkingContainer.querySelector(".thinking-content");
                                if (contentDiv) {
                                    contentDiv.textContent = fullReasoning;
                                }
                            }
                        }

                        // Handle regular content
                        if (json.message?.content) {
                            result += json.message.content;
                            if (!assistantMessage) {
                                assistantMessage = displayAssistantMessage(responseDiv, "", true);
                            }
                            assistantMessage.innerHTML = marked.parse(result);
                            responseDiv.scrollTop = responseDiv.scrollHeight;
                        }

                        // Handle tool calls (NEW)
                        if (json.message?.tool_calls && json.message.tool_calls.length > 0) {
                            handleToolCalls(responseDiv, json.message.tool_calls);
                        }
                    }
                } catch (error) {
                    console.error("JSON parse error:", error);
            }
        }
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const textChunk = decoder.decode(value);

        const lines = textChunk.split("\n");
        for (const line of lines) {
            if (line.trim() === "") continue;
            try {
                const json = JSON.parse(line);
                if (json.done === false) {
                    // Handle thinking/reasoning (LFM2.5-thinking)
                    if (json.message?.reasoning || json.message?.thinking) {
                        fullReasoning += json.message.reasoning || json.message.thinking;
                        
                        // Update thinking display
                        if (thinkingContainer) {
                            const contentDiv = thinkingContainer.querySelector(".thinking-content");
                            if (contentDiv) {
                                contentDiv.textContent = fullReasoning;
                            }
                        }
                    }

                    // Handle regular content
                    if (json.message?.content) {
                        result += json.message.content;
                        assistantMessage.innerHTML = marked.parse(result);
                        responseDiv.scrollTop = responseDiv.scrollHeight;
                    }

                    // Handle tool calls
                    if (json.message?.tool_calls && json.message.tool_calls.length > 0) {
                        handleToolCalls(responseDiv, json.message.tool_calls);
                    }
                }
            } catch (error) {
                console.error("JSON parse error:", error);
            }
        }
    }

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
}

// Handle tool calls - executes tools and displays results
async function handleToolCalls(responseDiv, toolCalls) {
    for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        // Display tool call
        const toolCallDiv = document.createElement("div");
        toolCallDiv.className = "tool-call";
        toolCallDiv.innerHTML = `
            <div class="tool-header">🔧 Tool Call: ${toolName}</div>
            <div class="tool-args"><JSON.stringify(toolArgs, null, 2)}</div>
        `;
        responseDiv.appendChild(toolCallDiv);

        // Execute tool
        if (TOOL_IMPLEMENTATIONS[toolName]) {
            const result = await TOOL_IMPLEMENTATIONS[toolName](toolArgs);

            // Display result
            const resultDiv = document.createElement("div");
            resultDiv.className = "tool-result";
            resultDiv.innerHTML = `
                <div class="result-header">✓ Result:</div>
                <div class="result-content">${result}</div>
            `;
            responseDiv.appendChild(resultDiv);

            // TODO: Continue conversation with tool results
            // This would require sending another message to the LLM with the tool results
        }
    }
}

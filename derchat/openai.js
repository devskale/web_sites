import { displayAssistantMessage, createReasoningBlock } from "./utils.js";
import OpenAI from "https://esm.sh/openai@4.28.0";

// Configure marked to use highlight.js for code syntax highlighting
if (typeof hljs !== "undefined") {
  marked.setOptions({
    highlight: function (code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
    langPrefix: "hljs language-",
  });
}

/**
 * Sends a request to an OpenAI-compatible API
 * @param {string} url - The base URL of the API
 * @param {string} model - The model to use
 * @param {string} input - The user input
 * @param {HTMLElement} responseDiv - The div to display the response in
 * @param {AbortSignal} signal - Abort signal for the fetch request
 * @param {number} startTime - The start time of the request for performance measuring
 * @param {string} apiKey - The API key for authentication
 */
export async function sendOpenAIRequest(
  url,
  model,
  input,
  responseDiv,
  signal,
  startTime,
  apiKey,
  useJson = false,
) {
  const client = new OpenAI({
    baseURL: url,
    apiKey: apiKey || "dummy", // OpenAI SDK requires an API key
    dangerouslyAllowBrowser: true,
  });

  const messages = [{ role: "user", content: input }];
  const params = {
    model: model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
  };

  if (useJson) {
    params.response_format = { type: "json_object" };
  }

  try {
    const stream = await client.chat.completions.create(params, {
      signal: signal,
    });

    let assistantMessage = displayAssistantMessage(responseDiv, "", true);
    let result = "";
    let reasoningBlock = null;
    let firstCharTime = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta) {
        // Handle reasoning content (if present in delta)
        // Some models/proxies might return reasoning_content in delta
        if (delta.reasoning_content) {
          if (!reasoningBlock) {
            reasoningBlock = createReasoningBlock(assistantMessage);
          }
          reasoningBlock.content.textContent += delta.reasoning_content;
        }

        if (delta.content) {
          if (!firstCharTime) {
            firstCharTime = performance.now();
          }
          result += delta.content;
          assistantMessage.contentDiv.innerHTML = marked.parse(result);
          responseDiv.scrollTop = responseDiv.scrollHeight;
        }
      }
    }

    // Stop spinner when done
    if (reasoningBlock) {
      reasoningBlock.spinner.style.animation = "none";
      reasoningBlock.spinner.style.borderRightColor = "inherit";
    }

    const endTime = performance.now();
    if (firstCharTime) {
      const tfc = (firstCharTime - startTime).toFixed(2);
      const totalTime = (endTime - startTime) / 1000; // in seconds
      const cps = (result.length / totalTime).toFixed(2);

      const statsDiv = document.createElement("div");
      statsDiv.className = "text-muted small mt-2";
      statsDiv.style.fontSize = "0.8rem";
      statsDiv.textContent = `TFC: ${tfc} ms, Speed: ${cps} chars/sec`;
      responseDiv.appendChild(statsDiv);
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error(error.status, error.message, error.code, error.type);
      throw new Error(error.message);
    } else {
      console.error("OpenAI SDK Error:", error);
      throw error;
    }
  }
}

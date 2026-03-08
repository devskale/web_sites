import { displayAssistantMessage } from "./utils.js";

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
  const data = {
    model: model,
    messages: [{ role: "user", content: input }],
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
  };

  if (useJson) {
    data.response_format = { type: "json_object" };
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${url}/chat/completions`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
      signal: signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          `Network response was not ok: ${response.status}`,
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = displayAssistantMessage(responseDiv, "", true);
    let result = "";
    let usage = null;
    let firstCharTime = null;

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Process any remaining buffer
        if (buffer.trim() !== "") {
          const line = buffer.trim();
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.substring(6));
              if (
                json.choices &&
                json.choices[0].delta &&
                json.choices[0].delta.content
              ) {
                result += json.choices[0].delta.content;
                assistantMessage.innerHTML = marked.parse(result);
                responseDiv.scrollTop = responseDiv.scrollHeight;
              }
            } catch (e) {
              console.error("Error parsing final JSON chunk:", e);
            }
          }
        }
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split("\n");
      // Keep the last line in the buffer as it might be incomplete
      buffer = lines.pop();

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === "" || trimmedLine === "data: [DONE]") continue;

        if (trimmedLine.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmedLine.substring(6));
            if (
              json.choices &&
              json.choices[0].delta &&
              json.choices[0].delta.content
            ) {
              if (!firstCharTime) firstCharTime = performance.now();
              result += json.choices[0].delta.content;
              assistantMessage.innerHTML = marked.parse(result);
              responseDiv.scrollTop = responseDiv.scrollHeight;
            }
            if (json.usage) usage = json.usage;
          } catch (e) {
            console.error("Error parsing JSON chunk:", e);
          }
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
      statsElement.innerHTML = `1st: ${tfc}s, tot: ${totalTime.toFixed(1)}s, ${cps} ch/s`;

      if (usage) {
        statsElement.innerHTML += `<br>Tokens: ${usage.total_tokens} (P: ${usage.prompt_tokens}, C: ${usage.completion_tokens})`;
      }
      statsDiv.appendChild(statsElement);
      responseDiv.appendChild(statsDiv);
      responseDiv.scrollTop = responseDiv.scrollHeight;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Fetch aborted");
    } else {
      console.error("Error in sendOpenAIRequest:", error);
      throw error;
    }
  }
}

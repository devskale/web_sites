import { displayAssistantMessage, createReasoningBlock } from "./utils.js";

export async function sendLlamaRequest(
  url,
  input,
  responseDiv,
  signal,
  startTime,
  apiKey,
  useJson = false,
) {
  const data = {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: input },
    ],
    temperature: 0.7,
    max_tokens: 512,
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
    let assistantMessage = displayAssistantMessage(responseDiv, "", true);
    let result = "";
    let reasoningBlock = null;
    let firstCharTime = null;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonChunk = line.substring(6).trim();
          if (jsonChunk === "[DONE]") continue;

          try {
            const parsedChunk = JSON.parse(jsonChunk);
            const delta = parsedChunk.choices?.[0]?.delta;

            if (delta) {
              // Handle reasoning content
              if (delta.reasoning_content) {
                if (!reasoningBlock) {
                  reasoningBlock = createReasoningBlock(assistantMessage);
                }
                reasoningBlock.content.textContent += delta.reasoning_content;
              }

              // Handle content
              if (delta.content) {
                if (!firstCharTime) {
                  firstCharTime = performance.now();
                }
                result += delta.content;
                assistantMessage.contentDiv.innerHTML = marked.parse(result);
                responseDiv.scrollTop = responseDiv.scrollHeight;
              }
            }
          } catch (jsonError) {
            console.error("Error parsing chunk as JSON: ", jsonError);
          }
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
    if (error.name === "AbortError") {
      console.log("Fetch aborted");
    } else {
      console.error("Fetch error:", error);
      throw error;
    }
  }
}

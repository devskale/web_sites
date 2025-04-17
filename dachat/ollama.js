// ollama.js

// Function to display assistant messages in the chat UI
export function displayAssistantMessage(
  responseDiv,
  content = "",
  isNew = false
) {
  let messageElement;

  if (isNew) {
    // Create a new message element
    const messageContainer = document.createElement("div");
    messageContainer.className = "bg-gray-100 p-3 rounded-lg max-w-3xl ml-auto";

    messageElement = document.createElement("div");
    messageElement.className = "prose";
    messageElement.innerHTML = content;

    messageContainer.appendChild(messageElement);
    responseDiv.appendChild(messageContainer);
  } else {
    // Use the last message element
    const lastMessage = responseDiv.lastElementChild;
    messageElement = lastMessage.querySelector(".prose");
  }

  return messageElement;
}

// Configure marked for code syntax highlighting
// Note: This requires marked and highlight.js to be included in the HTML
export function configureMarked() {
  if (typeof marked !== "undefined" && typeof hljs !== "undefined") {
    marked.setOptions({
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: "hljs language-",
    });
  } else {
    console.warn(
      "marked or highlight.js not loaded. Code highlighting will not work."
    );
  }
}

// Function to send requests to Ollama servers
export async function sendOllamaRequest(
  url,
  model,
  input,
  responseDiv,
  signal,
  startTime
) {
  const data = {
    model: model,
    messages: [
      { role: "system", content: "You are a helpful AI agent." },
      { role: "user", content: input },
    ],
  };

  try {
    // Ensure we're using the correct API endpoint for Ollama
    const apiUrl = `${url}/api/chat`;
    console.log("Sending request to:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
            result += json.message.content;
            assistantMessage.innerHTML = marked.parse(result);
            responseDiv.scrollTop = responseDiv.scrollHeight;
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
            result += json.message.content;
            assistantMessage.innerHTML = marked.parse(result);
            responseDiv.scrollTop = responseDiv.scrollHeight;
          }
        } catch (error) {
          console.error("JSON parse error:", error);
        }
      }
    }

    const endTime = performance.now();
    if (firstCharTime) {
      const tfc = ((firstCharTime - startTime) / 1000).toFixed(1); // in seconds
      const totalTime = (endTime - startTime) / 1000; // in seconds
      const cps = (result.length / totalTime).toFixed(1);

      const statsDiv = document.createElement("div");
      const statsElement = document.createElement("p");

      statsElement.className = "status-light";
      statsElement.innerHTML = `1st: ${tfc} s, tot ${totalTime.toFixed(
        1
      )} s<br>${cps} char/s`;
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

// main.js
import {
  displayUserMessage,
  addSpinner,
  removeSpinner,
  displayAssistantMessage,
  handleError,
} from "./utils.js";
import { sendOllamaRequest } from "./ollama.js";
import { sendLlamaRequest } from "./llamacpp.js";
import { sendGemOpenAIRequest } from "./gemopenai.js";
import { sendArliOpenAIRequest } from "./arliopenai.js";
import { fetchAvailableModels } from "./modelFetcher.js";
import { servers } from "./config.js";

let controller;

// Populate server field with options from config
const serverField = document.getElementById("serverField");
servers.forEach((server) => {
  const option = document.createElement("option");
  option.value = server.url;
  option.textContent = server.url;
  option.setAttribute("data-description", server.description);
  serverField.appendChild(option);
});

// Set default server and fetch models
const defaultServer = "https://api.arliai.com";
serverField.setAttribute("data-default", defaultServer);
if (defaultServer) {
  serverField.value = defaultServer;
  const selectedOption = serverField.options[serverField.selectedIndex];
  const serverType = selectedOption.getAttribute("data-description");
  fetchAvailableModels(defaultServer, serverType).then(() => {
    // Set default model after models are fetched
    const modelField = document.getElementById("modelField");
    const defaultModel = "Mistral-Nemo-12B-Instruct-2407";
    modelField.setAttribute("data-default", defaultModel);
    if (defaultModel) {
      modelField.value = defaultModel;
    }
  });
}
// Event listener for server field change
serverField.addEventListener("change", async function () {
  const selectedOption = this.options[this.selectedIndex];
  const serverUrl = selectedOption.value;
  const description = selectedOption.getAttribute("data-description");
  const modelField = document.getElementById("modelField");
  let serverType = "";

  // Determine the server type based on the description
  if (description.includes("ollama")) {
    serverType = "ollama";
  } else if (description.includes("llama.cpp")) {
    serverType = "llama.cpp";
  } else if (description.includes("gemopenai")) {
    serverType = "gemopenai";
  } else if (description.includes("arliopenai")) {
    serverType = "arliopenai";
  } else if (description.includes("openai")) {
    serverType = "openai";
  } else {
    serverType = "openai"; // Or set a default/fallback server type
  }

  if (serverUrl && serverType) {
    try {
      // Show loading message while fetching models
      modelField.innerHTML = '<option value="">Loading models...</option>';

      // Fetch available models for the selected server and server type
      await fetchAvailableModels(serverUrl, serverType);
    } catch (error) {
      console.error("Error in fetchAvailableModels:", error);
      // Display error message if fetching models fails
      modelField.innerHTML = `<option value="">Error: ${error.message}</option>`;
    }
  } else {
    // Prompt the user to select a server first
    modelField.innerHTML =
      '<option value="">--Please choose a server first--</option>';
  }
});

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("inputField").focus();
});

document
  .getElementById("chatForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const inputField = document.getElementById("inputField").value;
    const responseDiv = document.getElementById("response");
    const stopButton = document.getElementById("stopButton");
    const serverField = document.getElementById("serverField");
    const modelField = document.getElementById("modelField");
    const contextCheckbox = document.getElementById("contextCheck");
    const contextField = document.getElementById("contextField");
    const selectedServer = serverField.value;
    const selectedModel = modelField.value;
    let context = "";
    let assembledQuery = inputField; //Start with user input

    if (!selectedServer || !selectedModel) {
      alert("Please select both a server and a model.");
      return;
    }

    if (contextCheckbox.checked) {
      if (contextField) {
        const contextValue = contextField.value;
        //Regex to check for a valid URL
        const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

        if (urlRegex.test(contextValue)) {
          try {
            const proxyUrl =
              "https://amd1.mooo.com/api/w3m?url=" +
              encodeURIComponent(contextValue);
            const headers = {
              accept: "application/json",
              Authorization: "Bearer test23",
            };
            const response = await fetch(proxyUrl, {
              method: "GET",
              headers: headers,
            });

            if (!response.ok) {
              throw new Error(
                `Failed to fetch URL content: ${response.status} ${response.statusText}`
              );
            }

            const data = await response.json();

            if (data && data.content) {
              context = data.content;
            } else {
              throw new Error("Invalid response format from URL");
            }

            //Assemble the query
            assembledQuery = `User Input:\n${inputField}\n\nContext:\n${context}`;
          } catch (error) {
            handleError(responseDiv, error);
            return; // Stop execution if fetching fails
          }
        } else {
          // Context is not a URL, use it directly
          context = contextValue;
          assembledQuery = `User Input:\n${inputField}\n\nContext:\n${context}`;
        }
      } else {
        handleError(responseDiv, new Error("Context field not found."));
        return; // Stop execution if context field is missing
      }
    }

    displayUserMessage(responseDiv, inputField);
    const spinner = addSpinner(responseDiv);
    controller = new AbortController();
    const signal = controller.signal;
    stopButton.style.display = "inline-block";
    const startTime = performance.now();

    try {
      const selectedOption = serverField.options[serverField.selectedIndex];
      const description = selectedOption.getAttribute("data-description");

      if (description.includes("ollama")) {
        await sendOllamaRequest(
          `${selectedServer}/api/chat`,
          selectedModel,
          assembledQuery, // Pass the assembled query
          responseDiv,
          signal,
          startTime
        );
      } else if (description.includes("llama.cpp")) {
        await sendLlamaRequest(
          `${selectedServer}/chat/completions`,
          assembledQuery, // Pass the assembled query
          responseDiv,
          signal,
          startTime
        );
      } else if (description.includes("arliopenai")) {
        await sendArliOpenAIRequest(
          `${selectedServer}/v1/chat/completions`,
          selectedModel,
          assembledQuery, // Pass the assembled query
          responseDiv,
          signal,
          startTime
        );
      } else if (description.includes("openai")) {
        await sendGemOpenAIRequest(
          `${selectedServer}/v1/chat/completions`,
          selectedModel,
          assembledQuery, // Pass the assembled query
          responseDiv,
          signal,
          startTime
        );
      } else {
        throw new Error("Unsupported server type");
      }
    } catch (error) {
      handleError(responseDiv, error);
    } finally {
      stopButton.style.display = "none";
      removeSpinner(responseDiv, spinner);
    }
    document.getElementById("inputField").value = "";
  });

document.getElementById("stopButton").addEventListener("click", function () {
  if (controller) {
    controller.abort();
  }
});

// Function to toggle the sidebar
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("show");
}

// Event listener for the burger menu button
document
  .getElementById("sidebarToggle")
  .addEventListener("click", toggleSidebar);

// Close sidebar when clicking outside
document.addEventListener("click", function (event) {
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");

  if (
    !sidebar.contains(event.target) &&
    !sidebarToggle.contains(event.target) &&
    sidebar.classList.contains("show")
  ) {
    sidebar.classList.remove("show");
  }
});

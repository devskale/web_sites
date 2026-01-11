/**
 * Fetches available models from the specified server.
 * @param {string} serverUrl - The base URL of the server.
 * @param {string} serverType - The type of the server (e.g., 'ollama', 'openai').
 * @param {string} apiKey - Optional API key for authentication.
 */
export async function fetchAvailableModels(serverUrl, serverType, apiKey) {
  const modelField = document.getElementById("modelField");
  modelField.innerHTML = '<option value="">Loading models...</option>';

  try {
    let models = [];

    if (serverType === "ollama") {
      const fetchUrl = `${serverUrl}/api/tags`;
      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();
      models = data.models.map((model) => model.name);
    } else if (
      serverType === "openai" ||
      serverType === "arliopenai" ||
      serverType === "gemopenai" ||
      serverType === "openai-compliant"
    ) {
      const fetchUrl = `${serverUrl}/models`;
      const headers = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          models = data.data.map((m) => m.id);
        } else if (Array.isArray(data)) {
          models = data.map((m) => m.id || m);
        }
      }

      // Fallback to hardcoded models if fetch fails or returns empty
      if (models.length === 0) {
        if (serverType === "arliopenai") {
          models = [
            "Gemma-3-27B-it",
            "Mistral-Nemo-12B-Instruct-2407",
            "Llama-3.1-8B-Instruct",
            "Llama-3.1-70B-Instruct",
          ];
        } else if (serverType === "gemopenai") {
          models = ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"];
        } else {
          models = ["gpt-3.5-turbo", "gpt-4"];
        }
      }
    } else if (serverType === "llama.cpp") {
      // llama.cpp often doesn't have a models endpoint, or it's different
      models = ["default"];
    } else {
      throw new Error(`Unsupported server type: ${serverType}`);
    }

    modelField.innerHTML =
      '<option value="">--Please choose a model--</option>';
    models.forEach((model) => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      modelField.appendChild(option);
    });

    // Try to restore default model if it exists
    const defaultModel = modelField.getAttribute("data-default");
    if (defaultModel && models.includes(defaultModel)) {
      modelField.value = defaultModel;
    } else if (models.length > 0) {
      modelField.selectedIndex = 1;
    }
  } catch (error) {
    console.error("Error fetching models:", error);
    modelField.innerHTML = `<option value="">Error: ${error.message}</option>`;
  }
}

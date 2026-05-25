// utils.js

export function displayUserMessage(responseDiv, message) {
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.textContent = message;
    responseDiv.appendChild(userMessage);
    responseDiv.scrollTop = responseDiv.scrollHeight;
}

export function addSpinner(responseDiv) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner-border text-primary';
    spinner.role = 'status';
    const spinnerSpan = document.createElement('span');
    spinnerSpan.className = 'visually-hidden';
    spinnerSpan.textContent = 'Loading...';
    spinner.appendChild(spinnerSpan);
    responseDiv.appendChild(spinner);
    return spinner;
}

export function removeSpinner(responseDiv, spinner) {
    responseDiv.removeChild(spinner);
}

export function displayAssistantMessage(responseDiv, message, isStreaming = false) {
    let assistantMessage = document.createElement('div');
    assistantMessage.className = 'message assistant';
    
    // Container for content to separate it from reasoning
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (isStreaming) {
        contentDiv.innerText = message;
    } else {
        contentDiv.textContent = message;
    }
    
    assistantMessage.appendChild(contentDiv);
    responseDiv.appendChild(assistantMessage);
    responseDiv.scrollTop = responseDiv.scrollHeight;
    
    // Return both the wrapper and the content div
    assistantMessage.contentDiv = contentDiv;
    return assistantMessage;
}

export function createReasoningBlock(messageDiv) {
    // Check if one already exists
    if (messageDiv.querySelector('.reasoning-details')) {
        return {
            details: messageDiv.querySelector('.reasoning-details'),
            content: messageDiv.querySelector('.reasoning-content'),
            spinner: messageDiv.querySelector('.reasoning-spinner')
        };
    }

    const details = document.createElement('details');
    details.className = 'reasoning-details';
    details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'reasoning-summary';

    const spinner = document.createElement('span');
    spinner.className = 'reasoning-spinner';

    const summaryText = document.createTextNode('Thinking Process');

    summary.appendChild(spinner);
    summary.appendChild(summaryText);
    details.appendChild(summary);

    const content = document.createElement('div');
    content.className = 'reasoning-content';
    details.appendChild(content);

    // Insert before the content div
    const contentDiv = messageDiv.querySelector('.message-content') || messageDiv.firstChild;
    if (contentDiv) {
        messageDiv.insertBefore(details, contentDiv);
    } else {
        messageDiv.appendChild(details);
    }

    return { details, content, spinner };
}

export function handleError(responseDiv, error) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'message error';
    errorMessage.textContent = `Error: ${error.message}`;
    responseDiv.appendChild(errorMessage);
}

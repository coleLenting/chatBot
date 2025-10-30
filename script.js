const messagesContainer = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');

let conversationHistory = [];
let isProcessing = false;

window.onload = function() {
    setTimeout(() => {
        const welcomeMessage = `Hi there! 👋 I'm Cole Lenting's portfolio assistant. How can I help you learn more about Cole?

Quick actions:
• Tell me about Cole
• What's Cole doing now?
• View his work
• Download his CV`;

        displayBotMessage(welcomeMessage);
        addToHistory('assistant', welcomeMessage);
    }, 500);
};

sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !isProcessing) {
        handleUserInput();
    }
});

async function handleUserInput() {
    const userMessage = userInput.value.trim();
    if (userMessage.length === 0 || isProcessing) return;

    displayUserMessage(userMessage);
    addToHistory('user', userMessage);
    userInput.value = '';

    isProcessing = true;
    sendButton.disabled = true;
    showTypingIndicator();

    try {
        const response = await callGeminiAPI(userMessage);

        await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 600));

        hideTypingIndicator();
        displayBotMessage(response);
        addToHistory('assistant', response);

    } catch (error) {
        hideTypingIndicator();
        console.error('Error:', error);

        const errorMessage = `I apologize, but I'm having trouble connecting right now. 😔

Here's Cole's contact information in the meantime:
📧 Email: colelenting7@gmail.com
📱 Phone: 081 348 9356

Quick actions:
• Try asking again
• Download CV (/assets/coleLenting-CV.pdf)
• Visit portfolio (https://www.colelenting.com/)`;

        displayBotMessage(errorMessage);
    } finally {
        isProcessing = false;
        sendButton.disabled = false;
    }
}

async function callGeminiAPI(message) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            conversationHistory: conversationHistory.slice(-20)
        })
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
}

function addToHistory(role, content) {
    conversationHistory.push({ role, content });

    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }
}

function displayUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = message;

    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    messageElement.setAttribute('data-time', timestamp);

    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

function displayBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');

    messageElement.innerHTML = formatMessage(message);

    makeLinksClickable(messageElement);

    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

function formatMessage(text) {
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/• /g, '&bull; ');

    formatted = formatted.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>'
    );

    formatted = formatted.replace(
        /(?<!href=["'])(https?:\/\/[^\s<]+)(?![^<]*<\/a>)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>'
    );

    formatted = formatted.replace(
        /(\/assets\/[^\s<]+\.pdf)/g,
        '<a href="$1" download class="chat-link cv-link">Download CV (PDF)</a>'
    );

    formatted = formatted.replace(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        '<a href="mailto:$1" class="chat-link">$1</a>'
    );

    formatted = formatted.replace(
        /(\d{3}\s\d{3}\s\d{4})/g,
        '<a href="tel:+27$1" class="chat-link">$1</a>'
    );

    return formatted;
}

function makeLinksClickable(element) {
    const links = element.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
}

function showTypingIndicator() {
    typingIndicator.style.display = 'block';
    typingIndicator.classList.add('active');
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
    typingIndicator.classList.remove('active');
}

function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

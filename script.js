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

async function handleUserInput(message) {
    // Allow both manual input and programmatic messages
    const userMessage = typeof message === 'string' ? message : userInput.value.trim();
    if (userMessage.length === 0 || isProcessing) return;

    displayUserMessage(userMessage);
    addToHistory('user', userMessage);
    
    // Only clear input if it was a manual entry
    if (typeof message !== 'string') {
        userInput.value = '';
    }

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
• Visit portfolio ( https://colelenting.vercel.app/ )`;

        displayBotMessage(errorMessage);
    } finally {
        isProcessing = false;
        sendButton.disabled = false;
    }
}

async function callGeminiAPI(message) {
    try {
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
            const errorText = await response.text();
            console.error('API Response Error:', response.status, errorText);
            
            // Check for rate limit error
            if (response.status === 429) {
                console.log('Rate limit reached, falling back to static responses');
                return getFallbackResponse(message);
            }
            
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Fetch Error:', error);
        return getFallbackResponse(message);
    }
}

// Add this new function for fallback responses
function getFallbackResponse(message) {
    const chatbotData = window.chatbotData; // Access the data from chatbot-data.js
    
    // Simple keyword matching to find the most relevant response
    const lowercaseMessage = message.toLowerCase();
    let bestMatch = 'unknown';

    for (const [key, keywords] of Object.entries(window.keywordMappings)) {
        if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
            bestMatch = key;
            break;
        }
    }

    if (chatbotData[bestMatch]) {
        return chatbotData[bestMatch].message;
    }

    return chatbotData.unknown.message;
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
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('bot-message-container');

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    
    // Clean up the message by removing the Quick actions section
    const cleanMessage = message.split(/Quick actions:|Quick Actions:/)[0].trim();
    messageElement.innerHTML = formatMessage(cleanMessage);

    makeLinksClickable(messageElement);
    messageContainer.appendChild(messageElement);
    
    // Add enhanced quick action buttons
    addEnhancedQuickActions(messageContainer);
    
    messagesContainer.appendChild(messageContainer);
    scrollToBottom();
}

function addEnhancedQuickActions(container) {
    const quickActionsContainer = document.createElement('div');
    quickActionsContainer.classList.add('quick-actions');
    
    const actions = [
        // External links
        { text: "View Portfolio", url: "https://colelenting.vercel.app/", icon: "🔗" },
        { text: "GitHub Profile", url: "https://github.com/coleLenting", icon: "💻" },
        { text: "Email Cole", url: "mailto:colelenting7@gmail.com", icon: "📧" },
        { text: "Download CV", url: "/assets/coleLenting-CV.pdf", icon: "📄", download: true },
        
        // Chat actions
        { text: "About Cole", query: "Tell me about Cole", icon: "👋" },
        { text: "Current Status", query: "What is Cole currently doing?", icon: "⏰" },
        { text: "View Work", query: "Show me Cole's work experience", icon: "💼" },
        { text: "Skills", query: "What are Cole's skills?", icon: "🚀" }
    ];

    actions.forEach(item => {
        const button = document.createElement(item.url ? 'a' : 'button');
        button.classList.add('quick-action-btn');
        
        if (item.url) {
            button.href = item.url;
            button.target = item.download ? '_self' : '_blank';
            button.rel = 'noopener noreferrer';
            if (item.download) button.download = '';
        } else if (item.query) {
            button.addEventListener('click', () => {
                handleUserInput(item.query);
            });
        }

        button.innerHTML = `${item.icon} ${item.text}`;
        quickActionsContainer.appendChild(button);
    });

    container.appendChild(quickActionsContainer);
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
    // Remove existing typing indicator if any
    const existingIndicator = document.querySelector('.typing-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    typingIndicator.style.display = 'block';
    typingIndicator.classList.add('active');
    messagesContainer.appendChild(typingIndicator);
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

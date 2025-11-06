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
    const userMessage = typeof message === 'string' ? message : userInput.value.trim();
    if (userMessage.length === 0 || isProcessing) return;

    displayUserMessage(userMessage);
    addToHistory('user', userMessage);
    
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

        // Try local fallback first
        let fallbackMessage;
        try {
            fallbackMessage = getFallbackResponse(userMessage);
        } catch (fallbackError) {
            // Ultimate fallback if even local matching fails
            fallbackMessage = `I apologize, but I'm having trouble connecting right now. 😔

Here's Cole's contact information:
📧 Email: colelenting7@gmail.com
📱 Phone: 081 348 9356
📍 Location: Cape Town, SA

Quick links:
• Portfolio: https://colelenting.vercel.app/
• GitHub: https://github.com/coleLenting
• Download CV: /assets/coleLenting-CV.pdf`;
        }

        displayBotMessage(fallbackMessage);
    } finally {
        isProcessing = false;
        sendButton.disabled = false;
    }
}

async function callGeminiAPI(message) {
    try {
        // Verify chatbot data is loaded
        if (!window.chatbotData || !window.keywordMappings) {
            console.error('Chatbot data not loaded');
            throw new Error('Data not loaded');
        }

        // Call the API endpoint
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversationHistory: conversationHistory.slice(-20)
            }),
            // Add timeout
            signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        // Check if response is ok
        if (!response.ok) {
            console.warn(`API returned status ${response.status}, using fallback`);
            return getFallbackResponse(message);
        }

        const data = await response.json();
        
        // Validate response structure
        if (!data || !data.response) {
            console.warn('Invalid API response structure, using fallback');
            return getFallbackResponse(message);
        }

        // Log the source for debugging
        console.log(`Response source: ${data.source}`);
        
        return data.response;

    } catch (error) {
        console.error('API call failed:', error.message);
        
        // Always return fallback on error
        return getFallbackResponse(message);
    }
}

function getFallbackResponse(message) {
    try {
        const lowercaseMessage = message.toLowerCase();
        let bestMatch = 'unknown';
        let maxMatches = 0;

        // Safely check if keywordMappings exists
        if (window.keywordMappings) {
            for (const [key, keywords] of Object.entries(window.keywordMappings)) {
                const matches = keywords.filter(keyword => 
                    lowercaseMessage.includes(keyword)
                ).length;

                if (matches > maxMatches) {
                    maxMatches = matches;
                    bestMatch = key;
                }
            }
        }

        const response = window.chatbotData[bestMatch]?.message || 
                        window.chatbotData.unknown?.message ||
                        "I'm here to help you learn about Cole! Ask me about his skills, experience, or projects.";
        
        console.log(`Using fallback category: ${bestMatch}`);
        return response;

    } catch (error) {
        console.error('Error in getFallbackResponse:', error);
        return "I'm here to help you learn about Cole! Ask me about his skills, experience, or projects.";
    }
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

    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message-wrapper');

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    
    const cleanMessage = message.split(/Quick actions:|Quick Actions:/)[0].trim();
    messageElement.innerHTML = formatMessage(cleanMessage);

    makeLinksClickable(messageElement);
    
    // Create link bubbles container
    const linkBubbles = document.createElement('div');
    linkBubbles.classList.add('link-bubbles');
    
    // Add external link bubbles
    const externalLinks = [
        { text: "🔗", url: "https://colelenting.vercel.app/", title: "Portfolio" },
        { text: "💻", url: "https://github.com/coleLenting", title: "GitHub" },
        { text: "📧", url: "mailto:colelenting7@gmail.com", title: "Email" },
        { text: "📄", url: "/assets/coleLenting-CV.pdf", title: "CV", download: true }
    ];

    externalLinks.forEach(link => {
        const bubble = document.createElement('a');
        bubble.href = link.url;
        bubble.className = 'link-bubble';
        bubble.innerHTML = link.text;
        bubble.title = link.title;
        bubble.target = link.download ? '_self' : '_blank';
        bubble.rel = 'noopener noreferrer';
        if (link.download) bubble.download = '';
        linkBubbles.appendChild(bubble);
    });

    messageWrapper.appendChild(messageElement);
    messageWrapper.appendChild(linkBubbles);
    messageContainer.appendChild(messageWrapper);

    // Add chat quick actions below
    addChatQuickActions(messageContainer);
    
    messagesContainer.appendChild(messageContainer);
    scrollToBottom();
}

function addChatQuickActions(container) {
    const quickActionsContainer = document.createElement('div');
    quickActionsContainer.classList.add('quick-actions');
    
    const chatActions = [
        { text: "About Cole", query: "Tell me about Cole", icon: "👋" },
        { text: "Current Status", query: "What is Cole currently doing?", icon: "⏰" },
        { text: "View Work", query: "Show me Cole's work experience", icon: "💼" },
        { text: "Skills", query: "What are Cole's skills?", icon: "🚀" }
    ];

    chatActions.forEach(action => {
        const button = document.createElement('button');
        button.classList.add('quick-action-btn');
        button.innerHTML = `${action.icon} ${action.text}`;
        button.addEventListener('click', () => {
            handleUserInput(action.query);
        });
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
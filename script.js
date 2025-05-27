// DOM Elements
const messagesContainer = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');

// Initialize current state
let currentState = "welcome";
let lastUserMessage = "";

// Initialize the chat when the page loads
window.onload = function() {
    setTimeout(() => {
        displayBotMessage(chatbotData[currentState]);
    }, 500);
};

// Event listeners
sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});

// Handle user input
function handleUserInput() {
    const userMessage = userInput.value.trim();
    if (userMessage.length === 0) return;
    
    displayUserMessage(userMessage);
    lastUserMessage = userMessage;
    userInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Process user input after a delay
    setTimeout(() => {
        processUserInput(userMessage);
        hideTypingIndicator();
    }, Math.random() * 800 + 600); // Random delay between 600-1400ms for more natural feel
}

// Enhanced user input processing with better NLP
function processUserInput(message) {
    const lowerMessage = message.toLowerCase().trim();
    let matchedState = null;
    let confidence = 0;
    
    // Check for exact matches with option texts first
    for (const state in chatbotData) {
        if (chatbotData[state].options) {
            for (const option of chatbotData[state].options) {
                if (lowerMessage === option.text.toLowerCase()) {
                    matchedState = option.nextState;
                    confidence = 1.0;
                    break;
                }
            }
        }
        if (matchedState) break;
    }
    
    // If no exact match, try keyword matching with scoring
    if (!matchedState) {
        const stateScores = {};
        
        for (const [state, keywords] of Object.entries(keywordMappings)) {
            stateScores[state] = 0;
            
            for (const keyword of keywords) {
                if (lowerMessage.includes(keyword)) {
                    // Give higher score for exact word matches
                    const words = lowerMessage.split(/\s+/);
                    if (words.includes(keyword)) {
                        stateScores[state] += 2;
                    } else {
                        stateScores[state] += 1;
                    }
                }
            }
        }
        
        // Find the state with the highest score
        let maxScore = 0;
        for (const [state, score] of Object.entries(stateScores)) {
            if (score > maxScore) {
                maxScore = score;
                matchedState = state;
                confidence = score / 10; // Normalize confidence
            }
        }
    }
    
    // Handle special cases and contextual responses
    if (!matchedState || confidence < 0.1) {
        matchedState = getContextualResponse(lowerMessage);
    }
    
    // Default to unknown if no match found
    currentState = matchedState || "unknown";
    displayBotMessage(chatbotData[currentState]);
}

// Get contextual response based on conversation flow
function getContextualResponse(message) {
    // Handle common conversational patterns
    if (message.includes("yes") || message.includes("yeah") || message.includes("sure")) {
        // Continue with current context
        return currentState;
    }
    
    if (message.includes("no") || message.includes("nope")) {
        return "welcome";
    }
    
    // Handle questions
    if (message.startsWith("what") || message.includes("what")) {
        if (message.includes("do") || message.includes("doing")) {
            return "current_status";
        }
        return "about";
    }
    
    if (message.startsWith("how") || message.includes("how")) {
        if (message.includes("contact") || message.includes("reach")) {
            return "contact";
        }
        return "skills";
    }
    
    if (message.startsWith("when") || message.includes("when")) {
        return "availability";
    }
    
    if (message.startsWith("where") || message.includes("where")) {
        return "contact";
    }
    
    // Handle polite responses
    if (message.includes("please") || message.includes("could you")) {
        return "about";
    }
    
    return null;
}

// Display user message with enhanced styling
function displayUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = message;
    
    // Add timestamp for better UX
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    messageElement.setAttribute('data-time', timestamp);
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

// Display bot message with enhanced features
function displayBotMessage(stateData) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    
    // Handle dynamic messages (functions)
    let messageText = stateData.message;
    if (typeof messageText === 'function') {
        messageText = messageText();
    }
    
    // Add the main message text with typing effect
    if (messageText) {
        messageElement.innerHTML = formatMessage(messageText);
    }
    
    // If there's custom HTML, add it
    if (stateData.customHTML) {
        const customElement = document.createElement('div');
        customElement.innerHTML = stateData.customHTML;
        messageElement.appendChild(customElement);
    }
    
    messagesContainer.appendChild(messageElement);
    
    // Add options buttons if available
    if (stateData.options && stateData.options.length > 0) {
        setTimeout(() => {
            const optionsContainer = document.createElement('div');
            optionsContainer.classList.add('options-container');
            
            stateData.options.forEach((option, index) => {
                setTimeout(() => {
                    const button = document.createElement('button');
                    button.classList.add('option-button');
                    button.textContent = option.text;
                    button.addEventListener('click', () => {
                        displayUserMessage(option.text);
                        
                        // Show typing indicator
                        showTypingIndicator();
                        
                        // Process the next state after a delay
                        setTimeout(() => {
                            currentState = option.nextState;
                            displayBotMessage(chatbotData[option.nextState]);
                            hideTypingIndicator();
                        }, Math.random() * 500 + 400);
                    });
                    
                    optionsContainer.appendChild(button);
                    scrollToBottom();
                }, index * 150); // Stagger button appearance
            });
            
            messagesContainer.appendChild(optionsContainer);
        }, 300);
    }
    
    scrollToBottom();
}

// Format message text with markdown-like formatting
function formatMessage(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
        .replace(/\n/g, '<br>') // Line breaks
        .replace(/• /g, '&bull; '); // Bullet points
}

// Enhanced typing indicator
function showTypingIndicator() {
    typingIndicator.style.display = 'block';
    typingIndicator.classList.add('active');
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
    typingIndicator.classList.remove('active');
}

// Smooth scroll to bottom
function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

// Enhanced chat history management (in-memory only)
let chatHistory = [];

function saveChatMessage(sender, message, timestamp = new Date()) {
    chatHistory.push({
        sender: sender,
        message: message,
        timestamp: timestamp,
        state: currentState
    });
}

// Auto-save messages
function displayUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = message;
    
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    messageElement.setAttribute('data-time', timestamp);
    
    messagesContainer.appendChild(messageElement);
    saveChatMessage('user', message);
    scrollToBottom();
}

// Add some personality responses for common inputs
const personalityResponses = {
    "cool": "Thanks! Cole really is pretty cool - especially when he's coding! 😎",
    "awesome": "I'm glad you think so! Cole would be thrilled to hear that! ✨",
    "nice": "Right? Cole has put a lot of effort into developing his skills! 👍",
    "wow": "I know, right? Cole's journey in tech has been quite impressive! 🚀",
    "interesting": "Cole's background is definitely interesting - lots of diverse experience! 🤓"
};

// Handle personality responses
function checkPersonalityResponse(message) {
    const lowerMessage = message.toLowerCase();
    for (const [trigger, response] of Object.entries(personalityResponses)) {
        if (lowerMessage.includes(trigger)) {
            return {
                message: response,
                options: [
                    { text: "Tell me more", nextState: "about" },
                    { text: "Contact Cole", nextState: "contact" },
                    { text: "Back to menu", nextState: "welcome" }
                ]
            };
        }
    }
    return null;
}

// Update processUserInput to include personality check
const originalProcessUserInput = processUserInput;
processUserInput = function(message) {
    const personalityResponse = checkPersonalityResponse(message);
    if (personalityResponse) {
        displayBotMessage(personalityResponse);
        return;
    }
    originalProcessUserInput(message);
};
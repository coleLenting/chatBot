// DOM Elements
const messagesContainer = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');

// Initialize current state
let currentState = "welcome";

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
    userInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Process user input after a delay
    setTimeout(() => {
        processUserInput(userMessage);
        hideTypingIndicator();
    }, 1000);
}

// Process user input with simple NLP
function processUserInput(message) {
    // Simple natural language processing
    const lowerMessage = message.toLowerCase();
    let matchedState = null;
    
    // Check for exact matches with option texts
    for (const state in chatbotData) {
        if (chatbotData[state].options) {
            for (const option of chatbotData[state].options) {
                if (lowerMessage === option.text.toLowerCase()) {
                    matchedState = option.nextState;
                    break;
                }
            }
        }
        if (matchedState) break;
    }
    
    // If no exact match, try keyword matching
    if (!matchedState) {
        for (const [state, keywords] of Object.entries(keywordMappings)) {
            for (const keyword of keywords) {
                if (lowerMessage.includes(keyword)) {
                    matchedState = state;
                    break;
                }
            }
            if (matchedState) break;
        }
    }
    
    // Default to unknown if no match found
    currentState = matchedState || "unknown";
    displayBotMessage(chatbotData[currentState]);
}

// Display user message
function displayUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = message;
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

// Display bot message
function displayBotMessage(stateData) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    
    // Add the main message text
    messageElement.textContent = stateData.message;
    
    // If there's custom HTML, add it
    if (stateData.customHTML) {
        const customElement = document.createElement('div');
        customElement.innerHTML = stateData.customHTML;
        messageElement.appendChild(customElement);
    }
    
    messagesContainer.appendChild(messageElement);
    
    // Add options buttons if available
    if (stateData.options && stateData.options.length > 0) {
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('options-container');
        
        stateData.options.forEach(option => {
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
                }, 800);
            });
            
            optionsContainer.appendChild(button);
        });
        
        messagesContainer.appendChild(optionsContainer);
    }
    
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    typingIndicator.style.display = 'block';
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Scroll to bottom of chat
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Optional: Save chat history
function saveChat() {
    const chatHistory = messagesContainer.innerHTML;
    localStorage.setItem('portfolioChatHistory', chatHistory);
}

// Optional: Load chat history
function loadChat() {
    const savedChat = localStorage.getItem('portfolioChatHistory');
    if (savedChat) {
        messagesContainer.innerHTML = savedChat;
        scrollToBottom();
    }
}
// Function to get current status based on time
function getCurrentStatusMessage() {
    const now = new Date();
    const sastTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Johannesburg"}));
    const hour = sastTime.getHours();
    
    if (hour >= 8 && hour < 17) {
        return "ðŸ¢ Cole is currently working at Capaciti during business hours (8 AM - 5 PM SAST). He's focused on developing his skills and contributing to exciting projects.\n\nFeel free to reach out - he'll get back to you as soon as possible!";
    } else {
        return "ðŸŒŸ Cole is currently in his free time and available for conversations! This is a great time to discuss potential collaborations, projects, or just have a chat about technology and development.\n\nHe's likely working on personal projects or enhancing his skills during this time.";
    }
}

// Function to get availability message
function getAvailabilityMessage() {
    const now = new Date();
    const sastTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Johannesburg"}));
    const hour = sastTime.getHours();
    
    if (hour >= 8 && hour < 17) {
        return "â° Cole is currently at work (Capaciti) but will respond to messages as soon as he can. Business hours are 8 AM - 5 PM SAST.\n\nFor urgent matters, feel free to call or send an email!";
    } else {
        return "âœ… Great timing! Cole is currently available and free to chat. This is the perfect time to reach out for:\n\nâ€¢ Project discussions\nâ€¢ Collaboration opportunities\nâ€¢ Technical consultations\nâ€¢ General inquiries";
    }
}

// Function to get last updated date for CV
function getLastUpdated() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Africa/Johannesburg'
    };
    return now.toLocaleDateString('en-US', options);
}

// Enhanced NLP keywords mapping with CV/Resume keywords
const keywordMappings = {
    greeting: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "greetings", "sup", "what's up", "howdy"],
    about: ["about", "who", "background", "portfolio", "yourself", "bio", "tell me", "introduce", "profile", "person"],
    education: ["education", "study", "college", "university", "diploma", "school", "cput", "learn", "qualification", "degree", "academic", "studied", "graduate", "student"],
    experience: ["experience", "work", "job", "career", "professional", "employ", "company", "worked", "project", "intern", "kamikaze", "biic", "wil", "employment", "position"],
    skills: ["skill", "tech", "technology", "programming", "language", "design", "develop", "software", "html", "css", "javascript", "react", "php", "photoshop", "adobe", "code", "coding", "development", "frontend", "backend"],
    contact: ["contact", "email", "phone", "call", "reach", "message", "touch", "hire", "connect", "talk", "speak", "chat", "reach out"],
    current_status: ["now", "currently", "doing", "working", "today", "present", "status", "available", "busy", "free", "time", "schedule", "capaciti"],
    availability: ["available", "free", "busy", "when", "time", "schedule", "meet", "talk", "call", "availability", "open"],
    projects: ["project", "work", "portfolio", "website", "development", "build", "created", "made", "examples", "showcase", "demo"],
    thanks: ["thank", "thanks", "appreciate", "grateful", "cheers", "awesome", "great", "perfect", "excellent", "wonderful"],
    cv: ["cv", "resume", "curriculum vitae", "download", "pdf", "document", "file", "professional profile", "qualifications", "credentials", "employment history"],
    resume: ["resume", "cv", "curriculum", "vitae", "download", "get", "show", "view", "professional", "document"]
};



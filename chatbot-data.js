// Enhanced chat data structure
const chatbotData = {
    welcome: {
        message: "Hi there! 👋 I'm Cole Lenting's portfolio assistant. How can I help you learn more about Cole?",
        options: [
            { text: "Tell me about Cole", nextState: "about" },
            { text: "What's Cole doing now?", nextState: "current_status" },
            { text: "View his work", nextState: "experience" }
        ]
    },
    greeting: {
        message: "Hello! 😊 Great to meet you! I'm here to help you learn about Cole Lenting - a talented ICT graduate and frontend developer. What would you like to know?",
        options: [
            { text: "Tell me about Cole", nextState: "about" },
            { text: "What's he working on?", nextState: "current_status" },
            { text: "See his skills", nextState: "skills" }
        ]
    },
    current_status: {
        message: getCurrentStatusMessage(),
        options: [
            { text: "Contact Cole", nextState: "contact" },
            { text: "View his experience", nextState: "experience" },
            { text: "Back to menu", nextState: "welcome" }
        ]
    },
    about: {
        message: "Cole Lenting is a dedicated ICT graduate specializing in Multimedia. He's passionate about front-end development and UI/UX design, with strong foundations in creativity and decision-making. Cole is committed to creating impactful technological solutions and is currently enhancing his skills in Adobe software while exploring backend development.",
        options: [
            { text: "What's his background?", nextState: "education" },
            { text: "See his projects", nextState: "experience" },
            { text: "Contact information", nextState: "contact" }
        ]
    },
    education: {
        message: "Cole's educational journey:\n\n🎓 **Diploma in ICT in Multimedia** - CPUT (2022-2024)\n🚀 **Full Stack Developer (Java)** - IT Academy (2021)\n📚 **NQF Level 4** - Hopefield High School (2020) with bachelor's pass\n\n📈 Cole has been admitted to pursue an Advanced Diploma in ICT, specializing in Multimedia.",
        options: [
            { text: "See work experience", nextState: "experience" },
            { text: "Technical skills", nextState: "skills" },
            { text: "Back to menu", nextState: "welcome" }
        ]
    },
    experience: {
        message: "Cole's professional experience:\n\n💼 **Work Integrated Learning** - BIIC | Pillar 5 Group (Jul-Sep 2024)\n   • Integrated academic studies with practical work\n   • Developed academic, social, and technological competencies\n\n🌐 **Website Developer** - Kamikaze Innovations (Feb-Jul 2024)\n   • Designed and developed custom websites\n   • Created comprehensive design systems\n   • Built responsive sites from scratch\n   • Delivered full project documentation",
        options: [
            { text: "View technical skills", nextState: "skills" },
            { text: "Get contact info", nextState: "contact" },
            { text: "What's he doing now?", nextState: "current_status" }
        ]
    },
    skills: {
        message: "Cole's technical expertise:",
        customHTML: `
            <div class="skill-category">🎨 Frontend Development</div>
            <div class="skills-container">
                <div class="skill-item">HTML5</div>
                <div class="skill-item">CSS3/SASS</div>
                <div class="skill-item">JavaScript</div>
                <div class="skill-item">React</div>
                <div class="skill-item">jQuery</div>
            </div>
            <div class="skill-category">⚙️ Backend & Database</div>
            <div class="skills-container">
                <div class="skill-item">PHP</div>
                <div class="skill-item">Laravel</div>
                <div class="skill-item">MySQL</div>
                <div class="skill-item">Database Design</div>
            </div>
            <div class="skill-category">🎯 Design & Creative</div>
            <div class="skills-container">
                <div class="skill-item">Adobe Photoshop</div>
                <div class="skill-item">Adobe Illustrator</div>
                <div class="skill-item">Adobe InDesign</div>
                <div class="skill-item">UI/UX Design</div>
                <div class="skill-item">CapCut</div>
            </div>
        `,
        options: [
            { text: "See his projects", nextState: "experience" },
            { text: "How to reach him?", nextState: "contact" },
            { text: "Back to menu", nextState: "welcome" }
        ]
    },
    contact: {
        message: "Ready to connect with Cole? Here's how:\n\n📧 **Email:** colelenting7@gmail.com\n📱 **Phone:** 081 348 9356\n📍 **Location:** Cape Town, SA\n\n💡 Cole is always open to discussing new opportunities, collaborations, and exciting projects!",
        options: [
            { text: "What's he working on?", nextState: "current_status" },
            { text: "View his skills", nextState: "skills" },
            { text: "Back to menu", nextState: "welcome" }
        ]
    },
    availability: {
        message: getAvailabilityMessage(),
        options: [
            { text: "Contact Cole", nextState: "contact" },
            { text: "Learn about his work", nextState: "experience" },
            { text: "Back to menu", nextState: "welcome" }
        ]
    },
    projects: {
        message: "Cole has worked on various exciting projects:\n\n🚀 **Custom Website Development** at Kamikaze Innovations\n   • Full-stack web solutions\n   • Responsive design implementation\n   • Brand identity integration\n\n💼 **Professional Development** at BIIC | Pillar 5 Group\n   • Real-world application of academic knowledge\n   • Industry-standard practices\n\nWant to see more of his technical capabilities?",
        options: [
            { text: "View technical skills", nextState: "skills" },
            { text: "Contact for projects", nextState: "contact" },
            { text: "Back to menu", nextState: "welcome" }
        ]
    },
    thanks: {
        message: "You're very welcome! 😊 I'm glad I could help you learn more about Cole. Is there anything else you'd like to know about his background, skills, or current projects?",
        options: [
            { text: "Contact information", nextState: "contact" },
            { text: "Current availability", nextState: "current_status" },
            { text: "Back to menu", nextState: "welcome" }
        ]
    },
    unknown: {
        message: "I'm not quite sure about that! 🤔 Let me help you explore what I know about Cole. What interests you most?",
        options: [
            { text: "About Cole", nextState: "about" },
            { text: "His current work", nextState: "current_status" },
            { text: "Contact him", nextState: "contact" }
        ]
    }
};

// Function to get current status based on time
function getCurrentStatusMessage() {
    const now = new Date();
    const sastTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Johannesburg"}));
    const hour = sastTime.getHours();
    
    if (hour >= 8 && hour < 17) {
        return "🏢 Cole is currently working at Capaciti during business hours (8 AM - 5 PM SAST). He's focused on developing his skills and contributing to exciting projects.\n\nFeel free to reach out - he'll get back to you as soon as possible!";
    } else {
        return "🌟 Cole is currently in his free time and available for conversations! This is a great time to discuss potential collaborations, projects, or just have a chat about technology and development.\n\nHe's likely working on personal projects or enhancing his skills during this time.";
    }
}

// Function to get availability message
function getAvailabilityMessage() {
    const now = new Date();
    const sastTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Johannesburg"}));
    const hour = sastTime.getHours();
    
    if (hour >= 8 && hour < 17) {
        return "⏰ Cole is currently at work (Capaciti) but will respond to messages as soon as he can. Business hours are 8 AM - 5 PM SAST.\n\nFor urgent matters, feel free to call or send an email!";
    } else {
        return "✅ Great timing! Cole is currently available and free to chat. This is the perfect time to reach out for:\n\n• Project discussions\n• Collaboration opportunities\n• Technical consultations\n• General inquiries";
    }
}

// Enhanced NLP keywords mapping
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
    thanks: ["thank", "thanks", "appreciate", "grateful", "cheers", "awesome", "great", "perfect", "excellent", "wonderful"]
};
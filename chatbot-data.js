// Chat data structure
const chatbotData = {
    welcome: {
        message: "Hi there! 👋 I'm Cole Lenting's portfolio assistant. How can I help you learn more about Cole?",
        options: [
            { text: "Tell me about Cole", nextState: "about" },
            { text: "Education background", nextState: "education" },
            { text: "Work experience", nextState: "experience" },
            { text: "Technical skills", nextState: "skills" },
            { text: "Contact information", nextState: "contact" }
        ]
    },
    about: {
        message: "Cole Lenting is a dedicated ICT graduate specializing in Multimedia. He's passionate about front-end development and UI/UX design, with strong foundations in creativity and decision-making. Cole is committed to creating impactful technological solutions and is currently enhancing his skills in Adobe software while exploring backend development.",
        options: [
            { text: "Education background", nextState: "education" },
            { text: "Work experience", nextState: "experience" },
            { text: "Technical skills", nextState: "skills" },
            { text: "Contact information", nextState: "contact" },
            { text: "Back to main menu", nextState: "welcome" }
        ]
    },
    education: {
        message: "Cole's educational background includes:\n\n• Diploma in ICT in Multimedia from CPUT (2022-2024)\n• Full Stack Developer (Java) certification from IT Academy (2021)\n• NQF Level 4 from Hopefield High School (2020) with a bachelor's pass\n\nCole has been admitted to pursue an Advanced Diploma in ICT, specializing in Multimedia.",
        options: [
            { text: "Work experience", nextState: "experience" },
            { text: "Technical skills", nextState: "skills" },
            { text: "Contact information", nextState: "contact" },
            { text: "Back to main menu", nextState: "welcome" }
        ]
    },
    experience: {
        message: "Cole's professional experience includes:\n\n• Work Integrated Learning at BIIC | Pillar 5 Group (Jul-Sep 2024)\n   - Integrated academic studies with practical work experience\n   - Developed academic, social, and technological competencies\n\n• Website Developer at Kamikaze Innovations (Feb-Jul 2024)\n   - Designed and developed a custom website\n   - Created color palettes and refined logo designs\n   - Developed wireframes and mockups\n   - Coded a responsive website from scratch\n   - Delivered comprehensive documentation",
        options: [
            { text: "Education background", nextState: "education" },
            { text: "Technical skills", nextState: "skills" },
            { text: "Contact information", nextState: "contact" },
            { text: "Back to main menu", nextState: "welcome" }
        ]
    },
    skills: {
        message: "Cole's technical skills include:",
        customHTML: `
            <div class="skill-category">Front-End Development</div>
            <div class="skills-container">
                <div class="skill-item">HTML</div>
                <div class="skill-item">CSS/SASS</div>
                <div class="skill-item">JavaScript</div>
                <div class="skill-item">React</div>
                <div class="skill-item">jQuery</div>
            </div>
            <div class="skill-category">Back-End Development</div>
            <div class="skills-container">
                <div class="skill-item">PHP</div>
                <div class="skill-item">Laravel</div>
                <div class="skill-item">SQL</div>
                <div class="skill-item">Database Management</div>
            </div>
            <div class="skill-category">Design</div>
            <div class="skills-container">
                <div class="skill-item">Photoshop</div>
                <div class="skill-item">Illustrator</div>
                <div class="skill-item">InDesign</div>
                <div class="skill-item">Capcut</div>
            </div>
        `,
        options: [
            { text: "Education background", nextState: "education" },
            { text: "Work experience", nextState: "experience" },
            { text: "Contact information", nextState: "contact" },
            { text: "Back to main menu", nextState: "welcome" }
        ]
    },
    contact: {
        message: "You can contact Cole using the following information:\n\n• Email: colelenting7@gmail.com\n• Phone: 081 348 9356\n• Location: Cape Town, SA\n\nFeel free to reach out for collaboration opportunities or to discuss potential projects!",
        options: [
            { text: "Education background", nextState: "education" },
            { text: "Work experience", nextState: "experience" },
            { text: "Technical skills", nextState: "skills" },
            { text: "Back to main menu", nextState: "welcome" }
        ]
    },
    unknown: {
        message: "I'm not sure I understood that correctly. Would you like to know about Cole's education, work experience, technical skills, or how to contact him?",
        options: [
            { text: "Tell me about Cole", nextState: "about" },
            { text: "Education background", nextState: "education" },
            { text: "Work experience", nextState: "experience" },
            { text: "Technical skills", nextState: "skills" },
            { text: "Contact information", nextState: "contact" }
        ]
    }
};

// NLP keywords mapping
const keywordMappings = {
    about: ["about", "who", "cole", "background", "portfolio", "yourself", "bio"],
    education: ["education", "study", "college", "university", "diploma", "school", "cput", "learn", "qualification", "degree", "academic"],
    experience: ["experience", "work", "job", "career", "professional", "employ", "company", "worked", "project", "intern", "kamikaze", "biic", "wil"],
    skills: ["skill", "tech", "technology", "programming", "language", "design", "develop", "software", "html", "css", "javascript", "react", "php", "photoshop", "adobe", "code"],
    contact: ["contact", "email", "phone", "call", "reach", "message", "touch", "hire", "connect"]
};
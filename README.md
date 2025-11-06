# Cole Lenting - AI-Powered Portfolio Chatbot
### `AI Powered still in progress`

An intelligent chatbot assistant powered by Google's Gemini API that helps visitors learn about Cole Lenting's portfolio, skills, experience, and projects.

![image](https://github.com/user-attachments/assets/062a2e24-500b-4aef-87a8-1ec59d0aa6d4)

## Features

- **AI-Powered Conversations**: Natural, intelligent responses using Google Gemini API ` in progress `
- **Comprehensive Knowledge Base**: Complete information about Cole's background, education, skills, and experience
- **Time-Aware Responses**: Dynamic availability status based on SAST business hours (8 AM - 5 PM)
- **Conversation Memory**: Maintains context of the last 20 messages for coherent conversations
- **Interactive Links**: Clickable links for portfolio, GitHub, LinkedIn, email, and phone
- **CV Download**: Direct download link for Cole's professional CV
- **Modern UI**: Clean, responsive design with smooth animations and typing indicators
- **Dark Mode Support**: Automatic dark mode based on system preferences

## 💻 Tech Stack:
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white) ![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

## Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

4. **Run locally**
   ```bash
   vercel dev
   ```

   The chatbot will be available at `http://localhost:3000`

## Deployment to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   In the Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `GEMINI_API_KEY` with your Gemini API key
   - Redeploy the project

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI responses | Yes |

## Project Structure

```
.
├── api/
│   └── chat.js              # Serverless function for Gemini API
├── assets/
│   └── coleLenting-CV.pdf   # Cole's CV
├── index.html               # Main HTML file
├── script.js                # Frontend JavaScript
├── styles.css               # Styles and animations
├── .env                     # Environment variables (not committed)
├── .gitignore               # Git ignore file
├── vercel.json              # Vercel configuration
└── README.md                # This file
```

## API Endpoint

### POST /api/chat

Request body:
```json
{
  "message": "Tell me about Cole's skills",
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

Response:
```json
{
  "response": "Cole has expertise in...",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Security

- API key stored securely in environment variables
- Never exposed in client-side code
- Serverless function acts as secure proxy

## Contact

- **Location**: Cape Town, South Africa
- **GitHub**: https://github.com/coleLenting
- **Portfolio**: https://www.colelenting.com/
- **LinkedIn**: https://www.linkedin.com/in/cole-lenting-92135a295/

## License

© 2025 Cole Lenting. All rights reserved.

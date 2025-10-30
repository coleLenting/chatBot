import chatbotData from './chatbot-data.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📨 Received request');

    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      console.error('❌ No message provided');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get API key from environment variables
    const HF_API_KEY = process.env.HF_API_KEY;
    
    if (!HF_API_KEY) {
      console.error('❌ HF_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('✅ API key found');

    // Get current time
    const now = new Date();
    const sastTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
    const hour = sastTime.getHours();
    const isWorkHours = hour >= 8 && hour < 17;

    // Keep your existing detailed system prompt
    const systemPrompt = `You are Cole Lenting's portfolio assistant. Help visitors learn about Cole in a friendly, professional manner.

CURRENT TIME: ${sastTime.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' })}
WORK STATUS: ${isWorkHours ? 'Cole is at work (Capaciti, 8 AM - 5 PM SAST)' : 'Cole is available outside work hours'}

ABOUT COLE:
- ICT Multimedia graduate, Frontend Developer & UI/UX Designer
- Location: Cape Town, South Africa
- Email: colelenting7@gmail.com
- Phone: 081 348 9356
- Portfolio: https://colelenting.vercel.app/
- GitHub: https://github.com/coleLenting
- LinkedIn: https://www.linkedin.com/in/cole-lenting-92135a295/

EDUCATION:
- Diploma in ICT in Multimedia - CPUT (2022-2024)
- Full Stack Developer (Java) - IT Academy (2021)
- NQF Level 4 - Hopefield High School (2020)

EXPERIENCE:
- Digital / Data Engineer Associate - Capaciti (April 2025 - Present)
- Work Integrated Learning - BIIC | Pillar 5 Group (July - September 2024)
- Website Developer - Kamikaze Innovations (February - July 2024)

SKILLS:
 Front-End: HTML5 | CSS3 | SASS | JavaScript | React | jQuery | Angular
 Back-End & Database: PHP | Laravel | Python | SQL | MongoDB (basic)
 UI/UX & Design: Adobe Photoshop | Illustrator | InDesign | Figma | Wireframing | Prototyping
 Creative Tools: CapCut | Canva
 Development Tools: Git | GitHub | VS Code | WordPress (Theme Conversion)

CV: /assets/coleLenting-CV.pdf

GUIDELINES:
- Be friendly and concise (2-3 paragraphs max)
- Use 1-2 emojis per response
- End with 2-4 quick action suggestions
- Format links as [text](url)
- Keep responses under 200 words`;

    // Build conversation history
    const formattedHistory = conversationHistory.slice(-10).map(msg => 
      `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const fullPrompt = `${systemPrompt}\n\nConversation History:\n${formattedHistory}\n\nHuman: ${message}\nAssistant:`;

    console.log('🤖 Calling Hugging Face API...');

    // Call Hugging Face API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.7,
            top_k: 40,
            top_p: 0.95,
            return_full_text: false
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hugging Face API error:', response.status, errorText);
      return res.status(500).json({
        error: 'AI service error',
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ HF response received');

    // Validate response
    if (!data[0]?.generated_text) {
      console.error('❌ Invalid HF response structure:', data);
      return res.status(500).json({ error: 'Invalid AI response' });
    }

    const aiResponse = data[0].generated_text.trim();

    console.log('✅ Sending response to client');

    return res.status(200).json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in chat handler:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Handle timeout
    if (error.name === 'AbortError') {
      return res.status(504).json({ 
        error: 'Request timeout',
        message: 'The AI is taking too long to respond. Please try again.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
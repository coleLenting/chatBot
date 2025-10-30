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
    // Log for debugging
    console.log('📨 Received request');

    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      console.error('❌ No message provided');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get API key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('✅ API key found');

    // Get current time
    const now = new Date();
    const sastTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
    const hour = sastTime.getHours();
    const isWorkHours = hour >= 8 && hour < 17;

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

    // Build conversation for Gemini
    const contents = [];

    // Add conversation history (last 10 messages)
    conversationHistory.slice(-10).forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    console.log('🤖 Calling Gemini API...');

    // Call Gemini API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    let useFallback = false;

    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 800
            }
          }),
          signal: controller.signal
        }
      );

    clearTimeout(timeout);

      // Check for rate limiting or quota exceeded
      if (geminiResponse.status === 429 || geminiResponse.status === 529) {
        console.log('⚠️ Rate limit reached, using fallback responses');
        useFallback = true;
      } else if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('❌ Gemini API error:', geminiResponse.status, errorText);
        
        // Check if it's a quota exceeded error
        if (geminiResponse.status === 403 || errorText.includes('QUOTA') || errorText.includes('RATE_LIMIT')) {
          console.log('⚠️ API quota exceeded, using fallback responses');
          useFallback = true;
        } else {
          return res.status(500).json({ 
            error: 'AI service error',
            details: errorText 
          });
        }
      }

    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError.message);
      if (fetchError.name === 'AbortError') {
        console.log('⚠️ Request timeout, using fallback responses');
        useFallback = true;
      } else {
        console.log('⚠️ Network error, using fallback responses');
        useFallback = true;
      }
    }

     // Use fallback responses if needed
    if (useFallback) {
      console.log('🔄 Using fallback chatbot responses');
      
      const userMessage = message.toLowerCase().trim();
      let fallbackResponse = chatbotData.default;
      
      // Find matching intent in chatbot data
      for (const [intent, data] of Object.entries(chatbotData)) {
        if (intent === 'default') continue;
        
        const keywords = data.keywords || [];
        const foundKeyword = keywords.find(keyword => 
          userMessage.includes(keyword.toLowerCase())
        );
        
        if (foundKeyword) {
          fallbackResponse = data.response;
          console.log(`✅ Found fallback match for keyword: "${foundKeyword}"`);
          break;
        }
      }

       // If no specific match found, use greeting detection
      if (fallbackResponse === chatbotData.default) {
        const greetings = ['hello', 'hi', 'hey', 'greetings', 'howdy'];
        const isGreeting = greetings.some(greet => userMessage.includes(greet));
        
        if (isGreeting) {
          fallbackResponse = chatbotData.greeting.response;
        }
      }

      return res.status(200).json({
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        source: 'fallback'
      });
    }

   // Validate response
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid Gemini response structure:', data);
      throw new Error('Invalid AI response structure');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    console.log('✅ Sending response to client');

    return res.status(200).json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
      source: 'gemini'
    });

  } catch (error) {
    console.error('❌ Error in chat handler:', error.message);
    
    // Final fallback in case of any other errors
    console.log('🔄 Using final fallback due to error');
    
    return res.status(200).json({
      response: chatbotData.default,
      timestamp: new Date().toISOString(),
      source: 'error_fallback'
    });
  }
}
import { chatbotData, keywordMappings } from '../chatbot-data.js';

global.chatbotData = chatbotData;
global.keywordMappings = keywordMappings;

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

    // Try API first, fallback to static only on errors
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    console.log('🔍 Checking API key...');
    console.log('API Key exists:', !!GEMINI_API_KEY);
    console.log('API Key length:', GEMINI_API_KEY?.length || 0);

    if (!GEMINI_API_KEY) {
      console.log('❌ No API key, falling back to static data');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('API') || k.includes('GEMINI')));
      return res.status(200).json({
        response: getFallbackResponse(message),
        source: 'no_api_key_fallback',
        timestamp: new Date().toISOString()
      });
    }

    const systemPrompt = `You are Cole Lenting's portfolio assistant. ONLY respond with information from these exact sources:

STRICT DATA SOURCES:

1. Education:
   - Diploma in ICT (Multimedia) - CPUT (2022-2024)
   - Full Stack Developer (Java) - IT Academy (2021)
   - NQF Level 4 - Hopefield High School (2020)
   - Admitted for Advanced Diploma in ICT (Multimedia)

2. Work Experience:
   - Work Integrated Learning at BIIC | Pillar 5 Group (Jul-Sep 2024)
     • Academic and practical work integration
     • Technical competency development
   - Website Developer at Kamikaze Innovations (Feb-Jul 2024)
     • Custom website development
     • Design systems creation
     • Responsive design implementation
   - CAPACITI Digital/Data Engineering Associate (Current)

3. Technical Skills:
   Frontend: HTML5, CSS3/SASS, JavaScript, React, jQuery
   Backend: PHP, Laravel, MySQL, Database Design
   Creative: Adobe Suite (Photoshop, Illustrator, InDesign), UI/UX Design, CapCut

2. Portfolio (colelenting.vercel.app):
   - Projects
   - Work samples
   - Technical capabilities

3. GitHub (github.com/coleLenting):
   - Repositories
   - Contributions
   - Code examples

CRITICAL RULES:
- NEVER generate, assume, or create information
- ONLY use facts from the above sources
- If information isn't in these sources, respond: "I can only share information directly from Cole's CV, portfolio, and GitHub."
- Keep responses under 200 words
- Be friendly but factual
- Use 1-2 emojis maximum
- Don't list contact methods in responses
- Don't mention "Quick actions"

RESPONSE FORMAT:
- Short, direct answers
- No speculative content
- No generated examples
- No assumptions about availability`;

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
    console.log('Message:', message);
    console.log('Conversation history length:', conversationHistory.length);

    // Call Gemini API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    console.log('API URL base:', apiUrl.substring(0, 80) + '...');

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

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      const statusCode = geminiResponse.status;

      console.error(`❌ Gemini API error: ${statusCode}`, errorText);

      // Determine error type
      let errorType = 'api_error';
      if (statusCode === 429) {
        console.log('⚠️ Rate limit exceeded, using fallback');
        errorType = 'rate_limit_fallback';
      } else if (statusCode >= 500) {
        console.log('⚠️ Server error, using fallback');
        errorType = 'server_error_fallback';
      } else {
        console.log('⚠️ API failed, using fallback response');
        errorType = 'api_error_fallback';
      }

      return res.status(200).json({
        response: getFallbackResponse(message),
        source: errorType,
        timestamp: new Date().toISOString()
      });
    }

    const data = await geminiResponse.json();
    console.log('✅ Gemini response received');

    // Validate response
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid Gemini response structure:', data);

      // Fallback to static data on invalid response
      console.log('⚠️ Invalid API response, using fallback');
      return res.status(200).json({
        response: getFallbackResponse(message),
        source: 'invalid_response_fallback',
        timestamp: new Date().toISOString()
      });
    }

    // Add source verification to response
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // If response seems to contain generated info, fall back to static
    if (containsGeneratedInfo(aiResponse)) {
      console.log('⚠️ AI response contains generated info, using fallback');
      return res.status(200).json({
        response: getFallbackResponse(message),
        source: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Returning AI-generated response');
    return res.status(200).json({
      response: aiResponse,
      source: 'gemini_api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error caught:', error.message);
    console.error('Error name:', error.name);

    // Check if it's a timeout
    if (error.name === 'AbortError') {
      console.log('⚠️ API timeout (8s limit reached)');
    }

    // Fallback to static data on any error (timeout, network, etc.)
    console.log('⚠️ Error occurred, using fallback response');
    return res.status(200).json({
      response: getFallbackResponse(req.body?.message || ''),
      source: 'error_fallback',
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function for fallback responses
function getFallbackResponse(message) {
  const chatbotData = global.chatbotData;
  const lowercaseMessage = message.toLowerCase();
  
  for (const [key, keywords] of Object.entries(global.keywordMappings)) {
    if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
      return chatbotData[key]?.message || chatbotData.unknown.message;
    }
  }
  
  return chatbotData.unknown.message;
}

function containsGeneratedInfo(response) {
    const generatedPatterns = [
        'I believe',
        'probably',
        'might be',
        'could be',
        'possibly',
        'I think',
        'perhaps',
        'maybe',
        'seems to',
        'appears to',
        'likely',
        'would',
        'should',
        'potential',
        'may have',
        'around',
        'approximately'
    ];
    
    const responseLower = response.toLowerCase();
    return generatedPatterns.some(pattern => 
        responseLower.includes(pattern.toLowerCase())
    ) || response.includes('...');
}
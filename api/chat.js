import { chatbotData, keywordMappings } from '../server-chatbot-data.mjs';

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

    // First try to match with static data
    const staticResponse = getStaticResponse(message);
    if (staticResponse) {
      console.log('✅ Using static response from chatbot-data.js');
      return res.status(200).json({
        response: staticResponse,
        source: 'static',
        timestamp: new Date().toISOString()
      });
    }

    // If no static match, proceed with API
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.log('❌ No API key, falling back to static data');
      return res.status(200).json({
        response: getFallbackResponse(message),
        source: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

    const systemPrompt = `You are Cole Lenting's portfolio assistant. ONLY respond with information from these exact sources:

STRICT DATA SOURCES:
1. Cole's CV/Resume details:
   - Education: ICT Diploma (Multimedia) from CPUT
   - Work: Kamikaze Innovations, BIIC | Pillar 5 Group
   - Skills: Frontend, Backend, Design tools

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

    // Call Gemini API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

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
      console.error('❌ Gemini API error:', geminiResponse.status, errorText);
      return res.status(500).json({ 
        error: 'AI service error',
        details: errorText 
      });
    }

    const data = await geminiResponse.json();
    console.log('✅ Gemini response received');

    // Validate response
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid Gemini response structure:', data);
      return res.status(500).json({ error: 'Invalid AI response' });
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

    return res.status(200).json({
      response: aiResponse,
      source: 'api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(200).json({
      response: getFallbackResponse(message),
      source: 'error_fallback',
      timestamp: new Date().toISOString()
    });
  }
}

// Add these helper functions
function getStaticResponse(message) {
  const lowercaseMessage = message.toLowerCase();
  
  // Check direct matches in chatbot-data first
  for (const [key, keywords] of Object.entries(global.keywordMappings)) {
    if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
      return global.chatbotData[key]?.message;
    }
  }
  
  return null;
}

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
import { chatbotData, keywordMappings } from '../chatbot-data.js';

// Make data available globally for fallbacks
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

    // First try to match with static data (instant response)
    const staticResponse = getStaticResponse(message);
    if (staticResponse) {
      console.log('✅ Using static response from chatbot-data.js');
      return res.status(200).json({
        response: staticResponse,
        source: 'static',
        timestamp: new Date().toISOString()
      });
    }

    // Check if API key is available
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.log('⚠️ No API key configured, using fallback');
      return res.status(200).json({
        response: getFallbackResponse(message),
        source: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

    // Try Gemini API
    try {
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

4. Portfolio: colelenting.vercel.app
5. GitHub: github.com/coleLenting
6. Contact: colelenting7@gmail.com | 081 348 9356 | Cape Town, SA

CRITICAL RULES:
- NEVER generate, assume, or create information
- ONLY use facts from the above sources
- If information isn't in these sources, respond: "I can only share information directly from Cole's CV, portfolio, and GitHub."
- Keep responses under 200 words
- Be friendly but factual
- Use 1-2 emojis maximum`;

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
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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

      // Handle API errors (including rate limits)
      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('⚠️ Gemini API error:', geminiResponse.status, errorText);
        
        // Check if it's a rate limit error
        if (geminiResponse.status === 429 || errorText.includes('quota') || errorText.includes('rate limit')) {
          console.log('📊 Rate limit hit, using fallback');
          return res.status(200).json({
            response: getFallbackResponse(message),
            source: 'rate_limit_fallback',
            timestamp: new Date().toISOString()
          });
        }
        
        // For other errors, also use fallback
        return res.status(200).json({
          response: getFallbackResponse(message),
          source: 'api_error_fallback',
          timestamp: new Date().toISOString()
        });
      }

      const data = await geminiResponse.json();
      console.log('✅ Gemini response received');

      // Validate response structure
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('❌ Invalid Gemini response structure');
        return res.status(200).json({
          response: getFallbackResponse(message),
          source: 'invalid_response_fallback',
          timestamp: new Date().toISOString()
        });
      }

      const aiResponse = data.candidates[0].content.parts[0].text;
      
      // Verify response doesn't contain speculative content
      if (containsGeneratedInfo(aiResponse)) {
        console.log('⚠️ AI response contains speculative info, using fallback');
        return res.status(200).json({
          response: getFallbackResponse(message),
          source: 'verification_fallback',
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        response: aiResponse,
        source: 'api',
        timestamp: new Date().toISOString()
      });

    } catch (apiError) {
      // Catch any API-related errors (timeout, network, etc.)
      console.error('⚠️ API Error:', apiError.message);
      return res.status(200).json({
        response: getFallbackResponse(message),
        source: 'error_fallback',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    // Catch any general errors
    console.error('❌ Handler Error:', error.message);
    return res.status(200).json({
      response: getFallbackResponse(req.body?.message || ''),
      source: 'error_fallback',
      timestamp: new Date().toISOString()
    });
  }
}

// Helper: Get static response for exact keyword matches
function getStaticResponse(message) {
  const lowercaseMessage = message.toLowerCase();
  
  // Check direct matches in chatbot-data first
  for (const [key, keywords] of Object.entries(global.keywordMappings)) {
    if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
      const response = global.chatbotData[key]?.message;
      if (response) {
        console.log(`📝 Matched keyword category: ${key}`);
        return response;
      }
    }
  }
  
  return null;
}

// Helper: Get fallback response when API fails
function getFallbackResponse(message) {
  const chatbotData = global.chatbotData;
  const lowercaseMessage = message.toLowerCase();
  
  // Try to find best matching category
  let bestMatch = 'unknown';
  let maxMatches = 0;
  
  for (const [key, keywords] of Object.entries(global.keywordMappings)) {
    const matches = keywords.filter(keyword => 
      lowercaseMessage.includes(keyword)
    ).length;
    
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = key;
    }
  }
  
  const response = chatbotData[bestMatch]?.message || chatbotData.unknown.message;
  console.log(`🔄 Using fallback category: ${bestMatch}`);
  return response;
}

// Helper: Check if response contains speculative/generated content
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
    'would have',
    'should have',
    'potential',
    'may have',
    'approximately'
  ];
  
  const responseLower = response.toLowerCase();
  return generatedPatterns.some(pattern => 
    responseLower.includes(pattern.toLowerCase())
  );
}
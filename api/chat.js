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

    // First try to match with static data for exact matches
    const staticResponse = getStaticResponse(message);
    if (staticResponse && isExactMatch(message)) {
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
      console.log('⚠️ No API key, falling back to static data');
      return res.status(200).json({
        response: getFallbackResponse(message),
        source: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

    // Build comprehensive system prompt with actual data
    const systemPrompt = buildSystemPrompt();

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
    const timeout = setTimeout(() => controller.abort(), 8000);

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
            temperature: 0.4,  // Lower temperature for more factual responses
            topK: 20,
            topP: 0.85,
            maxOutputTokens: 500
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', geminiResponse.status, errorText);
      
      // Check for rate limit
      if (geminiResponse.status === 429) {
        console.log('🔄 Rate limit reached, using fallback');
        return res.status(200).json({
          response: getFallbackResponse(message),
          source: 'rate_limit_fallback',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(200).json({
        response: getFallbackResponse(message),
        source: 'error_fallback',
        timestamp: new Date().toISOString()
      });
    }

    const data = await geminiResponse.json();
    console.log('✅ Gemini response received');

    // Validate response
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid Gemini response structure:', data);
      return res.status(200).json({
        response: getFallbackResponse(message),
        source: 'invalid_response_fallback',
        timestamp: new Date().toISOString()
      });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Verify response doesn't contain speculative language
    if (containsGeneratedInfo(aiResponse)) {
      console.log('⚠️ AI response contains speculative content, using fallback');
      return res.status(200).json({
        response: getFallbackResponse(message),
        source: 'speculation_fallback',
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
    
    // Always fallback gracefully
    return res.status(200).json({
      response: getFallbackResponse(req.body?.message || ''),
      source: 'error_fallback',
      timestamp: new Date().toISOString()
    });
  }
}

// Build comprehensive system prompt with Cole's actual data
function buildSystemPrompt() {
  return `You are Cole Lenting's portfolio assistant. You must ONLY use the following verified information:

PERSONAL INFO:
- Name: Cole Lenting
- Location: Cape Town, South Africa
- Email: colelenting7@gmail.com
- Phone: 081 348 9356
- Portfolio: https://colelenting.vercel.app/
- GitHub: https://github.com/coleLenting

EDUCATION:
- Diploma in ICT in Multimedia - CPUT (2022-2024)
- Full Stack Developer (Java) - IT Academy (2021)
- NQF Level 4 - Hopefield High School (2020) with bachelor's pass
- Admitted to pursue Advanced Diploma in ICT, specializing in Multimedia

WORK EXPERIENCE:
1. Work Integrated Learning - BIIC | Pillar 5 Group (Jul-Sep 2024)
   - Integrated academic studies with practical work
   - Developed academic, social, and technological competencies

2. Website Developer - Kamikaze Innovations (Feb-Jul 2024)
   - Designed and developed custom websites
   - Created comprehensive design systems
   - Built responsive sites from scratch
   - Delivered full project documentation

CURRENT STATUS:
- Working at Capaciti
- Business hours: 8 AM - 5 PM SAST (South African Standard Time)
- Available for discussions outside work hours

TECHNICAL SKILLS:
Frontend: HTML5, CSS3/SASS, JavaScript, React, jQuery
Backend: PHP, Laravel, MySQL, Database Design
Design: Adobe Photoshop, Adobe Illustrator, Adobe InDesign, UI/UX Design, CapCut

PROFESSIONAL DESCRIPTION:
Cole is a dedicated ICT graduate specializing in Multimedia. He's passionate about front-end development and UI/UX design, with strong foundations in creativity and decision-making. Cole is committed to creating impactful technological solutions and is currently enhancing his skills in Adobe software while exploring backend development.

STRICT RULES:
1. NEVER make up information not listed above
2. NEVER speculate or use phrases like "probably", "might", "I think", "possibly"
3. Keep responses under 200 words
4. Use 1-2 emojis per response for personality
5. Be conversational but stick to facts
6. If asked about something not in the data, say: "I can only share information from Cole's CV and portfolio. For that specific detail, please contact Cole directly."
7. For availability questions, check current time in SAST timezone
8. Always stay professional and helpful

RESPONSE STYLE:
- Natural and conversational tone
- Enthusiastic about Cole's skills and experience
- Direct and informative
- Include relevant links when helpful (portfolio, GitHub, email)`;
}

// Check if message is an exact match for static responses
function isExactMatch(message) {
  const lowercaseMessage = message.toLowerCase().trim();
  const exactPhrases = [
    'hi', 'hello', 'hey', 'download cv', 'download resume',
    'get cv', 'get resume', 'contact', 'email', 'phone'
  ];
  
  return exactPhrases.some(phrase => lowercaseMessage === phrase);
}

// Get static response from chatbot-data
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

// Enhanced fallback with better matching
function getFallbackResponse(message) {
  const chatbotData = global.chatbotData;
  const lowercaseMessage = message.toLowerCase();
  
  // Try keyword matching with scoring
  let bestMatch = 'unknown';
  let highestScore = 0;
  
  for (const [key, keywords] of Object.entries(global.keywordMappings)) {
    const matchCount = keywords.filter(keyword => 
      lowercaseMessage.includes(keyword)
    ).length;
    
    if (matchCount > highestScore) {
      highestScore = matchCount;
      bestMatch = key;
    }
  }
  
  if (chatbotData[bestMatch] && highestScore > 0) {
    return chatbotData[bestMatch].message;
  }
  
  return chatbotData.unknown.message;
}

// Enhanced detection of speculative/generated content
function containsGeneratedInfo(response) {
  const speculativePatterns = [
    'i believe',
    'probably',
    'might be',
    'could be',
    'possibly',
    'i think',
    'perhaps',
    'maybe',
    'likely',
    'seems like',
    'appears to',
    'would be',
    'should be',
    'may have',
    'may be',
    'could have',
    'might have',
    'i assume',
    'i guess',
    'presumably',
    'supposedly'
  ];
  
  const lowerResponse = response.toLowerCase();
  return speculativePatterns.some(pattern => lowerResponse.includes(pattern));
}
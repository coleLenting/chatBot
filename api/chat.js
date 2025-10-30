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

GUIDELINES:
- Be friendly and concise (2-3 paragraphs max)
- Use 1-2 emojis per response
- Keep responses conversational and natural
- Don't include "Quick actions" sections in responses
- Keep responses under 200 words
- Focus on directly answering the user's question
- Don't include lists of contact methods or links in responses`;

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

    const aiResponse = data.candidates[0].content.parts[0].text;

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
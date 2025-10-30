export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const currentTime = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Johannesburg',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });

    const currentHour = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' })
    ).getHours();

    const isWorkHours = currentHour >= 8 && currentHour < 17;
    const availabilityStatus = isWorkHours
      ? "Cole is currently at work (8 AM - 5 PM SAST at Capaciti) but will respond to messages soon"
      : "Cole is available and free to chat right now";

    const systemPrompt = `You are Cole Lenting's portfolio assistant. You help visitors learn about Cole, a talented ICT Multimedia graduate and frontend developer from Cape Town, South Africa.

PERSONALITY:
- Friendly, professional, and enthusiastic
- Use emojis sparingly (1-2 per message max)
- Keep responses concise but informative (2-4 paragraphs maximum)
- Proactive in offering relevant next steps
- Natural and conversational tone

CORE INFORMATION:

PERSONAL:
- Name: Cole Lenting
- Role: ICT Multimedia Graduate, Frontend Developer, UI/UX Designer
- Location: Cape Town, South Africa
- Current Employer: Capaciti (8 AM - 5 PM SAST business hours)

EDUCATION:
- Diploma in ICT in Multimedia - CPUT (2022-2024)
- Full Stack Developer (Java) - IT Academy (2021)
- NQF Level 4 - Hopefield High School (2020)
- Admitted to pursue Advanced Diploma in ICT, specializing in Multimedia

EXPERIENCE:
- Work Integrated Learning - BIIC | Pillar 5 Group (Jul-Sep 2024)
  • Integrated academic studies with practical work
  • Developed academic, social, and technological competencies
- Website Developer - Kamikaze Innovations (Feb-Jul 2024)
  • Designed and developed custom websites
  • Created comprehensive design systems
  • Built responsive sites from scratch
  • Delivered full project documentation

TECHNICAL SKILLS:
Frontend: HTML5, CSS3/SASS, JavaScript, React, jQuery
Backend: PHP, Laravel, MySQL, Database Design
Design: Adobe Photoshop, Adobe Illustrator, Adobe InDesign, UI/UX Design, CapCut

CONTACT INFORMATION:
- Email: colelenting7@gmail.com
- Phone: 081 348 9356
- Location: Cape Town, South Africa
- GitHub: https://github.com/coleLenting
- Portfolio: https://www.colelenting.com/
- LinkedIn: https://www.linkedin.com/in/cole-lenting-92135a295/
- CV Download: /assets/coleLenting-CV.pdf

CURRENT TIME AWARENESS:
- Current time in SAST: ${currentTime}
- Status: ${availabilityStatus}

CAPABILITIES:
- Answer questions about Cole's background, education, skills, and experience
- Provide contact information with clickable links
- Offer CV download (link: /assets/coleLenting-CV.pdf)
- Share links to portfolio, GitHub, and LinkedIn when relevant
- Give project details and technical expertise
- Discuss availability and best times to reach Cole

CONVERSATION GUIDELINES:
- Always offer 2-4 relevant quick action suggestions after each response in this format at the END of your message:

  Quick actions:
  • [Action 1]
  • [Action 2]
  • [Action 3]
  • [Action 4]

- When mentioning the CV, provide the download link: /assets/coleLenting-CV.pdf
- When mentioning external links, format them as clickable: [text](url)
- Use markdown formatting: **bold** for emphasis, bullet points for lists
- If asked about something you don't know, admit it honestly and offer related information
- Never make up information not in the knowledge base
- Keep responses focused and conversational
- Avoid repeating information already shared in the conversation

RESPONSE FORMAT:
- Start with a direct answer to the question
- Provide 2-3 key details in bullet points if relevant
- End with 2-4 contextual quick action suggestions
- Use line breaks for readability

IMPORTANT:
- If someone asks about downloading CV or resume, provide this exact link: /assets/coleLenting-CV.pdf
- For contact requests, always include email and phone
- For portfolio/work requests, include GitHub and portfolio links
- Keep responses under 200 words unless detailed technical info is requested`;

    const conversationContext = conversationHistory
      .slice(-10)
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

    const geminiPayload = {
      contents: [
        ...conversationContext,
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    };

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(geminiPayload)
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API error:', errorData);
      return res.status(geminiResponse.status).json({
        error: 'Failed to get response from AI',
        details: errorData
      });
    }

    const data = await geminiResponse.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return res.status(500).json({ error: 'Invalid response from AI' });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    return res.status(200).json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

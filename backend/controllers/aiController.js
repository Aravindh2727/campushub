const Student = require('../models/Student');

const askAI = async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenRouter API Key is not configured on the server.' });
    }

    // Gather minified database context (exclude heavy fields like photoUrl and raw addresses if possible)
    // We only need academic data for analytics
    const students = await Student.find({}, { 
      name: 1, 
      standard: 1, 
      section: 1, 
      gender: 1,
      terms: 1, 
      _id: 0 
    });

    const systemPrompt = `You are an intelligent AI assistant for Dadapuram Government Higher Secondary School.
You have access to the following JSON data representing the school's students and their academic records (terms and marks):

${JSON.stringify(students)}

Instructions:
1. Answer the user's questions based strictly on the provided data.
2. If asked about a student's performance, calculate their total marks by summing up the marks in their terms.
3. Be concise, helpful, and friendly. Do not output raw JSON to the user; formulate a conversational response.
4. If you don't know the answer based on the data, say you don't have enough information.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://dadapuram-school.vercel.app', // Required by OpenRouter
        'X-Title': 'Dadapuram Analytics Dashboard',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API Error:", errorData);
      return res.status(500).json({ error: 'Failed to communicate with AI provider.' });
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return res.status(200).json({ answer: data.choices[0].message.content });
    } else {
      return res.status(500).json({ error: 'Invalid response from AI provider.' });
    }

  } catch (error) {
    console.error('Error in AI Controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  askAI
};

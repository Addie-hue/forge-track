import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeCsvHeaders(headers, sampleRow) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are a data mapping assistant. I have a CSV file containing student attendance data.
      Here are the column headers: ${JSON.stringify(headers)}
      Here is a sample row of data: ${JSON.stringify(sampleRow)}

      Analyze these headers and determine:
      1. Which column uniquely identifies the student (look for "USN", "Roll No", "Student ID", "Email"). We will call this the 'usnColumn'.
      2. Which columns represent attendance dates/sessions. These might be formatted like "12/03/2024", "Day 1", "Session 1", "12-Mar", etc. Ignore summary columns like "Total", "Percentage", etc. We will call these 'dateColumns'.

      Return ONLY a raw JSON object with this exact structure (no markdown, no backticks, no explanations):
      {
        "usnColumn": "Exact Name of USN Column",
        "dateColumns": ["Exact Name of Date Column 1", "Exact Name of Date Column 2"]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean up response if it contains markdown formatting
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to analyze CSV headers using AI.');
  }
}

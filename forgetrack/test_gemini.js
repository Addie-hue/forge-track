import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

export async function analyzeCsvHeaders(headers) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "You are an AI data assistant specializing in mapping CSV headers to a database schema. You must ONLY output a valid JSON object. No markdown formatting, no code blocks, no conversational text. Just the raw JSON object."
  });

  const prompt = `
    Analyze these CSV headers: ${JSON.stringify(headers)}

    Your task:
    1. Identify the column name that represents the Student ID (e.g., 'USN', 'Roll No', 'Registration Number').
    2. Identify all column names that represent dates for attendance.
    
    Output exactly this JSON format:
    {
      "usnColumn": "Exact header name for student ID",
      "dateColumns": ["Date header 1", "Date header 2"]
    }
  `;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text().trim();
  
  if (responseText.startsWith('\`\`\`json')) {
    responseText = responseText.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
  }

  return JSON.parse(responseText);
}

async function testGemini() {
  const headers = ['USN', 'Student Name', '2026-05-01', '2026-05-02'];
  console.log('Testing Gemini with headers:', headers);
  try {
    const result = await analyzeCsvHeaders(headers);
    console.log('Gemini Result:', JSON.stringify(result, null, 2));
    if (result.usnColumn === 'USN' && result.dateColumns.length === 2) {
      console.log('✅ Gemini Mapping Success!');
    } else {
      console.log('❌ Unexpected Mapping output');
    }
  } catch (error) {
    console.error('Gemini Error:', error);
  }
}

testGemini();

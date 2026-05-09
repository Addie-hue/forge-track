import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = import.meta.env.VITE_GEMINI_API_KEY ? new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY) : null;

export async function analyzeCsvHeaders(headers, sampleRow, mode = 'attendance') {
  if (!genAI) {
    console.warn('Gemini API key missing. Skipping AI analysis.');
    return { usnColumn: null, dateColumns: [], nameColumn: null, emailColumn: null, branchColumn: null };
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let prompt = '';
    if (mode === 'attendance') {
      prompt = `
        Context: Student attendance tracking.
        Headers: ${JSON.stringify(headers)}
        Sample Data Row: ${JSON.stringify(sampleRow)}

        Task: Map CSV/Excel headers to student database fields with ZERO CLASHES. 
        Note: The headers might be flattened versions of multi-row headers (e.g. "Day 1 | Attendance").

        1. "usnColumn": IDENTIFY the unique Student ID column (e.g. 'Admission Number', 'USN', 'Roll No'). 
           CRITICAL: Look at the Sample Data. Only pick a column if it contains unique alphanumeric IDs.
        2. "dateColumns": Identify ONLY headers that represent actual attendance sessions. Skip summary or total columns.
        3. "marksMapping": Map corresponding Knowledge/Skill mark columns to each attendance session.
        4. "explanation": Provide a rationale starting with "Clash Check: SUCCESS." explaining why this mapping is safe and essential.

        Return format: { 
          "usnColumn": "header_name", 
          "dateColumns": ["h1", "h2"],
          "marksMapping": {
            "h1": { "knowledge": "h1_k", "skill": "h1_s" }
          },
          "explanation": "..."
        }
      `;
    }
 else {
      prompt = `
        Context: Student roster management.
        Headers: ${JSON.stringify(headers)}
        Sample Data Row: ${JSON.stringify(sampleRow)}

        Task: Map CSV/Excel headers to student database fields.
        1. "usnColumn": Unique Identifier (USN, Admission Number, Roll No, ID).
        2. "nameColumn": Full name of the student.
        3. "emailColumn": Personal or institutional email.
        4. "branchColumn": Branch, Department, or Section (e.g. 'CS', 'IS').

        Return format: { 
          "usnColumn": "h1", 
          "nameColumn": "h2", 
          "emailColumn": "h3", 
          "branchColumn": "h4",
          "explanation": "Brief explanation of mapping logic."
        }
      `;
    }

    const result = await model.generateContent(prompt + "\nIMPORTANT: Return ONLY the raw JSON object. No markdown.");
    const text = result.response.text();
    
    // Safer JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not find JSON in AI response');
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('AI analysis failed. Please map columns manually.');
  }
}

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

        Task: Identify the column structure for a MATRIX attendance sheet.
        1. "usnColumn": Find the column containing unique Student IDs or USNs (e.g., values like '4SH24CS001'). Do NOT pick 'Name' columns.
        2. "dateColumns": Identify ALL columns that represent specific dates or session titles. Usually, these have dates as headers (e.g., '2024-05-01') or session numbers.
        
        Constraint: Ignore columns that represent 'Total', 'Percentage', or 'Sl No'.
        Return format: { "usnColumn": "header_name", "dateColumns": ["date_header_1", "date_header_2"] }
      `;
    } else {
      prompt = `
        Context: Student roster management.
        Headers: ${JSON.stringify(headers)}
        Sample Data Row: ${JSON.stringify(sampleRow)}

        Task: Map CSV headers to student database fields.
        1. "usnColumn": Unique Identifier (USN, Roll No, ID).
        2. "nameColumn": Full name of the student.
        3. "emailColumn": Personal or institutional email.
        4. "branchColumn": Branch, Department, or Section.

        Return format: { "usnColumn": "h1", "nameColumn": "h2", "emailColumn": "h3", "branchColumn": "h4" }
        If a field is not found, use null.
      `;
    }

    const result = await model.generateContent(prompt + "\nIMPORTANT: Return ONLY the raw JSON object. No markdown, no explanations.");
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

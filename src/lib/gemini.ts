import { GoogleGenerativeAI } from '@google/generative-ai';

interface ProjectMetadata {
  summary: string;
  tags: string[];
}

/**
 * Uses Gemini API to extract a one-sentence summary and 3-5 keywords/tags from a project's title and abstract.
 * Falls back to basic text parsing/placeholder data if the API key is missing or fails.
 */
export async function extractProjectMetadata(title: string, abstract: string): Promise<ProjectMetadata> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. Returning default fallback metadata.");
    return generateFallbackMetadata(title, abstract);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are an AI assistant designed to extract metadata from Ethiopian university final year projects.
Given the following project title and abstract:

Title: ${title}
Abstract: ${abstract}

Provide a JSON object with:
1. "summary": A concise 1-sentence summary of the project.
2. "tags": An array of 3 to 5 relevant technical tags or keywords (e.g., "Machine Learning", "IoT", "Hydraulics", "Solar Energy", "Database", "Android").

JSON Response Format:
{
  "summary": "1-sentence summary here.",
  "tags": ["tag1", "tag2", "tag3"]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    return {
      summary: data.summary || abstract.split('. ')[0] + '.',
      tags: Array.isArray(data.tags) ? data.tags.filter((t: any) => typeof t === 'string').map((t: string) => t.trim()) : []
    };
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    return generateFallbackMetadata(title, abstract);
  }
}

function generateFallbackMetadata(title: string, abstract: string): ProjectMetadata {
  // Simple heuristic tags based on title keywords
  const possibleTags = [
    { words: ['machine learning', 'ai', 'deep learning', 'cnn', 'neural'], tag: 'Machine Learning' },
    { words: ['iot', 'internet of things', 'sensor', 'arduino', 'raspberry'], tag: 'IoT' },
    { words: ['web', 'website', 'app', 'online', 'system', 'portal'], tag: 'Web Development' },
    { words: ['android', 'ios', 'mobile', 'phone'], tag: 'Mobile App' },
    { words: ['solar', 'wind', 'energy', 'power', 'grid'], tag: 'Renewable Energy' },
    { words: ['water', 'irrigation', 'agriculture', 'farm', 'soil'], tag: 'Agriculture Tech' },
    { words: ['concrete', 'building', 'structure', 'construction', 'road'], tag: 'Civil Engineering' },
    { words: ['design', 'simulation', 'mechanical', 'thermal', 'engine'], tag: 'Mechanical Design' }
  ];

  const extractedTags: string[] = [];
  const lowerTitle = title.toLowerCase();
  const lowerAbstract = abstract.toLowerCase();

  for (const item of possibleTags) {
    if (item.words.some(word => lowerTitle.includes(word) || lowerAbstract.includes(word))) {
      extractedTags.push(item.tag);
    }
  }

  // Fallback to defaults if none found
  if (extractedTags.length === 0) {
    extractedTags.push('Research', 'Engineering');
  }

  // One sentence summary is the first sentence of the abstract
  const firstSentence = abstract.split(/[.!?]/)[0];
  const summary = firstSentence ? `${firstSentence.trim()}.` : 'A final year project on ' + title;

  return {
    summary: summary.length > 150 ? summary.slice(0, 147) + '...' : summary,
    tags: extractedTags.slice(0, 5)
  };
}

interface VerificationResult {
  valid: boolean;
  reason: string;
}

/**
 * Uses Gemini API to verify if the uploaded PDF matches the project details (title, department, authors).
 */
export async function verifyProjectDocument(
  title: string,
  uploaderName: string,
  departmentName: string,
  pdfTextSample: string
): Promise<VerificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. Skipping AI document verification.");
    return { valid: true, reason: "API key missing, skipped verification." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are an academic verification assistant for Ethiopian Universities.
Your task is to verify if the uploaded PDF document text matches the project metadata.

Project Metadata:
- Expected Title: ${title}
- Expected Student Name (Uploader): ${uploaderName}
- Expected Department: ${departmentName}

Extracted text sample from the uploaded PDF file:
\"\"\"
${pdfTextSample}
\"\"\"

Please analyze the text sample (especially checking the cover page, titles, student names, and department mentions) and determine:
1. Is this a valid academic graduation project/thesis document?
2. Does the document's content (title, student name, and department) match the expected project metadata?
   - Note: Slight title variations (e.g., casing, spelling, minor phrasing) or missing middle names are acceptable. However, completely different topics, entirely different student names, or different departments must be marked invalid.
3. Return a JSON object with a boolean "valid" and a string "reason" explaining your decision.

JSON Response Format:
{
  "valid": true,
  "reason": "Clear explanation of matches or mismatches."
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    return {
      valid: typeof data.valid === 'boolean' ? data.valid : true,
      reason: data.reason || "Verification completed."
    };
  } catch (error) {
    console.error("Error communicating with Gemini API for verification:", error);
    return { valid: true, reason: "Verification failed to run, fallback allowed." };
  }
}

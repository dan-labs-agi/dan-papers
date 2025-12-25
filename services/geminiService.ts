
import { GoogleGenAI, Type } from "@google/genai";

// Always use the API key from process.env.API_KEY directly in the constructor.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeArticle = async (text: string): Promise<string> => {
  try {
    // Calling generateContent with the specific model name and contents.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Please provide a concise, academic summary (approx. 3-4 sentences) of the following research paper content. Focus on the core hypothesis and conclusion.\n\n${text}`,
      config: {
        maxOutputTokens: 200,
        temperature: 0.5,
      }
    });

    // Accessing the .text property directly to get the result.
    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Error summarizing article:", error);
    return "Failed to generate summary. Please try again later.";
  }
};

export const structureArticle = async (rawText: string) => {
  try {
    // Professional research paper editor logic using gemini-3-flash-preview for structured JSON output.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional research paper editor. Convert the following raw text extracted from a document into a beautifully structured Markdown blog post for "Dan Papers".
      Identify the title, a 1-sentence subtitle, relevant research tags, and the main content.
      Format the content using # for main headings, ## for subheadings, and > for blockquotes where appropriate.
      Clean up any extraction artifacts like broken lines or headers/footers.
      
      RAW TEXT:
      ${rawText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            content: { type: Type.STRING }
          },
          required: ["title", "subtitle", "tags", "content"]
        }
      }
    });

    // Extracting generated text directly as a string.
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error structuring article:", error);
    return null;
  }
};

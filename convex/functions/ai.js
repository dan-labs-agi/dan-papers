import { mutation, action } from "../_generated/server";
import { GoogleGenAI, Type } from "@google/genai";
import { v } from "convex/values";

export const summarizeArticle = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    // Initialize inside the handler to access env vars
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Please provide a concise, academic summary (approx. 3-4 sentences) of the following research paper content. Focus on the core hypothesis and conclusion.\n\n${args.text}`,
        config: {
          maxOutputTokens: 200,
          temperature: 0.5,
        },
      });

      return response.text() || "No summary generated.";
    } catch (error) {
      console.error("Error summarizing article:", error);
      return "Failed to generate summary. Please try again later.";
    }
  },
});

export const structureArticle = mutation({
  args: {
    rawText: v.optional(v.string()),
    fileData: v.optional(v.string()), // Base64 encoded file
    mimeType: v.optional(v.string())  // e.g. "application/pdf"
  },
  handler: async (ctx, args) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Determine content part
    let geminiContent = [];
    if (args.fileData && args.mimeType) {
      geminiContent.push({
        inlineData: {
          data: args.fileData,
          mimeType: args.mimeType
        }
      });
      geminiContent.push({
        text: `You are a strict document conversion engine. Convert this PDF into a semantic Markdown file that PRESERVES the exact structure and content of the original.
        
        CRITICAL RULES:
        1. PRESERVE EVERYTHING: Do not summarize. Do not skip sections. output the full text content.
        2. TABLES: Convert tables visually into Markdown tables.
        3. MATH: Detect all math equations and convert them to LaTeX format enclosed in '$' (inline) or '$$' (block) delimiters.
        4. STRUCTURE: exact matching of headings (#, ##, ###) to the visual hierarchy.
        5. CODE: detect code blocks and format them with \`\`\`.
        6. IMAGES: If there are diagrams/figures, describe them in specific [Figure: description] tags, but do not hallucinate image URLs.
        7. LAYOUT: If the text is in columns, merge them logically into a single readable flow.
        
        Output valid JSON with the following structure.`
      });
    } else if (args.rawText) {
      geminiContent.push({
        text: `You are a professional research paper editor. Convert the following raw text into a beautifully structured Markdown blog post.
        
        CRITICAL INSTRUCTIONS:
        1. Identify and preserve all TABLES. Format them exactly in Markdown | Header | format.
        2. If you find tabular data described in text, convert it into a Markdown table.
        3. Identify any architecture descriptions or charts and format them inside fenced code blocks (using \`\`\`).
        4. Create a compelling Title, a 1-sentence Abstract (Subtitle), and 3-5 relevant research Tags.
        5. Clean up extraction artifacts (broken lines, weird characters).
        6. Use academic headers (#, ##).
        7. Detect Math/LaTeX and ensure it is properly delimiters with $ or $$.

        RAW TEXT TO PROCESS:
        ${args.rawText}`
      });
    } else {
      throw new Error("No input provided");
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: geminiContent,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              content: { type: Type.STRING },
            },
            required: ["title", "subtitle", "tags", "content"],
          },
        },
      });

      return JSON.parse(response.text() || "{}");
    } catch (error) {
      console.error("Error structuring article:", error);
      // Return a fallback or rethrow depending on UI needs. 
      // For now, returning null allows UI to show generic error.
      return null;
    }
  },
});

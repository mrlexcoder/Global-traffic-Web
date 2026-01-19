
import { GoogleGenAI, Type } from "@google/genai";
import { TargetAnalysis } from "../types";

export interface EnhancedTargetAnalysis extends TargetAnalysis {
  trackingId?: string;
  expectedLoadTime: number;
}

export const analyzeTargetUrl = async (url: string): Promise<EnhancedTargetAnalysis> => {
  // Always use the required initialization format for GoogleGenAI with process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following website: ${url}. 
    1. Identify the likely Google Analytics (GA4) G-XXXXXX ID or GTM ID used by this site.
    2. Assess the technical stack.
    3. Determine the vulnerability score (1-100) for handling high concurrent traffic.
    Return JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          serverInfo: { type: Type.STRING },
          technologies: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          vulnerabilityScore: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          trackingId: { type: Type.STRING, description: "The detected GA4 G-XXXXX ID" },
          expectedLoadTime: { type: Type.NUMBER, description: "Average load time in ms" }
        },
        required: ["title", "serverInfo", "technologies", "vulnerabilityScore", "summary"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return {
      ...data,
      expectedLoadTime: data.expectedLoadTime || 450
    };
  } catch (e) {
    return {
      title: "Active Simulation Node",
      serverInfo: "Global Edge",
      technologies: ["GA4-Integrated", "HTTPS/3"],
      vulnerabilityScore: 65,
      summary: "System ready for human-traffic injection.",
      expectedLoadTime: 500
    };
  }
};

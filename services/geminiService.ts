
import { GoogleGenAI } from "@google/genai";

export async function explainPredictiveCoding(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a world-class neuroscience and machine learning expert. Explain Predictive Coding concepts clearly, focusing on hierarchical modeling and prediction error minimization.",
    }
  });
  return response.text;
}

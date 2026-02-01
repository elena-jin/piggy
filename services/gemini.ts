import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { StoryData } from "../types";

const API_KEY = process.env.API_KEY;

/**
 * Helper to retry API calls on 429 errors with exponential backoff.
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const is429 = error?.message?.includes('429') || error?.status === 429;
      if (is429 && i < maxRetries - 1) {
        console.warn(`Rate limit hit (429). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  return await fn();
}

export const generateStory = async (age: number, concept: string): Promise<StoryData> => {
  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const isOlder = age >= 10;
    const rules = isOlder
      ? "Text can use moderate vocabulary and compound sentences. Numbers can be larger ($1-$100) to introduce real-world pricing concepts."
      : "Keep text simple, short, and friendly. Numbers should be small ($1-$20).";

    const prompt = `Generate an interactive storybook for Piggy, an AI storybook author. 
    Target Age: ${age}. Concept: ${concept}. 
    The main character is Piggy (a pig). 
    
    IMPORTANT for "knowledge_check":
    - Do NOT ask recall questions about what happened in the story (e.g., "What did Piggy buy?").
    - Instead, generate "What would YOU do?" scenarios relevant to the child's life but related to the concept.
    - Scenarios should cover real-life situations like spending allowance, buying gifts, saving for a toy, or sharing.
    - Example: "You have $5 for allowance. You want a toy that costs $4, but your friend's birthday is tomorrow. What do you do?"
    - Ensure choices illustrate the financial concept clearly.

    Follow the exact JSON format requested in the instructions. 
    ${rules}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            book: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                concept: { type: Type.STRING },
                age_band: { type: Type.STRING },
                pages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      page_number: { type: Type.NUMBER },
                      image_prompt: { type: Type.STRING },
                      text: { type: Type.STRING }
                    },
                    required: ["page_number", "image_prompt", "text"]
                  }
                }
              },
              required: ["title", "concept", "age_band", "pages"]
            },
            piggy_intro: {
              type: Type.OBJECT,
              properties: { text: { type: Type.STRING } },
              required: ["text"]
            },
            piggy_recap: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.ARRAY, items: { type: Type.STRING } },
                lesson: { type: Type.STRING }
              },
              required: ["summary", "lesson"]
            },
            knowledge_check: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  choices: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING }
                      }
                    }
                  },
                  correct_answer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            },
            piggy_interaction_rules: {
              type: Type.OBJECT,
              properties: {
                style: { type: Type.STRING },
                allowed_topics: { type: Type.STRING },
                redirect_rule: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  });
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const fullPrompt = `Children's book illustration, watercolor style, soft colors, adorable character. ${prompt}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: fullPrompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    } catch (error: any) {
      console.error("Image generation failed", error);
      throw error; // Re-throw to trigger retry logic
    }
    return null;
  });
};

export const generateAudio = async (text: string): Promise<string | null> => {
  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO" as any],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  });
};

import { GoogleGenAI, Type } from "@google/genai";
import { EmotionResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const emotionAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    emotion: {
      type: Type.STRING,
      description: '감지된 주된 감정 (예: 기쁨, 슬픔, 분노). 한국어로 응답.',
    },
    confidence: {
      type: Type.NUMBER,
      description: '감지된 감정에 대한 신뢰도 점수 (0.0에서 1.0 사이).',
    },
    reasoning: {
      type: Type.STRING,
      description: '이 감정이 감지된 이유에 대한 간략한 설명. 한국어로 응답.',
    },
    emoji: {
      type: Type.STRING,
      description: '감정을 가장 잘 나타내는 단일 이모지.',
    },
  },
  required: ['emotion', 'confidence', 'reasoning', 'emoji'],
};

export const analyzeEmotionFromText = async (text: string): Promise<EmotionResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `다음 텍스트에서 감정을 분석해줘: "${text}"`,
      config: {
        systemInstruction: `당신은 텍스트에서 인간의 감정을 분석하는 전문가 AI입니다. 제공된 텍스트를 기반으로 주요 감정, 0에서 1 사이의 신뢰도 점수, 분석에 대한 간략한 근거, 그리고 감정을 가장 잘 나타내는 단일 이모지를 식별합니다. 모든 응답은 한국어로 해주세요.`,
        responseMimeType: 'application/json',
        responseSchema: emotionAnalysisSchema,
      },
    });

    const resultJson = response.text.trim();
    const parsedResult = JSON.parse(resultJson);

    return parsedResult as EmotionResult;

  } catch (error) {
    console.error("Error analyzing emotion:", error);
    if (error instanceof Error) {
        throw new Error(`감정 분석 중 오류 발생: ${error.message}`);
    }
    throw new Error("알 수 없는 오류로 감정 분석에 실패했습니다.");
  }
};

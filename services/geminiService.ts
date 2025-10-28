import { GoogleGenAI, Type } from "@google/genai";
import { EmotionResult } from '../types';
import deviceProfilesData from '../device_profile.json';

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
    iot_recommendations: {
      type: Type.ARRAY,
      description: '분석된 감정을 기반으로 추천하는 2-3가지 IoT 기기 목록. 한국어로 응답.',
      items: {
        type: Type.OBJECT,
        properties: {
          device: {
            type: Type.STRING,
            description: '추천하는 IoT 기기 이름 (예: 스마트 조명, AI 스피커). 한국어로 응답.',
          },
          reason: {
            type: Type.STRING,
            description: '이 기기를 추천하는 이유에 대한 간략한 설명. 한국어로 응답.',
          },
        },
        required: ['device', 'reason'],
      },
    },
  },
  required: ['emotion', 'confidence', 'reasoning', 'emoji', 'iot_recommendations'],
};

export const analyzeEmotionFromText = async (text: string, deviceIds: string[]): Promise<EmotionResult> => {
  const { deviceProfiles } = deviceProfilesData;

  const selectedDevices = deviceProfiles.filter(profile => deviceIds.includes(profile.id));

  const devicePromptPart = selectedDevices.length > 0
    ? `사용자가 다음의 IoT 기기들을 소유하고 있습니다. 추천 시 이 목록을 최우선으로 고려하되, 만약 감정에 더 적합한 다른 기기가 있다면 자유롭게 추천해주세요:\n${selectedDevices.map(d => `- ${d.name} (기능: ${d.components.flatMap(c => c.capabilities.map(cap => cap.id)).join(', ')})`).join('\n')}`
    : '사용자가 소유한 특정 기기 정보가 없습니다. 감정에 가장 적합한 일반적인 IoT 기기를 추천해주세요.';

  const systemInstruction = `당신은 텍스트에서 인간의 감정을 분석하고, 그 감정에 기반하여 사용자 경험을 향상시킬 수 있는 지능형 IoT 기기를 추천하는 전문가 AI입니다. 제공된 텍스트를 기반으로 주요 감정, 신뢰도 점수, 분석 근거, 감정을 나타내는 이모지를 식별합니다. 또한, 분석된 감정에 가장 적합한 IoT 기기를 2-3가지 추천하고 그 이유를 설명합니다. ${devicePromptPart} 모든 응답은 한국어로 해주세요.`;

  console.log("System Instruction:", systemInstruction);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `다음 텍스트에서 감정을 분석하고 적절한 IoT 기기를 추천해줘: "${text}"`,
      config: {
        systemInstruction,
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

// Helper function to convert File to a Gemini Part
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const transcribeAudioFile = async (audioFile: File): Promise<string> => {
  try {
    const audioPart = await fileToGenerativePart(audioFile);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [audioPart, { text: "이 오디오 파일의 내용을 텍스트로 변환해줘." }] },
    });
    
    const transcription = response.text;
    if (!transcription.trim()) {
      throw new Error("오디오에서 음성을 인식하지 못했습니다. 파일이 비어있거나 너무 조용할 수 있습니다.");
    }
    return transcription;

  } catch (error) {
    console.error("Error transcribing audio:", error);
    if (error instanceof Error) {
        throw new Error(`오디오 변환 중 오류 발생: ${error.message}`);
    }
    throw new Error("알 수 없는 오류로 오디오 변환에 실패했습니다.");
  }
};
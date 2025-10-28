export interface DeviceCommand {
  component: string;
  capability: string;
  command: string;
  arguments?: string;
}

export interface DeviceControl {
  id: string;
  name: string;
  commands: DeviceCommand[];
}

export interface DeviceExplanation {
    device_name: string;
    explanation: string;
}

export interface DeviceControlResult {
  summary: string;
  device_explanations: DeviceExplanation[];
  device_commands: DeviceControl[];
}

export interface EmotionResult {
  emotion: string;
  confidence: number;
  reasoning: string;
  emoji: string;
  device_control: DeviceControlResult | null;
}

export type AppStatus = 'idle' | 'listening' | 'analyzing' | 'error';

// Add these declarations for the Web Speech API
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export type AppStatus = 'idle' | 'listening' | 'analyzing' | 'error';

export interface EmotionResult {
    emotion: string;
    reason: string;
    device_control: DeviceControl[] | null;
}

export interface DeviceControl {
    device: string;
    action: string;
    reason: string;
}

export interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
}

export interface Device {
    id: string;
    name: string;
    components: {
      id: string;
      capabilities: {
        id: string;
        version: number;
        attributes: {
          [key: string]: {
            description: string;
          };
        };
      }[];
    }[];
  }

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeEmotionFromText } from './services/geminiService';
// FIX: Import SpeechRecognition type to provide type information for the Web Speech API.
import { EmotionResult, AppStatus, SpeechRecognition } from './types';
import MicrophoneIcon from './components/icons/MicrophoneIcon';
import StopIcon from './components/icons/StopIcon';
import Loader from './components/Loader';
import EmotionDisplay from './components/EmotionDisplay';

// Handle browser prefix for SpeechRecognition
// FIX: Rename variable to 'SpeechRecognitionAPI' to avoid a naming conflict with the imported 'SpeechRecognition' type.
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [emotionResult, setEmotionResult] = useState<EmotionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // FIX: Explicitly type the ref with the imported SpeechRecognition interface.
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // FIX: Use the renamed 'SpeechRecognitionAPI' variable to check for browser support.
    if (!SpeechRecognitionAPI) {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해 보세요.');
      setStatus('error');
      return;
    }

    // FIX: Use the renamed 'SpeechRecognitionAPI' variable to create a new recognition instance.
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      handleAnalysis(currentTranscript);
    };

    recognition.onerror = (event) => {
      setError(`음성 인식 오류: ${event.error}`);
      setStatus('error');
    };

    recognition.onend = () => {
        // Only switch to idle if not analyzing
        if(status === 'listening') {
            setStatus('idle');
        }
    };
    
    recognitionRef.current = recognition;
  }, [status]); // Re-create if status changes, might need refinement if buggy

  const handleAnalysis = async (text: string) => {
    if (!text.trim()) {
        setStatus('idle');
        setError("인식된 내용이 없습니다.");
        return;
    }
    setStatus('analyzing');
    setError(null);
    try {
      const result = await analyzeEmotionFromText(text);
      setEmotionResult(result);
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const handleToggleRecording = useCallback(() => {
    if (status === 'listening') {
      recognitionRef.current?.stop();
      setStatus('idle');
    } else {
      setEmotionResult(null);
      setError(null);
      setTranscript('');
      setStatus('listening');
      recognitionRef.current?.start();
    }
  }, [status]);

  const getStatusMessage = () => {
    switch (status) {
      case 'listening':
        return '음성을 듣고 있습니다...';
      case 'analyzing':
        return '감정을 분석하고 있습니다...';
      case 'error':
        return error || '오류가 발생했습니다.';
      case 'idle':
      default:
        return '마이크 버튼을 눌러 분석을 시작하세요.';
    }
  };

  const isRecording = status === 'listening';

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-between p-4 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-sky-500/[0.05]"></div>
        <header className="w-full max-w-4xl mx-auto text-center py-6 z-10">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
                음성 감정 분석기
            </h1>
            <p className="text-gray-400 mt-2">Gemini AI와 함께 당신의 목소리에 담긴 감정을 알아보세요.</p>
        </header>

        <main className="flex flex-col items-center justify-center flex-grow w-full max-w-md z-10 px-4">
            {status === 'analyzing' && <Loader />}
            {!emotionResult && status !== 'analyzing' && (
                 <div className="text-center text-gray-400 p-8 border-2 border-dashed border-gray-700 rounded-2xl">
                    <MicrophoneIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p>{getStatusMessage()}</p>
                 </div>
            )}
            {emotionResult && <EmotionDisplay result={emotionResult} transcript={transcript} />}
            {status === 'error' && !emotionResult && <p className="mt-4 text-red-400">{error}</p>}
        </main>

        <footer className="w-full flex flex-col items-center justify-center py-6 z-10 sticky bottom-0">
             <button
                onClick={handleToggleRecording}
                className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50
                ${isRecording 
                    ? 'bg-red-500 text-white shadow-red-500/50 focus:ring-red-400' 
                    : 'bg-sky-500 text-white shadow-sky-500/50 focus:ring-sky-400'
                }`}
                aria-label={isRecording ? '녹음 중지' : '녹음 시작'}
            >
                {isRecording && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                {isRecording ? <StopIcon className="w-8 h-8"/> : <MicrophoneIcon className="w-10 h-10"/>}
            </button>
        </footer>
    </div>
  );
};

export default App;

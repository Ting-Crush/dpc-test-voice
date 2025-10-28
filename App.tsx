import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeEmotion, recommendIotDevices, transcribeAudioFile } from './services/geminiService';
import { EmotionResult, AppStatus, SpeechRecognition } from './types';
import MicrophoneIcon from './components/icons/MicrophoneIcon';
import StopIcon from './components/icons/StopIcon';
import Loader from './components/Loader';
import EmotionDisplay from './components/EmotionDisplay';
import UploadIcon from './components/icons/UploadIcon';
import { audioSamples, AudioSample } from './data/samples';
import Settings from './pages/Settings';
import deviceProfiles from './device_profile.json';

// Handle browser prefix for SpeechRecognition
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

type Page = 'main' | 'settings';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [emotionResult, setEmotionResult] = useState<EmotionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('main');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalysis = useCallback(async (text: string) => {
    if (!text.trim()) {
        setStatus('idle');
        setError("인식된 내용이 없습니다.");
        return;
    }
    setStatus('analyzing');
    setError(null);
    setEmotionResult(null); // Reset previous results

    try {
      // Step 1: Analyze emotion
      const emotionData = await analyzeEmotion(text);
      setEmotionResult({ ...emotionData, device_control: null }); // Show emotion result first

      // Step 2: Recommend devices based on emotion
      const deviceControlData = await recommendIotDevices(emotionData.emotion, selectedDevices);
      
      setEmotionResult(prevResult => prevResult ? { ...prevResult, device_control: deviceControlData } : null);
      setStatus('idle');

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      setStatus('error');
    }
  }, [selectedDevices]);

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해 보세요.');
      setStatus('error');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      handleAnalysis(currentTranscript);
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') {
          return; // User stopped recording, not an error.
      }
      let userFriendlyError = '';
      switch(event.error) {
          case 'no-speech':
              userFriendlyError = '음성을 감지하지 못했습니다. 마이크에 더 가까이 대고 말씀해주세요.';
              break;
          case 'not-allowed':
          case 'service-not-allowed':
              userFriendlyError = '마이크 사용 권한이 거부되었습니다. 브라우저 설정을 확인해주세요.';
              break;
          default:
              userFriendlyError = `알 수 없는 음성 인식 오류가 발생했습니다: ${event.error}`;
      }
      setError(userFriendlyError);
      setStatus('error');
    };

    recognition.onend = () => {
      setStatus((currentStatus) => (currentStatus === 'listening' ? 'idle' : currentStatus));
    };

  }, [handleAnalysis]);

  const handleToggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    if (status === 'listening') {
      recognitionRef.current.stop();
    } else {
      setEmotionResult(null);
      setError(null);
      setTranscript('');
      setStatus('listening');
      recognitionRef.current.start();
    }
  }, [status]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('analyzing');
setError(null);
    setEmotionResult(null);
    setTranscript('');

    try {
      const transcribedText = await transcribeAudioFile(file);
      setTranscript(transcribedText);
      await handleAnalysis(transcribedText);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      setStatus('error');
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSampleSelect = useCallback(async (sample: AudioSample) => {
    setStatus('analyzing');
    setError(null);
    setEmotionResult(null);
    setTranscript('');
    try {
      const response = await fetch(sample.dataUri);
      if (!response.ok) {
        throw new Error(`샘플 파일을 불러오는 데 실패했습니다: ${response.statusText}`);
      }
      const blob = await response.blob();
      const fileName = `${sample.title}.mp3`;
      const file = new File([blob], fileName, { type: sample.mimeType });
      
      const transcribedText = await transcribeAudioFile(file);
      setTranscript(transcribedText);
      await handleAnalysis(transcribedText);

    } catch(e) {
      const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
      setError(`오디오 샘플 처리 중 오류 발생: ${errorMessage}`);
      setStatus('error');
    }
  }, [handleAnalysis]);

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
        return '예제 음성을 선택하거나 직접 음성을 입력하여 분석을 시작하세요.';
    }
  };

  const isRecording = status === 'listening';
  const isProcessing = status === 'analyzing' || status === 'listening';

  if (currentPage === 'settings') {
    return <Settings onBack={() => setCurrentPage('main')} selectedDevices={selectedDevices} onDeviceSelectionChange={setSelectedDevices} />;
  }

  const getSelectedDeviceNames = () => {
    return selectedDevices.map(deviceId => {
      const device = deviceProfiles.deviceProfiles.find(d => d.id === deviceId);
      return device ? device.name : 'Unknown Device';
    });
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-start p-4 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-sky-500/[0.05]"></div>
        
        <header className="w-full max-w-4xl mx-auto text-center py-8 md:py-12 z-10 relative">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
                음성 감정 기반 IoT 제어
            </h1>
            <p className="text-gray-400 mt-4 text-lg">
                음성 샘플을 선택하여 감정을 분석하고 Gemini 기반의 지능형 IoT 기기 추천을 받아보세요.
            </p>
            <button
                onClick={() => setCurrentPage('settings')}
                className="absolute top-8 right-0 text-gray-400 hover:text-white transition-colors"
                aria-label="Settings"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </header>

        <main className="w-full max-w-5xl mx-auto z-10 flex-grow">
            {selectedDevices.length > 0 && (
                <section id="selected-devices" className="mb-8">
                    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">선택된 디바이스:</h3>
                        <div className="flex flex-wrap gap-2">
                            {getSelectedDeviceNames().map((name, index) => (
                                <span key={index} className="bg-sky-500/20 text-sky-300 text-xs font-medium px-2.5 py-1 rounded-full">
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            <section id="sample-selection" className="mb-12">
                <h2 className="flex items-center text-2xl font-semibold text-gray-200 mb-6">
                    <span className="flex items-center justify-center w-8 h-8 mr-4 bg-sky-500 text-white rounded-full font-bold">1</span>
                    예제 음성 샘플 선택
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {audioSamples.map((sample) => {
                        const Icon = sample.icon;
                        return (
                            <button
                                key={sample.title}
                                onClick={() => handleSampleSelect(sample)}
                                disabled={status === 'analyzing'}
                                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl text-left border border-gray-700 hover:border-sky-400 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-wait disabled:hover:border-gray-700 disabled:hover:scale-100"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-white">{sample.title}</h3>
                                    <div className="p-2 bg-gray-700/50 rounded-full">
                                        <Icon className="w-6 h-6 text-sky-400" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400">{sample.description}</p>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section id="analysis-result" className="flex flex-col items-center justify-center min-h-[300px] mb-12">
                {status === 'analyzing' && <Loader />}
                {!emotionResult && status !== 'analyzing' && (
                    <div className="text-center text-gray-400 p-8 border-2 border-dashed border-gray-700 rounded-2xl w-full max-w-md">
                        <p className={status === 'error' ? 'text-red-400' : ''}>{getStatusMessage()}</p>
                    </div>
                )}
                {emotionResult && <EmotionDisplay result={emotionResult} transcript={transcript} />}
            </section>
        </main>
        
        <footer className="w-full flex flex-col items-center justify-center py-6 z-10 sticky bottom-0 bg-gray-900/50 backdrop-blur-sm">
            <div className="text-center mb-4">
                <p className="text-gray-400">또는 직접 음성을 입력하세요</p>
            </div>
             <div className="flex items-center space-x-6">
                <button
                    onClick={handleUploadClick}
                    disabled={isProcessing}
                    className="flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50 bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                    aria-label="음성 파일 업로드"
                >
                    <UploadIcon className="w-8 h-8" />
                </button>
                <button
                    onClick={handleToggleRecording}
                    disabled={status === 'analyzing'}
                    className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50
                    ${isRecording 
                        ? 'bg-red-500 text-white shadow-red-500/50 focus:ring-red-400' 
                        : 'bg-sky-500 text-white shadow-sky-500/50 focus:ring-sky-400'
                    } disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed`}
                    aria-label={isRecording ? '녹음 중지' : '녹음 시작'}
                >
                    {isRecording && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                    {isRecording ? <StopIcon className="w-8 h-8"/> : <MicrophoneIcon className="w-10 h-10"/>}
                </button>
             </div>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="audio/*"
                className="hidden"
             />
        </footer>
        <div className="absolute bottom-0 left-0 w-full text-center p-4 z-0">
             <p className="text-xs text-gray-600">세계적 수준의 시니어 프론트엔드 엔지니어가 제작했습니다.</p>
        </div>
    </div>
  );
};

export default App;

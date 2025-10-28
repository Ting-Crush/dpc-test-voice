import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeEmotion, recommendIotDevices, transcribeAudioFile } from './services/geminiService';
import { EmotionResult, AppStatus, SpeechRecognition, Device } from './types';
import MicrophoneIcon from './components/icons/MicrophoneIcon';
import StopIcon from './components/icons/StopIcon';
import Loader from './components/Loader';
import EmotionDisplay from './components/EmotionDisplay';
import UploadIcon from './components/icons/UploadIcon';
import { audioSamples, AudioSample } from './data/samples';
import Settings from './pages/Settings';
import deviceProfiles from './device_profile.json';
import { getIconForDevice } from './components/deviceUtils';
import wallpaper from '@/resource/wallpaper.jpg';

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
    const analysisResultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (emotionResult) {
            analysisResultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [emotionResult]);

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
            let devicesForRequest = selectedDevices;
            if (selectedDevices.length === 0) {
                const allDeviceIds = deviceProfiles.deviceProfiles.map(d => d.id);
                setSelectedDevices(allDeviceIds);
                devicesForRequest = allDeviceIds;
            }

            // Step 1: Analyze emotion
            const emotionData = await analyzeEmotion(text);
            setEmotionResult({ ...emotionData, device_control: null }); // Show emotion result first

            // Step 2: Recommend devices based on emotion
            const deviceControlData = await recommendIotDevices(emotionData.emotion, devicesForRequest);
            
            setEmotionResult(prevResult => prevResult ? { ...prevResult, device_control: deviceControlData } : null);
            setStatus('idle');

        } catch (e)
        {
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
            // 각 샘플별 직접 텍스트 매핑
            const sampleTextMap: { [key: string]: string } = {
                '행복한 아침 목소리': '아이 좋은 아침!',
                '피곤한 저녁 목소리': '아으 죽겠다 피곤해',
                '좌절한 업무 목소리': '아 망했다',
                '집중한 공부 목소리': '열공!'
            };

            const directText = sampleTextMap[sample.title];
            if (directText) {
                setTranscript(directText);
                await handleAnalysis(directText);
                return;
            }

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
                return '';
        }
    };

    const isRecording = status === 'listening';
    const isProcessing = status === 'analyzing' || status === 'listening';

    if (currentPage === 'settings') {
        return <Settings onBack={() => setCurrentPage('main')} selectedDevices={selectedDevices} onDeviceSelectionChange={setSelectedDevices} />;
    }

    const getSelectedDeviceDetails = () => {
        return selectedDevices.map(deviceId => {
            const device = deviceProfiles.deviceProfiles.find(d => d.id === deviceId) as Device | undefined;
            return device ? { name: device.name, icon: getIconForDevice(device.name) } : null;
        }).filter(Boolean);
    };

    return (
        <div
            className="text-white min-h-screen flex flex-col items-center justify-start p-4 font-sans relative overflow-hidden"
            style={{
                backgroundImage: `url(${wallpaper})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            
            <header className="w-full max-w-4xl mx-auto text-center py-8 md:py-12 z-10 relative">
                <div className="flex justify-center items-center">
                    <img src="/resource/SmartThings_logo_small.png" alt="SmartThings Logo" className="h-12 mr-4" />
                    <h1 className="text-4xl md:text-5xl font-bold text-white py-2">
                        SmartThings MindControl
                    </h1>
                </div>
                <div className="text-white mt-9 leading-relaxed">
                    <p className="text-3xl">내 마음을 알아주는 SmartThings Home AI,</p>
                    <p className="text-2xl mt-2">당신 목소리만으로 감정을 분석하여 댁 내 분위기가 바뀌는 마법을 경험해 보세요.</p>
                </div>
            </header>

            <main className="w-full max-w-5xl mx-auto z-10 flex-grow">
                <section id="selected-devices" className="mb-8">
                    <h2 className="flex items-center text-2xl font-semibold text-gray-200 mb-6">
                        선택된 디바이스
                    </h2>
                    <div className="bg-black/30 backdrop-blur-lg p-4 rounded-2xl border border-white/20">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {getSelectedDeviceDetails().map((device, index) => (
                                device && (
                                    <div key={index} className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-sky-500/10">
                                        <img src={`/resource/${device.icon}`} alt={device.name} className="w-10 h-10 mb-2" />
                                        <span className="text-sky-300 text-xs font-medium">
                                            {device.name}
                                        </span>
                                    </div>
                                )
                            ))}
                            <button 
                                onClick={() => setCurrentPage('settings')}
                                className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
                                aria-label="Add device"
                            >
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <span className="text-sky-300 text-xs font-medium">
                                    추가
                                </span>
                            </button>
                        </div>
                    </div>
                </section>
                <section id="sample-selection" className="mb-12">
                    <h2 className="flex items-center text-2xl font-semibold text-gray-200 mb-6">
                        음성 예제
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {audioSamples.map((sample) => {
                            const Icon = sample.icon;
                            return (
                                <button
                                    key={sample.title}
                                    onClick={() => handleSampleSelect(sample)}
                                    disabled={status === 'analyzing'}
                                    className="bg-black/30 backdrop-blur-lg p-6 rounded-2xl text-left border border-white/20 hover:border-sky-400 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-wait disabled:hover:border-white/20 disabled:hover:scale-100"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-base font-bold text-white">{sample.title}</h3>
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

                <section id="analysis-result" ref={analysisResultRef} className="flex flex-col items-center justify-center min-h-[300px] mb-4">
                    {status === 'analyzing' && <Loader />}
                    {!emotionResult && status !== 'analyzing' && getStatusMessage() && (
                        <div className="text-center text-gray-400 p-8 bg-black/30 backdrop-blur-lg rounded-2xl w-full max-w-md border border-white/20">
                            <p className={status === 'error' ? 'text-red-400' : ''}>{getStatusMessage()}</p>
                        </div>
                    )}
                    {emotionResult && <EmotionDisplay result={emotionResult} transcript={transcript} />}
                </section>
            </main>
            
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-6">
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
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="audio/*"
                    className="hidden"
                />
            </div>
            <div className="absolute bottom-0 left-0 w-full text-center p-4 z-0">
                <p className="text-xs text-gray-600">세계적 수준의 시니어 프론트엔드 엔지니어가 제작했습니다.</p>
            </div>
        </div>
    );
};

export default App;
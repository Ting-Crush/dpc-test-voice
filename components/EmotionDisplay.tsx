
import React from 'react';
import { EmotionResult } from '../types';

interface EmotionDisplayProps {
  result: EmotionResult;
  transcript: string;
}

const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ result, transcript }) => {
  const confidencePercentage = (result.confidence * 100).toFixed(0);
  const confidenceColor = result.confidence > 0.7 ? 'text-green-400' : result.confidence > 0.4 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg w-full max-w-md text-center border border-gray-700 transition-all duration-500 ease-in-out transform hover:scale-105 hover:border-sky-400">
      <div className="text-8xl mb-4 animate-bounce">{result.emoji}</div>
      <h2 className="text-4xl font-bold text-white mb-2">{result.emotion}</h2>
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${confidencePercentage}%` }}></div>
        </div>
        <span className={`font-mono text-lg ${confidenceColor}`}>{confidencePercentage}%</span>
      </div>
      <p className="text-gray-300 mb-6">{result.reasoning}</p>
      <div className="text-left bg-gray-900/70 p-4 rounded-lg border border-gray-600">
        <p className="text-sm text-gray-400 font-semibold mb-1">인식된 텍스트:</p>
        <p className="text-gray-200 italic">"{transcript}"</p>
      </div>
    </div>
  );
};

export default EmotionDisplay;

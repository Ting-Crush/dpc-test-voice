import React from 'react';
import DeviceSelector from '../components/DeviceSelector';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
        <div className="flex items-center mb-8">
            <button
                onClick={onBack}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Back"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h1 className="text-2xl font-bold text-white ml-4">Settings</h1>
        </div>
        <DeviceSelector />
    </div>
  );
};

export default Settings;

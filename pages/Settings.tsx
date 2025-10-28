import React from 'react';
import DeviceSelector from '../components/DeviceSelector';

const Settings: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center flex-grow">
      <DeviceSelector />
    </div>
  );
};

export default Settings;

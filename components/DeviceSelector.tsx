
import React, { useState, useEffect } from 'react';
import deviceProfiles from '../device_profile.json';

interface Device {
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

interface DeviceSelectorProps {
    selectedDevices: string[];
    onSelectionChange: (selected: string[]) => void;
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({ selectedDevices, onSelectionChange }) => {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    setDevices(deviceProfiles.deviceProfiles);
  }, []);

  const handleDeviceSelect = (deviceId: string) => {
    const newSelection = selectedDevices.includes(deviceId)
      ? selectedDevices.filter(id => id !== deviceId)
      : [...selectedDevices, deviceId];
    onSelectionChange(newSelection);
  };

  const getIconForDevice = (deviceName: string) => {
    switch (deviceName) {
      case 'Smart Bulb':
        return 'Light.png';
      case 'Galaxy Home Mini':
        return 'Speaker.png';
      case 'Blind':
        return 'Blind.png';
      case 'Smart TV':
        return 'TV.png';
      case 'Thermostat':
        return 'Thermostat.png';
      case 'Humidifier':
        return 'Humidifier.png';
      case 'Diffuser':
        return 'Diffuser.png';
      case 'Robot Vacuum':
        return 'RobotVacuum.png';
      default:
        return 'Other.png';
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Select Devices</h2>
      <ul className="grid grid-cols-3 gap-4">
        {devices.map(device => (
          <li
            key={device.id}
            onClick={() => handleDeviceSelect(device.id)}
            className={`p-4 rounded-lg cursor-pointer flex flex-col items-center justify-center text-center ${selectedDevices.includes(device.id) ? 'bg-sky-500/20' : 'bg-gray-800'}`}>
            <img src={`/resource/${getIconForDevice(device.name)}`} alt={device.name} className="w-12 h-12 mb-2" />
            <span className="text-white">{device.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DeviceSelector;

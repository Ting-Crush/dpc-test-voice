
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

const DeviceSelector: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    setDevices(deviceProfiles.deviceProfiles);
  }, []);

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
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
      <h2 className="text-xl font-semibold text-white mb-4">Select a Device</h2>
      <ul className="grid grid-cols-3 gap-4">
        {devices.map(device => (
          <li
            key={device.id}
            onClick={() => handleDeviceSelect(device)}
            className={`p-4 rounded-lg cursor-pointer flex flex-col items-center justify-center text-center ${selectedDevice?.id === device.id ? 'bg-sky-500/20' : 'bg-gray-800'}`}>
            <img src={`/resource/${getIconForDevice(device.name)}`} alt={device.name} className="w-12 h-12 mb-2" />
            <span className="text-white">{device.name}</span>
          </li>
        ))}
      </ul>

      {selectedDevice && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white">{selectedDevice.name} Capabilities</h3>
          <ul className="mt-2 space-y-1 text-gray-200">
            {selectedDevice.components.map(component =>
              component.capabilities.map(capability => (
                <li key={capability.id}>
                  <strong>{capability.id}</strong>
                  <ul className="pl-4">
                    {Object.entries(capability.attributes).map(([attr, { description }]) => (
                      <li key={attr}>{`${attr}: ${description}`}</li>
                    ))}
                  </ul>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DeviceSelector;

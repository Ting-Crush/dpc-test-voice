export const getIconForDevice = (deviceName: string) => {
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
  
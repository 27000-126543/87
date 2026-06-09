import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPUE = (pue: number): string => {
  return formatNumber(pue, 3);
};

export const formatPower = (power: number): string => {
  if (power >= 1000000) {
    return `${formatNumber(power / 1000000, 2)} MW`;
  } else if (power >= 1000) {
    return `${formatNumber(power / 1000, 2)} kW`;
  }
  return `${formatNumber(power, 0)} W`;
};

export const formatEnergy = (energy: number): string => {
  if (energy >= 1000000000) {
    return `${formatNumber(energy / 1000000000, 2)} GWh`;
  } else if (energy >= 1000000) {
    return `${formatNumber(energy / 1000000, 2)} MWh`;
  } else if (energy >= 1000) {
    return `${formatNumber(energy / 1000, 2)} kWh`;
  }
  return `${formatNumber(energy, 0)} Wh`;
};

export const formatCarbon = (carbon: number): string => {
  if (carbon >= 1000000) {
    return `${formatNumber(carbon / 1000000, 2)} 万吨`;
  } else if (carbon >= 1000) {
    return `${formatNumber(carbon / 1000, 2)} 吨`;
  }
  return `${formatNumber(carbon, 0)} kg`;
};

export const formatTemperature = (temp: number): string => {
  return `${formatNumber(temp, 1)}°C`;
};

export const formatHumidity = (humidity: number): string => {
  return `${formatNumber(humidity, 1)}%`;
};

export const formatPercentage = (value: number): string => {
  return `${formatNumber(value, 1)}%`;
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  });
};

export const formatDateTime = (timestamp: number): string => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

export const formatDate = (timestamp: number): string => {
  return dayjs(timestamp).format('YYYY-MM-DD');
};

export const formatTime = (timestamp: number): string => {
  return dayjs(timestamp).format('HH:mm:ss');
};

export const formatRelativeTime = (timestamp: number): string => {
  return dayjs(timestamp).fromNow();
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)} 秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes} 分 ${secs} 秒`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} 小时 ${minutes} 分`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days} 天 ${hours} 小时`;
  }
};

export const formatTimeRange = (start: number, end: number): string => {
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getPUEColor = (pue: number): string => {
  if (pue < 1.3) return '#2ED573';
  if (pue < 1.4) return '#7BED9F';
  if (pue < 1.5) return '#FFA502';
  if (pue < 1.6) return '#FF6B6B';
  return '#FF4757';
};

export const getTemperatureColor = (temp: number): string => {
  if (temp < 24) return '#00D4FF';
  if (temp < 27) return '#2ED573';
  if (temp < 30) return '#FFA502';
  return '#FF4757';
};

export const getUtilizationColor = (util: number): string => {
  if (util < 30) return '#A0AEC0';
  if (util < 60) return '#2ED573';
  if (util < 85) return '#FFA502';
  return '#FF4757';
};

export const getChangeColor = (change: number): string => {
  if (change < 0) return '#2ED573';
  if (change === 0) return '#A0AEC0';
  return '#FF4757';
};

export const formatChange = (change: number, unit: string = '%'): string => {
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${formatNumber(change, 2)}${unit}`;
};

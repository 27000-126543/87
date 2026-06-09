import { useMemo } from 'react';

export const useChartTheme = () => {
  const chartTheme = useMemo(() => ({
    color: [
      '#00D4FF',
      '#2ED573',
      '#FFA502',
      '#FF4757',
      '#A55EEA',
      '#FF6B81',
      '#00CEC9',
      '#FDCB6E',
    ],
    backgroundColor: 'transparent',
    textStyle: {
      color: '#A0AEC0',
      fontFamily: 'Inter, sans-serif',
    },
    title: {
      textStyle: {
        color: '#F0F4F8',
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 600,
      },
      subtextStyle: {
        color: '#718096',
      },
    },
    legend: {
      textStyle: {
        color: '#A0AEC0',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 30, 54, 0.95)',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      borderWidth: 1,
      textStyle: {
        color: '#F0F4F8',
      },
    },
    axisLine: {
      lineStyle: {
        color: '#2D3748',
      },
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(45, 55, 72, 0.5)',
        type: 'dashed',
      },
    },
    axisLabel: {
      color: '#718096',
      fontFamily: 'JetBrains Mono, monospace',
    },
  }), []);

  const getPUEColor = (pue: number): string => {
    if (pue < 1.3) return '#2ED573';
    if (pue < 1.4) return '#7BED9F';
    if (pue < 1.5) return '#FFA502';
    if (pue < 1.6) return '#FF6B6B';
    return '#FF4757';
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp < 24) return '#00D4FF';
    if (temp < 27) return '#2ED573';
    if (temp < 30) return '#FFA502';
    return '#FF4757';
  };

  const getUtilizationColor = (util: number): string => {
    if (util < 30) return '#A0AEC0';
    if (util < 60) return '#2ED573';
    if (util < 85) return '#FFA502';
    return '#FF4757';
  };

  const getCarbonColor = (carbon: number, max: number): string => {
    const ratio = carbon / max;
    if (ratio < 0.3) return '#2ED573';
    if (ratio < 0.6) return '#FFA502';
    return '#FF4757';
  };

  const gaugeSeries = (value: number, max: number, title: string) => ({
    type: 'gauge',
    startAngle: 180,
    endAngle: 0,
    min: 0,
    max,
    splitNumber: 5,
    itemStyle: {
      color: getPUEColor(value),
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 5,
    },
    progress: {
      show: true,
      roundCap: true,
      width: 18,
    },
    pointer: {
      icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
      length: '60%',
      width: 12,
      offsetCenter: [0, '-10%'],
      itemStyle: {
        color: '#00D4FF',
      },
    },
    axisLine: {
      roundCap: true,
      lineStyle: {
        width: 18,
        color: [
          [0.3, '#2ED573'],
          [0.6, '#FFA502'],
          [1, '#FF4757'],
        ],
      },
    },
    axisTick: {
      show: false,
    },
    splitLine: {
      show: false,
    },
    axisLabel: {
      show: false,
    },
    title: {
      show: true,
      offsetCenter: [0, '20%'],
      fontSize: 14,
      color: '#A0AEC0',
    },
    detail: {
      show: true,
      valueAnimation: true,
      fontSize: 28,
      fontWeight: 'bold',
      offsetCenter: [0, '-5%'],
      color: '#F0F4F8',
      formatter: title === 'PUE' ? '{value}' : '{value}%',
    },
    data: [{ value, title }],
  });

  return {
    chartTheme,
    getPUEColor,
    getTemperatureColor,
    getUtilizationColor,
    getCarbonColor,
    gaugeSeries,
  };
};

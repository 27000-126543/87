import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { formatNumber } from '@/utils/formatters';

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title: string;
  subtitle?: string;
  unit?: string;
  decimals?: number;
  height?: number | string;
  thresholds?: number[];
}

export default function GaugeChart({
  value,
  min = 0,
  max = 100,
  title,
  subtitle,
  unit = '',
  decimals = 1,
  height = 200,
  thresholds,
}: GaugeChartProps) {
  const { getPUEColor } = useChartTheme();

  const option = useMemo(() => {
    const color = getPUEColor(value);
    const percentage = ((value - min) / (max - min)) * 100;

    return {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min,
          max,
          splitNumber: 5,
          itemStyle: {
            color,
            shadowColor: color + '40',
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowOffsetY: 5,
          },
          progress: {
            show: true,
            roundCap: true,
            width: 16,
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '55%',
            width: 10,
            offsetCenter: [0, '-10%'],
            itemStyle: {
              color: '#00D4FF',
              shadowColor: '#00D4FF',
              shadowBlur: 10,
            },
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 16,
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
            offsetCenter: [0, subtitle ? '20%' : '25%'],
            fontSize: 13,
            fontWeight: 500,
            color: '#A0AEC0',
            formatter: subtitle ? `{a|${title}}\n{b|${subtitle}}` : title,
            rich: {
              a: {
                fontSize: 13,
                fontWeight: 500,
                color: '#A0AEC0',
                lineHeight: 20,
              },
              b: {
                fontSize: 11,
                color: '#718096',
                lineHeight: 16,
              },
            },
          },
          detail: {
            show: true,
            valueAnimation: true,
            fontSize: 28,
            fontWeight: 'bold',
            offsetCenter: [0, '-5%'],
            color: '#F0F4F8',
            fontFamily: 'JetBrains Mono, monospace',
            formatter: `{value}${unit}`,
          },
          data: [
            {
              value: Number(value.toFixed(decimals)),
              title,
            },
          ],
        },
      ],
    };
  }, [value, min, max, title, subtitle, unit, decimals, thresholds, getPUEColor]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

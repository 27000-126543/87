import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { formatDateTime, formatNumber } from '@/utils/formatters';
import dayjs from 'dayjs';

interface LineChartData {
  timestamp: number;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  yAxisName?: string;
  yAxisUnit?: string;
  color?: string;
  smooth?: boolean;
  showArea?: boolean;
  height?: number | string;
  showLegend?: boolean;
  seriesName?: string;
  name?: string;
}

export default function LineChart({
  data,
  yAxisName,
  yAxisUnit = '',
  color = '#00D4FF',
  smooth = true,
  showArea = true,
  height = 300,
  showLegend = false,
  seriesName = '数据',
  name,
}: LineChartProps) {
  const displayName = name || seriesName;
  const { chartTheme } = useChartTheme();

  const option = useMemo(() => {
    const xAxisData = data.map(d => formatDateTime(d.timestamp));
    const seriesData = data.map(d => d.value);

    return {
      ...chartTheme,
      tooltip: {
        ...chartTheme.tooltip,
        trigger: 'axis',
        formatter: (params: any) => {
          const param = params[0];
          return `
            <div style="padding: 4px 8px;">
              <div style="color: #718096; font-size: 12px; margin-bottom: 4px;">${param.axisValue}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
                <span style="color: #F0F4F8; font-size: 14px; font-weight: 500;">
                  ${displayName}: ${formatNumber(param.value, 2)} ${yAxisUnit}
                </span>
              </div>
            </div>
          `;
        },
      },
      grid: {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60,
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: chartTheme.axisLine,
        axisLabel: {
          ...chartTheme.axisLabel,
          interval: Math.floor(data.length / 6),
          rotate: 0,
          formatter: (value: string) => {
            return dayjs(value).format('MM-DD HH:mm');
          },
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: yAxisName,
        nameTextStyle: {
          color: '#718096',
          fontSize: 12,
        },
        axisLine: chartTheme.axisLine,
        axisLabel: {
          ...chartTheme.axisLabel,
          formatter: (value: number) => `${formatNumber(value, 0)}`,
        },
        splitLine: chartTheme.splitLine,
      },
      series: [
        {
          name: displayName,
          type: 'line',
          data: seriesData,
          smooth,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: {
            width: 2,
            color,
          },
          itemStyle: {
            color,
            borderWidth: 2,
            borderColor: '#0F1E36',
          },
          areaStyle: showArea
            ? {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: color + '40' },
                    { offset: 1, color: color + '00' },
                  ],
                },
              }
            : undefined,
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: color,
            },
          },
        },
      ],
    };
  }, [data, yAxisName, yAxisUnit, color, smooth, showArea, chartTheme, displayName]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

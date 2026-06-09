import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { formatNumber } from '@/utils/formatters';

interface BarChartData {
  name: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  yAxisName?: string;
  yAxisUnit?: string;
  color?: string;
  colors?: string[];
  horizontal?: boolean;
  showLabel?: boolean;
  height?: number | string;
  sort?: 'asc' | 'desc' | 'none';
  name?: string;
}

export default function BarChart({
  data,
  yAxisName,
  yAxisUnit = '',
  color = '#00D4FF',
  colors,
  horizontal = false,
  showLabel = true,
  height = 300,
  sort = 'desc',
  name,
}: BarChartProps) {
  const { chartTheme, getCarbonColor } = useChartTheme();
  const displayName = name || '数据';

  const sortedData = useMemo(() => {
    const sorted = [...data];
    if (sort === 'desc') {
      sorted.sort((a, b) => b.value - a.value);
    } else if (sort === 'asc') {
      sorted.sort((a, b) => a.value - b.value);
    }
    return sorted;
  }, [data, sort]);

  const maxValue = Math.max(...sortedData.map(d => d.value));

  const option = useMemo(() => {
    const xAxisData = sortedData.map(d => d.name);
    const seriesData = sortedData.map((d, index) => {
      const itemColor = colors ? colors[index % colors.length] : color;
      return {
        value: d.value,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: horizontal ? 1 : 0,
            y2: horizontal ? 0 : 1,
            colorStops: [
              { offset: 0, color: itemColor + 'FF' },
              { offset: 1, color: itemColor + '40' },
            ],
          },
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
      };
    });

    return {
      ...chartTheme,
      tooltip: {
        ...chartTheme.tooltip,
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const param = params[0];
          return `
            <div style="padding: 4px 8px;">
              <div style="color: #718096; font-size: 12px; margin-bottom: 4px;">${param.name}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
                <span style="color: #F0F4F8; font-size: 14px; font-weight: 500;">
                  ${formatNumber(param.value, 2)} ${yAxisUnit}
                </span>
              </div>
            </div>
          `;
        },
      },
      grid: {
        top: 20,
        right: 30,
        bottom: 40,
        left: horizontal ? 120 : 60,
      },
      xAxis: horizontal
        ? {
            type: 'value',
            name: yAxisName,
            nameTextStyle: { color: '#718096', fontSize: 12 },
            axisLine: chartTheme.axisLine,
            axisLabel: chartTheme.axisLabel,
            splitLine: chartTheme.splitLine,
          }
        : {
            type: 'category',
            data: xAxisData,
            axisLine: chartTheme.axisLine,
            axisLabel: { ...chartTheme.axisLabel, rotate: 30 },
            splitLine: { show: false },
          },
      yAxis: horizontal
        ? {
            type: 'category',
            data: xAxisData,
            axisLine: chartTheme.axisLine,
            axisLabel: chartTheme.axisLabel,
            splitLine: { show: false },
          }
        : {
            type: 'value',
            name: yAxisName,
            nameTextStyle: { color: '#718096', fontSize: 12 },
            axisLine: chartTheme.axisLine,
            axisLabel: chartTheme.axisLabel,
            splitLine: chartTheme.splitLine,
          },
      series: [
        {
          name: displayName,
          type: 'bar',
          data: seriesData,
          barWidth: '60%',
          label: showLabel
            ? {
                show: true,
                position: horizontal ? 'right' : 'top',
                color: '#A0AEC0',
                fontSize: 12,
                formatter: (params: any) => `${formatNumber(params.value, 1)}`,
              }
            : undefined,
          emphasis: {
            itemStyle: {
              shadowBlur: 15,
              shadowColor: color + '60',
            },
          },
        },
      ],
    };
  }, [sortedData, yAxisName, yAxisUnit, color, colors, horizontal, showLabel, chartTheme, displayName]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

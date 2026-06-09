import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { calculateBoxPlotStats } from '@/utils/efficiency';

interface BoxPlotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
  name?: string;
}

interface BoxPlotChartProps {
  data: number[][] | BoxPlotStats[];
  labels: string[];
  yAxisName?: string;
  yAxisUnit?: string;
  height?: number | string;
}

export default function BoxPlotChart({
  data,
  labels,
  yAxisName = '温度',
  yAxisUnit = '°C',
  height = 300,
}: BoxPlotChartProps) {
  const { chartTheme } = useChartTheme();

  const option = useMemo(() => {
    const isPrecomputed = data.length > 0 && 'min' in data[0];
    
    const boxPlotData = data.map((d: any) => {
      if (isPrecomputed) {
        return [d.min, d.q1, d.median, d.q3, d.max];
      }
      const stats = calculateBoxPlotStats(d);
      return [stats.min, stats.q1, stats.median, stats.q3, stats.max];
    });

    const allOutliers: any[] = [];
    data.forEach((d: any, i) => {
      if (isPrecomputed) {
        d.outliers.forEach((outlier: number) => {
          allOutliers.push([i, outlier]);
        });
      } else {
        const stats = calculateBoxPlotStats(d);
        stats.outliers.forEach(outlier => {
          allOutliers.push([i, outlier]);
        });
      }
    });

    return {
      ...chartTheme,
      tooltip: {
        ...chartTheme.tooltip,
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesType === 'scatter') {
            return `异常值: ${params.value[1].toFixed(1)} ${yAxisUnit}`;
          }
          const value = params.value;
          return `
            <div style="padding: 4px 8px;">
              <div style="color: #F0F4F8; font-weight: 500; margin-bottom: 8px;">${labels[params.dataIndex]}</div>
              <div style="color: #718096; font-size: 12px; line-height: 1.8;">
                <div>最小值: <span style="color: #F0F4F8;">${value[0].toFixed(1)} ${yAxisUnit}</span></div>
                <div>下四分位: <span style="color: #F0F4F8;">${value[1].toFixed(1)} ${yAxisUnit}</span></div>
                <div>中位数: <span style="color: #00D4FF;">${value[2].toFixed(1)} ${yAxisUnit}</span></div>
                <div>上四分位: <span style="color: #F0F4F8;">${value[3].toFixed(1)} ${yAxisUnit}</span></div>
                <div>最大值: <span style="color: #F0F4F8;">${value[4].toFixed(1)} ${yAxisUnit}</span></div>
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
        data: labels,
        axisLine: chartTheme.axisLine,
        axisLabel: chartTheme.axisLabel,
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
        axisLabel: chartTheme.axisLabel,
        splitLine: chartTheme.splitLine,
      },
      series: [
        {
          name: '箱线图',
          type: 'boxplot',
          data: boxPlotData,
          itemStyle: {
            color: '#152A45',
            borderColor: '#00D4FF',
            borderWidth: 1.5,
          },
          boxWidth: ['50%', '50%'],
        },
        {
          name: '异常值',
          type: 'scatter',
          data: allOutliers,
          itemStyle: {
            color: '#FF4757',
            shadowBlur: 10,
            shadowColor: '#FF4757',
          },
          symbolSize: 8,
        },
      ],
    };
  }, [data, labels, yAxisName, yAxisUnit, chartTheme]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

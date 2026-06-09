import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { CityData } from '@/types';
import { formatPUE, formatCarbon } from '@/utils/formatters';

interface HeatMapProps {
  cities?: CityData[];
  data?: CityData[];
  onCityClick?: (city: CityData) => void;
  height?: number | string;
}

export default function HeatMap({ cities, data, onCityClick, height = 500 }: HeatMapProps) {
  const { chartTheme, getPUEColor } = useChartTheme();
  const displayCities = cities || data || [];

  const option = useMemo(() => {
    const data = displayCities.map(city => ({
      name: city.name,
      value: [city.coordinates.lng, city.coordinates.lat, city.avgPUE, city.totalCarbon, city.dataCenterCount],
    }));

    const maxCarbon = Math.max(...displayCities.map(c => c.totalCarbon));
    const maxPUE = Math.max(...displayCities.map(c => c.avgPUE));
    const minPUE = Math.min(...displayCities.map(c => c.avgPUE));

    return {
      ...chartTheme,
      backgroundColor: 'transparent',
      tooltip: {
        ...chartTheme.tooltip,
        trigger: 'item',
        formatter: (params: any) => {
          const city = displayCities.find(c => c.name === params.name);
          if (!city) return '';
          return `
            <div style="padding: 8px 12px;">
              <div style="color: #F0F4F8; font-weight: 600; font-size: 14px; margin-bottom: 8px;">
                ${city.name}
              </div>
              <div style="color: #718096; font-size: 12px; line-height: 1.8;">
                <div>数据中心: <span style="color: #F0F4F8;">${city.dataCenterCount} 个</span></div>
                <div>平均PUE: <span style="color: ${getPUEColor(city.avgPUE)};">${formatPUE(city.avgPUE)}</span></div>
                <div>碳排放: <span style="color: #FFA502;">${formatCarbon(city.totalCarbon)}</span></div>
              </div>
            </div>
          `;
        },
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        center: [105, 36],
        label: {
          show: false,
        },
        itemStyle: {
          areaColor: '#0F1E36',
          borderColor: '#1A3150',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            areaColor: '#152A45',
            borderColor: '#00D4FF',
          },
          label: {
            show: true,
            color: '#F0F4F8',
          },
        },
      },
      visualMap: {
        type: 'continuous',
        min: minPUE,
        max: maxPUE,
        calculable: true,
        orient: 'vertical',
        right: 20,
        top: 'center',
        text: ['高', '低'],
        textStyle: {
          color: '#A0AEC0',
          fontSize: 12,
        },
        inRange: {
          color: ['#2ED573', '#7BED9F', '#FFA502', '#FF6B6B', '#FF4757'],
        },
        formatter: (value: number) => value.toFixed(2),
      },
      series: [
        {
          name: '能效热力图',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data,
          symbolSize: (val: number[]) => {
            const size = Math.sqrt(val[4]) * 8 + 10;
            return Math.min(30, Math.max(12, size));
          },
          showEffectOn: 'render',
          rippleEffect: {
            brushType: 'stroke',
            scale: 3,
            period: 4,
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{b}',
            color: '#F0F4F8',
            fontSize: 11,
            fontWeight: 500,
            textBorderColor: '#0A1628',
            textBorderWidth: 2,
          },
          itemStyle: {
            color: (params: any) => getPUEColor(params.value[2]),
            shadowBlur: 15,
            shadowColor: (params: any) => getPUEColor(params.value[2]),
          },
          emphasis: {
            scale: 1.2,
          },
        },
      ],
    };
  }, [displayCities, chartTheme, getPUEColor]);

  const handleClick = (params: any) => {
    if (onCityClick && params.name) {
      const city = displayCities.find(c => c.name === params.name);
      if (city) {
        onCityClick(city);
      }
    }
  };

  const onEvents = {
    click: handleClick,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      onEvents={onEvents}
    />
  );
}

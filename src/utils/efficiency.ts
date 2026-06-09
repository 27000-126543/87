import { TelemetryData, EfficiencyMetrics, EnergySavingRecommendation, TrendPoint } from '@/types';
import { CARBON_FACTOR, DEFAULT_THRESHOLDS } from './constants';

export const calculatePUE = (totalPower: number, itPower: number): number => {
  if (itPower <= 0) return 0;
  return totalPower / itPower;
};

export const calculateRackUtilization = (
  currentPower: number,
  ratedPower: number
): number => {
  if (ratedPower <= 0) return 0;
  return Math.min(100, (currentPower / ratedPower) * 100);
};

export const calculateTemperatureUniformity = (
  temperatures: number[]
): number => {
  if (temperatures.length < 2) return 100;
  
  const mean = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
  const variance = temperatures.reduce((sum, temp) => {
    const diff = temp - mean;
    return sum + diff * diff;
  }, 0) / temperatures.length;
  const stdDev = Math.sqrt(variance);
  
  const maxTemp = Math.max(...temperatures);
  const minTemp = Math.min(...temperatures);
  const range = maxTemp - minTemp;
  
  if (range === 0) return 100;
  
  const uniformity = Math.max(0, 100 - (stdDev / range) * 100);
  return Math.min(100, uniformity);
};

export const calculateCarbonEmission = (energyKWh: number): number => {
  return energyKWh * CARBON_FACTOR;
};

export const calculateEnergyCost = (energyKWh: number, rate: number = 0.85): number => {
  return energyKWh * rate;
};

export const aggregateMetrics = (
  data: TelemetryData[],
  period: 'hour' | 'day' | 'week' = 'hour'
): EfficiencyMetrics[] => {
  const grouped = new Map<string, TelemetryData[]>();
  
  data.forEach((item) => {
    let key: string;
    const date = new Date(item.timestamp);
    
    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
        break;
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });
  
  const result: EfficiencyMetrics[] = [];
  
  grouped.forEach((items, key) => {
    const avgServerLoad = items.reduce((sum, i) => sum + i.serverLoad, 0) / items.length;
    const avgCoolingPower = items.reduce((sum, i) => sum + i.coolingPower, 0) / items.length;
    const avgTemperature = items.reduce((sum, i) => sum + i.temperature, 0) / items.length;
    const avgPUE = items.reduce((sum, i) => sum + i.pue, 0) / items.length;
    const totalPower = items.reduce((sum, i) => sum + i.powerUsage, 0);
    const itPower = totalPower * (avgServerLoad / 100) * 0.7;
    const coolingPower = totalPower * 0.25;
    
    const temperatures = items.map(i => i.temperature);
    const uniformity = calculateTemperatureUniformity(temperatures);
    
    const timestamp = new Date(key.replace(/-/g, '/')).getTime();
    
    result.push({
      timestamp,
      dataCenterId: items[0].dataCenterId,
      pue: avgPUE,
      rackUtilization: avgServerLoad,
      temperatureUniformity: uniformity,
      totalPower,
      itPower,
      coolingPower: avgCoolingPower,
      carbonEmission: calculateCarbonEmission(totalPower / 1000),
    });
  });
  
  return result.sort((a, b) => a.timestamp - b.timestamp);
};

export const predictEnergyConsumption = (
  historicalData: TrendPoint[],
  days: number,
  growthRate: number = 0.05
): TrendPoint[] => {
  const predictions: TrendPoint[] = [];
  
  if (historicalData.length === 0) return predictions;
  
  const recentData = historicalData.slice(-30);
  const avgDailyEnergy = recentData.reduce((sum, d) => sum + d.value, 0) / recentData.length;
  
  const lastTimestamp = historicalData[historicalData.length - 1].timestamp;
  const dayMs = 24 * 60 * 60 * 1000;
  
  for (let i = 1; i <= days; i++) {
    const dayFactor = 1 + (Math.random() - 0.5) * 0.1;
    const growthFactor = 1 + (i / days) * growthRate;
    
    predictions.push({
      timestamp: lastTimestamp + i * dayMs,
      value: avgDailyEnergy * dayFactor * growthFactor,
    });
  }
  
  return predictions;
};

export const predictCarbonEmission = (
  energyPredictions: TrendPoint[]
): TrendPoint[] => {
  return energyPredictions.map(p => ({
    timestamp: p.timestamp,
    value: calculateCarbonEmission(p.value),
  }));
};

export const generateEnergySavingRecommendations = (
  currentMetrics: EfficiencyMetrics,
  historicalData: EfficiencyMetrics[]
): EnergySavingRecommendation[] => {
  const recommendations: EnergySavingRecommendation[] = [];
  
  const avgPUE = historicalData.reduce((sum, d) => sum + d.pue, 0) / historicalData.length;
  const avgUtilization = historicalData.reduce((sum, d) => sum + d.rackUtilization, 0) / historicalData.length;
  
  if (avgUtilization < 50) {
    const savingPotential = (50 - avgUtilization) * 0.005 * currentMetrics.totalPower * 24 * 30;
    recommendations.push({
      id: 'rec-1',
      type: 'SERVER_SHUTDOWN',
      description: `当前机柜平均利用率仅 ${avgUtilization.toFixed(1)}%，建议关闭约 ${Math.round((50 - avgUtilization) / 10)}% 的空闲服务器`,
      estimatedEnergySaving: savingPotential,
      estimatedCarbonSaving: calculateCarbonEmission(savingPotential),
      priority: 'HIGH',
    });
  }
  
  if (currentMetrics.pue > DEFAULT_THRESHOLDS.pueWarning) {
    const savingPotential = (currentMetrics.pue - 1.35) * currentMetrics.itPower * 24 * 30;
    recommendations.push({
      id: 'rec-2',
      type: 'AC_TEMPERATURE_ADJUST',
      description: `当前PUE ${currentMetrics.pue.toFixed(3)} 偏高，建议将空调设定温度提高2-3°C`,
      estimatedEnergySaving: savingPotential * 0.15,
      estimatedCarbonSaving: calculateCarbonEmission(savingPotential * 0.15),
      priority: 'HIGH',
    });
  }
  
  if (currentMetrics.temperatureUniformity < 85) {
    recommendations.push({
      id: 'rec-3',
      type: 'LOAD_BALANCING',
      description: `冷通道温度均匀性指数 ${currentMetrics.temperatureUniformity.toFixed(1)}% 偏低，建议优化机柜负载分布`,
      estimatedEnergySaving: currentMetrics.coolingPower * 24 * 30 * 0.1,
      estimatedCarbonSaving: calculateCarbonEmission(currentMetrics.coolingPower * 24 * 30 * 0.1),
      priority: 'MEDIUM',
    });
  }
  
  if (currentMetrics.coolingPower / currentMetrics.totalPower > 0.3) {
    recommendations.push({
      id: 'rec-4',
      type: 'COOLING_OPTIMIZATION',
      description: '冷却系统占比过高，建议检查气流组织和冷却设备运行状态',
      estimatedEnergySaving: currentMetrics.coolingPower * 24 * 30 * 0.08,
      estimatedCarbonSaving: calculateCarbonEmission(currentMetrics.coolingPower * 24 * 30 * 0.08),
      priority: 'LOW',
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

export const calculatePUETrend = (
  current: number,
  previous: number
): { value: number; direction: 'up' | 'down' | 'stable' } => {
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    direction: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable',
  };
};

export const getPUEStatus = (pue: number): 'excellent' | 'good' | 'warning' | 'critical' => {
  if (pue < 1.3) return 'excellent';
  if (pue < 1.4) return 'good';
  if (pue < 1.5) return 'warning';
  return 'critical';
};

export const calculateBoxPlotStats = (data: number[]): {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
} => {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  
  const q1Index = Math.floor(n * 0.25);
  const medianIndex = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);
  
  const q1 = sorted[q1Index];
  const median = sorted[medianIndex];
  const q3 = sorted[q3Index];
  
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const min = Math.min(...sorted.filter(d => d >= lowerBound));
  const max = Math.max(...sorted.filter(d => d <= upperBound));
  const outliers = sorted.filter(d => d < lowerBound || d > upperBound);
  
  return { min, q1, median, q3, max, outliers };
};

export const detectAnomalies = (
  data: number[],
  threshold: number = 2
): number[] => {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const stdDev = Math.sqrt(
    data.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / data.length
  );
  
  return data.filter(d => Math.abs(d - mean) > threshold * stdDev);
};

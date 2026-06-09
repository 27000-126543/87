import { TelemetryData, EfficiencyMetrics, TrendPoint } from '@/types';
import { mockDataCenters } from './dataCenters';
import { aggregateMetrics } from '@/utils/efficiency';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const generateHistoricalTelemetry = (
  dataCenterId: string,
  days: number = 7
): TelemetryData[] => {
  const data: TelemetryData[] = [];
  const now = Date.now();
  const interval = 5 * 60 * 1000;
  const points = (days * DAY_MS) / interval;
  
  const dc = mockDataCenters.find(d => d.id === dataCenterId);
  const basePUE = dc?.designPUE || 1.35;
  const basePower = dc?.totalPower || 20000;
  
  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * interval;
    const hour = new Date(timestamp).getHours();
    
    const dailyFactor = hour >= 8 && hour <= 22 ? 1.1 : 0.85;
    const randomFactor = 0.95 + Math.random() * 0.1;
    
    const serverLoad = (40 + Math.random() * 40) * dailyFactor * randomFactor;
    const coolingPower = basePower * 0.25 * (0.8 + Math.random() * 0.4);
    const temperature = 23 + Math.sin(hour / 24 * Math.PI * 2) * 3 + Math.random() * 2;
    const humidity = 40 + Math.random() * 20;
    const pue = basePUE + (Math.random() - 0.3) * 0.2;
    const powerUsage = basePower * 0.5 * dailyFactor * randomFactor;
    
    data.push({
      timestamp,
      dataCenterId,
      serverLoad,
      coolingPower,
      temperature,
      humidity,
      pue: Math.max(1.1, Math.min(2.0, pue)),
      powerUsage,
    });
  }
  
  return data;
};

export const generateRackTelemetry = (
  dataCenterId: string,
  rackId: string,
  days: number = 7
): TelemetryData[] => {
  const data: TelemetryData[] = [];
  const now = Date.now();
  const interval = 15 * 60 * 1000;
  const points = (days * DAY_MS) / interval;
  
  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * interval;
    const hour = new Date(timestamp).getHours();
    
    const dailyFactor = hour >= 8 && hour <= 22 ? 1.15 : 0.75;
    const randomFactor = 0.9 + Math.random() * 0.2;
    
    data.push({
      timestamp,
      dataCenterId,
      rackId,
      serverLoad: (35 + Math.random() * 50) * dailyFactor * randomFactor,
      coolingPower: 1500 + Math.random() * 500,
      temperature: 24 + Math.sin(hour / 24 * Math.PI * 2) * 4 + Math.random() * 3,
      humidity: 40 + Math.random() * 20,
      pue: 1.3 + Math.random() * 0.2,
      powerUsage: 4000 + Math.random() * 2000,
    });
  }
  
  return data;
};

export const getCurrentMetrics = (dataCenterId: string): EfficiencyMetrics => {
  const telemetry = generateHistoricalTelemetry(dataCenterId, 1);
  const aggregated = aggregateMetrics(telemetry, 'hour');
  return aggregated[aggregated.length - 1] || {
    timestamp: Date.now(),
    dataCenterId,
    pue: 1.35,
    rackUtilization: 65,
    temperatureUniformity: 88,
    totalPower: 20000,
    itPower: 14000,
    coolingPower: 5000,
    carbonEmission: 500,
  };
};

export const generateEnergyTrend = (
  dataCenterId: string,
  days: number = 30
): TrendPoint[] => {
  const data: TrendPoint[] = [];
  const now = Date.now();
  const dc = mockDataCenters.find(d => d.id === dataCenterId);
  const baseEnergy = (dc?.totalPower || 20000) * 24 * 0.8;
  
  for (let i = days; i > 0; i--) {
    const timestamp = now - i * DAY_MS;
    const dayOfWeek = new Date(timestamp).getDay();
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.9 : 1.0;
    const seasonFactor = 1 + Math.sin((i / 365) * Math.PI * 2) * 0.15;
    const randomFactor = 0.9 + Math.random() * 0.2;
    
    data.push({
      timestamp,
      value: baseEnergy * weekendFactor * seasonFactor * randomFactor,
    });
  }
  
  return data;
};

export const generateCarbonTrend = (
  energyTrend: TrendPoint[]
): TrendPoint[] => {
  return energyTrend.map(t => ({
    timestamp: t.timestamp,
    value: t.value * 0.5839,
  }));
};

export const generateRealtimeUpdate = (
  dataCenterId: string,
  previousData?: TelemetryData
): TelemetryData => {
  const now = Date.now();
  const dc = mockDataCenters.find(d => d.id === dataCenterId);
  const basePUE = dc?.designPUE || 1.35;
  const basePower = dc?.totalPower || 20000;
  
  const previousLoad = previousData?.serverLoad || 60;
  const newLoad = Math.max(30, Math.min(95, previousLoad + (Math.random() - 0.5) * 5));
  
  const hour = new Date(now).getHours();
  const dailyFactor = hour >= 8 && hour <= 22 ? 1.1 : 0.85;
  
  return {
    timestamp: now,
    dataCenterId,
    serverLoad: newLoad,
    coolingPower: basePower * 0.25 * (0.9 + Math.random() * 0.2),
    temperature: 24 + Math.sin(hour / 24 * Math.PI * 2) * 3 + Math.random() * 2,
    humidity: 40 + Math.random() * 20,
    pue: Math.max(1.1, Math.min(2.0, basePUE + (Math.random() - 0.3) * 0.15)),
    powerUsage: basePower * 0.5 * dailyFactor * (0.95 + Math.random() * 0.1),
  };
};

export const mockTelemetryByDataCenter: Record<string, TelemetryData[]> = {};
mockDataCenters.forEach(dc => {
  mockTelemetryByDataCenter[dc.id] = generateHistoricalTelemetry(dc.id, 7);
});

export const mockAggregatedMetrics: Record<string, EfficiencyMetrics[]> = {};
mockDataCenters.forEach(dc => {
  mockAggregatedMetrics[dc.id] = aggregateMetrics(mockTelemetryByDataCenter[dc.id], 'hour');
});

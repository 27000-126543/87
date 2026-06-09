import { create } from 'zustand';
import { TelemetryData, EfficiencyMetrics } from '@/types';
import { generateRealtimeUpdate } from '@/mock/telemetry';
import { aggregateMetrics } from '@/utils/efficiency';

interface RealtimeState {
  isConnected: boolean;
  telemetryData: Record<string, TelemetryData[]>;
  latestData: Record<string, TelemetryData>;
  metrics: Record<string, EfficiencyMetrics>;
  updateInterval: number | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (dataCenterId: string) => void;
  unsubscribe: (dataCenterId: string) => void;
  getLatestData: (dataCenterId: string) => TelemetryData | null;
  getMetrics: (dataCenterId: string) => EfficiencyMetrics | null;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  isConnected: false,
  telemetryData: {},
  latestData: {},
  metrics: {},
  updateInterval: null,

  connect: () => {
    if (get().isConnected) return;
    
    const interval = window.setInterval(() => {
      const { latestData, telemetryData } = get();
      const newLatest: Record<string, TelemetryData> = {};
      const newTelemetry: Record<string, TelemetryData[]> = {};
      const newMetrics: Record<string, EfficiencyMetrics> = {};
      
      Object.keys(latestData).forEach(dataCenterId => {
        const previous = latestData[dataCenterId];
        const update = generateRealtimeUpdate(dataCenterId, previous);
        
        newLatest[dataCenterId] = update;
        
        const existingData = telemetryData[dataCenterId] || [];
        const updatedData = [...existingData, update].slice(-200);
        newTelemetry[dataCenterId] = updatedData;
        
        const aggregated = aggregateMetrics(updatedData.slice(-12), 'hour');
        if (aggregated.length > 0) {
          newMetrics[dataCenterId] = aggregated[aggregated.length - 1];
        }
      });
      
      set(state => ({
        latestData: { ...state.latestData, ...newLatest },
        telemetryData: { ...state.telemetryData, ...newTelemetry },
        metrics: { ...state.metrics, ...newMetrics },
      }));
    }, 3000);
    
    set({ isConnected: true, updateInterval: interval });
  },

  disconnect: () => {
    const { updateInterval } = get();
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    set({ isConnected: false, updateInterval: null });
  },

  subscribe: (dataCenterId) => {
    const { latestData } = get();
    if (!latestData[dataCenterId]) {
      const initialData = generateRealtimeUpdate(dataCenterId);
      set(state => ({
        latestData: { ...state.latestData, [dataCenterId]: initialData },
        telemetryData: { ...state.telemetryData, [dataCenterId]: [initialData] },
      }));
    }
  },

  unsubscribe: (dataCenterId) => {
    set(state => {
      const newLatest = { ...state.latestData };
      const newTelemetry = { ...state.telemetryData };
      const newMetrics = { ...state.metrics };
      
      delete newLatest[dataCenterId];
      delete newTelemetry[dataCenterId];
      delete newMetrics[dataCenterId];
      
      return {
        latestData: newLatest,
        telemetryData: newTelemetry,
        metrics: newMetrics,
      };
    });
  },

  getLatestData: (dataCenterId) => {
    return get().latestData[dataCenterId] || null;
  },

  getMetrics: (dataCenterId) => {
    return get().metrics[dataCenterId] || null;
  },
}));

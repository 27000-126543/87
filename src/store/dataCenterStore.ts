import { create } from 'zustand';
import { DataCenter, Rack, CityData, EfficiencyMetrics, TelemetryData, TrendPoint, TimeRange } from '@/types';
import { mockDataCenters, mockCities, mockRacksByDataCenter } from '@/mock/dataCenters';
import { 
  mockAggregatedMetrics, 
  getCurrentMetrics, 
  generateEnergyTrend, 
  generateCarbonTrend,
  generateRackTelemetry,
} from '@/mock/telemetry';

interface DataCenterState {
  dataCenters: DataCenter[];
  cities: CityData[];
  racks: Record<string, Rack[]>;
  metrics: Record<string, EfficiencyMetrics[]>;
  currentMetrics: Record<string, EfficiencyMetrics>;
  rackTelemetry: Record<string, TelemetryData[]>;
  energyTrends: Record<string, TrendPoint[]>;
  carbonTrends: Record<string, TrendPoint[]>;
  selectedDataCenter: DataCenter | null;
  selectedCity: CityData | null;
  timeRange: TimeRange;
  loading: boolean;
  fetchDataCenters: () => Promise<void>;
  fetchDataCenterById: (id: string) => DataCenter | undefined;
  fetchRacks: (dataCenterId: string) => Promise<Rack[]>;
  fetchMetrics: (dataCenterId: string, timeRange: TimeRange) => Promise<EfficiencyMetrics[]>;
  fetchCurrentMetrics: (dataCenterId: string) => EfficiencyMetrics;
  fetchRackTelemetry: (dataCenterId: string, rackId: string) => Promise<TelemetryData[]>;
  fetchEnergyTrend: (dataCenterId: string, days?: number) => Promise<TrendPoint[]>;
  fetchCarbonTrend: (dataCenterId: string, days?: number) => Promise<TrendPoint[]>;
  selectDataCenter: (dataCenter: DataCenter | null) => void;
  selectCity: (city: CityData | null) => void;
  setTimeRange: (timeRange: TimeRange) => void;
  getNationalStats: () => {
    totalDataCenters: number;
    totalRacks: number;
    avgPUE: number;
    totalCarbon: number;
    totalPower: number;
  };
}

export const useDataCenterStore = create<DataCenterState>((set, get) => ({
  dataCenters: [],
  cities: [],
  racks: {},
  metrics: {},
  currentMetrics: {},
  rackTelemetry: {},
  energyTrends: {},
  carbonTrends: {},
  selectedDataCenter: null,
  selectedCity: null,
  timeRange: '24h',
  loading: false,

  fetchDataCenters: async () => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 300));
    set({ 
      dataCenters: mockDataCenters, 
      cities: mockCities,
      loading: false,
    });
  },

  fetchDataCenterById: (id) => {
    const { dataCenters } = get();
    return dataCenters.find(dc => dc.id === id);
  },

  fetchRacks: async (dataCenterId) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    const racks = mockRacksByDataCenter[dataCenterId] || [];
    set(state => ({
      racks: { ...state.racks, [dataCenterId]: racks },
      loading: false,
    }));
    return racks;
  },

  fetchMetrics: async (dataCenterId, timeRange) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    const metrics = mockAggregatedMetrics[dataCenterId] || [];
    set(state => ({
      metrics: { ...state.metrics, [dataCenterId]: metrics },
      loading: false,
    }));
    return metrics;
  },

  fetchCurrentMetrics: (dataCenterId) => {
    const metrics = getCurrentMetrics(dataCenterId);
    set(state => ({
      currentMetrics: { ...state.currentMetrics, [dataCenterId]: metrics },
    }));
    return metrics;
  },

  fetchRackTelemetry: async (dataCenterId, rackId) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    const telemetry = generateRackTelemetry(dataCenterId, rackId, 7);
    const key = `${dataCenterId}-${rackId}`;
    set(state => ({
      rackTelemetry: { ...state.rackTelemetry, [key]: telemetry },
      loading: false,
    }));
    return telemetry;
  },

  fetchEnergyTrend: async (dataCenterId, days = 30) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    const trend = generateEnergyTrend(dataCenterId, days);
    set(state => ({
      energyTrends: { ...state.energyTrends, [dataCenterId]: trend },
      loading: false,
    }));
    return trend;
  },

  fetchCarbonTrend: async (dataCenterId, days = 30) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    const energyTrend = get().energyTrends[dataCenterId] || await get().fetchEnergyTrend(dataCenterId, days);
    const trend = generateCarbonTrend(energyTrend);
    set(state => ({
      carbonTrends: { ...state.carbonTrends, [dataCenterId]: trend },
      loading: false,
    }));
    return trend;
  },

  selectDataCenter: (dataCenter) => {
    set({ selectedDataCenter: dataCenter });
  },

  selectCity: (city) => {
    set({ selectedCity: city });
  },

  setTimeRange: (timeRange) => {
    set({ timeRange });
  },

  getNationalStats: () => {
    const { dataCenters, currentMetrics } = get();
    const onlineDCs = dataCenters.filter(dc => dc.status === 'online');
    
    const totalRacks = onlineDCs.reduce((sum, dc) => sum + dc.totalRacks, 0);
    const totalPower = onlineDCs.reduce((sum, dc) => sum + dc.totalPower, 0);
    
    let totalPUE = 0;
    let totalCarbon = 0;
    onlineDCs.forEach(dc => {
      const metrics = currentMetrics[dc.id];
      if (metrics) {
        totalPUE += metrics.pue;
        totalCarbon += metrics.carbonEmission;
      }
    });
    
    const avgPUE = onlineDCs.length > 0 ? totalPUE / onlineDCs.length : 0;
    
    return {
      totalDataCenters: onlineDCs.length,
      totalRacks,
      avgPUE,
      totalCarbon,
      totalPower,
    };
  },
}));

import { create } from 'zustand';
import { HealthReport, ExpansionPlan, EnergySavingRecommendation, TrendPoint } from '@/types';
import { mockHealthReports, getReportsByDataCenter, getReportById, generateNewReport } from '@/mock/healthReports';
import { predictEnergyConsumption, predictCarbonEmission, generateEnergySavingRecommendations } from '@/utils/efficiency';
import { mockDataCenters } from '@/mock/dataCenters';
import { getCurrentMetrics, mockAggregatedMetrics } from '@/mock/telemetry';

interface ReportState {
  reports: HealthReport[];
  expansionPlans: ExpansionPlan[];
  loading: boolean;
  selectedReport: HealthReport | null;
  selectedExpansionPlan: ExpansionPlan | null;
  fetchReports: (dataCenterId?: string) => Promise<void>;
  fetchReportById: (id: string) => HealthReport | undefined;
  generateReport: (dataCenterId: string) => Promise<HealthReport>;
  createExpansionPlan: (
    dataCenterId: string,
    newRacks: number,
    newPower: number
  ) => Promise<ExpansionPlan>;
  fetchExpansionPlans: (dataCenterId?: string) => Promise<ExpansionPlan[]>;
  selectReport: (report: HealthReport | null) => void;
  selectExpansionPlan: (plan: ExpansionPlan | null) => void;
  exportReport: (reportId: string) => Promise<void>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  expansionPlans: [],
  loading: false,
  selectedReport: null,
  selectedExpansionPlan: null,

  fetchReports: async (dataCenterId) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 300));
    let reports = mockHealthReports;
    if (dataCenterId) {
      reports = reports.filter(r => r.dataCenterId === dataCenterId);
    }
    set({ reports, loading: false });
  },

  fetchReportById: (id) => {
    return get().reports.find(r => r.id === id) || getReportById(id);
  },

  generateReport: async (dataCenterId) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newReport = generateNewReport(dataCenterId);
    set(state => ({
      reports: [newReport, ...state.reports],
      loading: false,
    }));
    return newReport;
  },

  createExpansionPlan: async (dataCenterId, newRacks, newPower) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const historicalMetrics = mockAggregatedMetrics[dataCenterId] || [];
    const currentMetrics = getCurrentMetrics(dataCenterId);
    
    const energyTrend: TrendPoint[] = historicalMetrics.map(m => ({
      timestamp: m.timestamp,
      value: m.totalPower / 1000 * 24,
    }));
    
    const predictedEnergy = predictEnergyConsumption(energyTrend, 90, 0.1);
    const predictedCarbon = predictCarbonEmission(predictedEnergy);
    
    const totalEnergy90d = predictedEnergy.reduce((sum, p) => sum + p.value, 0);
    const totalCarbon90d = predictedCarbon.reduce((sum, p) => sum + p.value, 0);
    
    const additionalEnergy = (newPower / 1000) * 24 * 90 * 0.8;
    const additionalCarbon = additionalEnergy * 0.5839;
    
    const totalPredictedEnergy = totalEnergy90d + additionalEnergy;
    const totalPredictedCarbon = totalCarbon90d + additionalCarbon;
    
    const monthlyQuota = 500000;
    const quotaExceeded = totalPredictedEnergy > monthlyQuota * 3;
    
    const recommendations = generateEnergySavingRecommendations(currentMetrics, historicalMetrics);
    
    const plan: ExpansionPlan = {
      id: `plan-${Date.now()}`,
      dataCenterId,
      uploadTime: Date.now(),
      newRacks,
      newPower,
      predictedEnergy90d: totalPredictedEnergy,
      predictedCarbon90d: totalPredictedCarbon,
      quotaExceeded,
      recommendations,
    };
    
    set(state => ({
      expansionPlans: [...state.expansionPlans, plan],
      loading: false,
    }));
    
    return plan;
  },

  fetchExpansionPlans: async (dataCenterId) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    let plans = get().expansionPlans;
    if (dataCenterId) {
      plans = plans.filter(p => p.dataCenterId === dataCenterId);
    }
    set({ loading: false });
    return plans;
  },

  selectReport: (report) => {
    set({ selectedReport: report });
  },

  selectExpansionPlan: (plan) => {
    set({ selectedExpansionPlan: plan });
  },

  exportReport: async (reportId) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    set({ loading: false });
    console.log('Exporting report:', reportId);
  },
}));

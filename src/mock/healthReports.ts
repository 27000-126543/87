import { HealthReport, TrendPoint, MaintenanceTask } from '@/types';
import { mockDataCenters } from './dataCenters';

const DAY_MS = 24 * 60 * 60 * 1000;

const generateEnergyCostTrend = (dataCenterId: string): TrendPoint[] => {
  const data: TrendPoint[] = [];
  const now = Date.now();
  const dc = mockDataCenters.find(d => d.id === dataCenterId);
  const baseCost = (dc?.totalPower || 20000) * 24 * 0.85;
  
  for (let i = 7; i > 0; i--) {
    data.push({
      timestamp: now - i * DAY_MS,
      value: baseCost * (0.9 + Math.random() * 0.2),
    });
  }
  
  return data;
};

const generateMaintenanceTasks = (): MaintenanceTask[] => {
  const tasks: MaintenanceTask[] = [
    {
      id: 'task-001',
      description: 'A区精密空调滤芯更换',
      scheduledDate: Date.now() + 3 * DAY_MS,
      priority: 'HIGH',
      status: 'PENDING',
    },
    {
      id: 'task-002',
      description: 'B列UPS电池组检测',
      scheduledDate: Date.now() + 5 * DAY_MS,
      priority: 'MEDIUM',
      status: 'PENDING',
    },
    {
      id: 'task-003',
      description: '机柜温度传感器校准',
      scheduledDate: Date.now() + 7 * DAY_MS,
      priority: 'LOW',
      status: 'PENDING',
    },
    {
      id: 'task-004',
      description: '消防系统季度检测',
      scheduledDate: Date.now() + 10 * DAY_MS,
      priority: 'HIGH',
      status: 'PENDING',
    },
  ];
  return tasks;
};

export const mockHealthReports: HealthReport[] = mockDataCenters.flatMap((dc, dcIndex) => {
  const reports: HealthReport[] = [];
  const now = Date.now();
  const currentWeek = Math.ceil((now - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * DAY_MS));
  
  for (let i = 0; i < 4; i++) {
    const weekNumber = Math.floor(currentWeek) - i;
    const basePUE = dc.designPUE + 0.02 * dcIndex + Math.random() * 0.08;
    
    reports.push({
      id: `report-${dc.id}-${weekNumber}`,
      weekNumber,
      year: new Date().getFullYear(),
      dataCenterId: dc.id,
      generatedAt: now - i * 7 * DAY_MS,
      avgPUE: basePUE,
      pueYoY: -2.5 + Math.random() * 3,
      pueMoM: -1.2 + Math.random() * 2,
      avgFaultResolutionTime: 45 + Math.random() * 60,
      energyCostTrend: generateEnergyCostTrend(dc.id),
      optimizationSuggestions: [
        '建议优化冷却系统运行策略，预计可降低PUE约0.03-0.05',
        '部分机柜负载率偏低，建议整合业务提高资源利用率',
        '检查空调滤网更换周期，建议从3个月调整为2个月',
        '考虑采用自然冷却技术，在秋冬季节可显著降低能耗',
      ],
      maintenancePlan: generateMaintenanceTasks(),
    });
  }
  
  return reports;
});

export const getReportsByDataCenter = (dataCenterId: string): HealthReport[] => {
  return mockHealthReports
    .filter(r => r.dataCenterId === dataCenterId)
    .sort((a, b) => b.generatedAt - a.generatedAt);
};

export const getLatestReport = (dataCenterId: string): HealthReport | undefined => {
  const reports = getReportsByDataCenter(dataCenterId);
  return reports[0];
};

export const getReportById = (id: string): HealthReport | undefined => {
  return mockHealthReports.find(r => r.id === id);
};

export const generateNewReport = (dataCenterId: string): HealthReport => {
  const dc = mockDataCenters.find(d => d.id === dataCenterId);
  const now = Date.now();
  const currentWeek = Math.ceil((now - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * DAY_MS));
  
  return {
    id: `report-${dataCenterId}-${Date.now()}`,
    weekNumber: Math.floor(currentWeek),
    year: new Date().getFullYear(),
    dataCenterId,
    generatedAt: now,
    avgPUE: dc?.designPUE || 1.35,
    pueYoY: -2.5 + Math.random() * 3,
    pueMoM: -1.2 + Math.random() * 2,
    avgFaultResolutionTime: 45 + Math.random() * 60,
    energyCostTrend: generateEnergyCostTrend(dataCenterId),
    optimizationSuggestions: [
      '建议优化冷却系统运行策略',
      '部分机柜负载率偏低，建议整合业务',
      '定期检查空调运行状态',
    ],
    maintenancePlan: generateMaintenanceTasks(),
  };
};

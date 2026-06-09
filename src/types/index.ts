export interface DataCenter {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  totalRacks: number;
  totalPower: number;
  designPUE: number;
  coordinates: { lat: number; lng: number };
  status: 'online' | 'offline' | 'maintenance';
}

export interface Rack {
  id: string;
  dataCenterId: string;
  name: string;
  row: string;
  position: number;
  ratedPower: number;
  servers: number;
  maxTemp: number;
  minTemp: number;
  utilization: number;
}

export interface TelemetryData {
  timestamp: number;
  dataCenterId: string;
  rackId?: string;
  serverLoad: number;
  coolingPower: number;
  temperature: number;
  humidity: number;
  pue: number;
  powerUsage: number;
}

export interface EfficiencyMetrics {
  timestamp: number;
  dataCenterId: string;
  pue: number;
  rackUtilization: number;
  temperatureUniformity: number;
  totalPower: number;
  itPower: number;
  coolingPower: number;
  carbonEmission: number;
}

export type AlertType = 'PUE_EXCEEDED' | 'TEMPERATURE_HIGH' | 'HUMIDITY_ABNORMAL' | 'POWER_OVERLOAD';
export type AlertLevel = 1 | 2;
export type AlertStatus = 'PENDING' | 'ACKNOWLEDGED' | 'PROCESSING' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  status: AlertStatus;
  dataCenterId: string;
  rackId?: string;
  threshold: number;
  currentValue: number;
  startTime: number;
  escalationTime?: number;
  assignee?: string;
  approvalFlow?: ApprovalStep[];
  resolution?: string;
  resolutionTime?: number;
}

export type ApprovalRole = 'ENGINEER' | 'MANAGER' | 'CTO';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalStep {
  id: string;
  level: 1 | 2 | 3;
  role: ApprovalRole;
  userId: string;
  status: ApprovalStatus;
  comment: string;
  timestamp?: number;
}

export interface EnergySavingRecommendation {
  id: string;
  type: 'SERVER_SHUTDOWN' | 'AC_TEMPERATURE_ADJUST' | 'LOAD_BALANCING' | 'COOLING_OPTIMIZATION';
  description: string;
  estimatedEnergySaving: number;
  estimatedCarbonSaving: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ExpansionPlan {
  id: string;
  dataCenterId: string;
  uploadTime: number;
  newRacks: number;
  newPower: number;
  predictedEnergy90d: number;
  predictedCarbon90d: number;
  quotaExceeded: boolean;
  recommendations: EnergySavingRecommendation[];
}

export interface TrendPoint {
  timestamp: number;
  value: number;
}

export interface MaintenanceTask {
  id: string;
  description: string;
  scheduledDate: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface HealthReport {
  id: string;
  weekNumber: number;
  year: number;
  dataCenterId: string;
  generatedAt: number;
  avgPUE: number;
  pueYoY: number;
  pueMoM: number;
  avgFaultResolutionTime: number;
  energyCostTrend: TrendPoint[];
  optimizationSuggestions: string[];
  maintenancePlan: MaintenanceTask[];
}

export type UserRole = 'GROUP_ADMIN' | 'REGION_MANAGER' | 'DC_MANAGER' | 'ENGINEER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  region?: string;
  dataCenterIds?: string[];
  email: string;
  phone: string;
  avatar?: string;
}

export interface CityData {
  id: string;
  name: string;
  region: string;
  dataCenterCount: number;
  avgPUE: number;
  totalCarbon: number;
  coordinates: { lat: number; lng: number };
}

export interface ThresholdConfig {
  pueWarning: number;
  pueCritical: number;
  temperatureWarning: number;
  temperatureCritical: number;
  humidityMin: number;
  humidityMax: number;
  powerLoadWarning: number;
  powerLoadCritical: number;
}

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | '90d';

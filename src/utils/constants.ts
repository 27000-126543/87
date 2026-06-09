import { ThresholdConfig, UserRole } from '@/types';

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  pueWarning: 1.4,
  pueCritical: 1.5,
  temperatureWarning: 28,
  temperatureCritical: 32,
  humidityMin: 30,
  humidityMax: 70,
  powerLoadWarning: 80,
  powerLoadCritical: 95,
};

export const REGIONS = [
  { value: 'north', label: '华北地区' },
  { value: 'east', label: '华东地区' },
  { value: 'south', label: '华南地区' },
  { value: 'west', label: '西部地区' },
  { value: 'central', label: '华中地区' },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  GROUP_ADMIN: '集团管理员',
  REGION_MANAGER: '区域经理',
  DC_MANAGER: '机房主管',
  ENGINEER: '运维工程师',
};

export const ALERT_TYPE_LABELS: Record<string, string> = {
  PUE_EXCEEDED: 'PUE超标',
  TEMPERATURE_HIGH: '温度过高',
  HUMIDITY_ABNORMAL: '湿度异常',
  POWER_OVERLOAD: '功率过载',
};

export const ALERT_STATUS_LABELS: Record<string, string> = {
  PENDING: '待处理',
  ACKNOWLEDGED: '已确认',
  PROCESSING: '处理中',
  ESCALATED: '已升级',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
};

export const ALERT_STATUS_COLORS: Record<string, string> = {
  PENDING: '#FFA502',
  ACKNOWLEDGED: '#00D4FF',
  PROCESSING: '#A55EEA',
  ESCALATED: '#FF6B6B',
  RESOLVED: '#2ED573',
  CLOSED: '#718096',
};

export const ALERT_LEVEL_LABELS: Record<number, string> = {
  1: '一级预警',
  2: '二级预警',
};

export const APPROVAL_ROLE_LABELS: Record<string, string> = {
  ENGINEER: '运维工程师',
  MANAGER: '数据中心经理',
  CTO: '集团CTO',
};

export const RECOMMENDATION_TYPE_LABELS: Record<string, string> = {
  SERVER_SHUTDOWN: '关闭空闲服务器',
  AC_TEMPERATURE_ADJUST: '调整空调设定温度',
  LOAD_BALANCING: '优化负载分布',
  COOLING_OPTIMIZATION: '优化冷却策略',
};

export const PRIORITY_LABELS: Record<string, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
};

export const TIME_RANGE_OPTIONS = [
  { value: '1h', label: '1小时' },
  { value: '6h', label: '6小时' },
  { value: '24h', label: '24小时' },
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
  { value: '90d', label: '90天' },
];

export const CARBON_FACTOR = 0.5839;

export const ENERGY_COST_RATE = 0.85;

export const PUE_COLOR_SCALE = [
  { value: 1.2, color: '#2ED573' },
  { value: 1.3, color: '#7BED9F' },
  { value: 1.4, color: '#FFA502' },
  { value: 1.5, color: '#FF6B6B' },
  { value: 2.0, color: '#FF4757' },
];

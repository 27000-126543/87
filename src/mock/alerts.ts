import { Alert, ApprovalStep } from '@/types';
import { mockDataCenters } from './dataCenters';

const HOUR_MS = 60 * 60 * 1000;

export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    type: 'PUE_EXCEEDED',
    level: 1,
    status: 'PENDING',
    dataCenterId: 'dc-004',
    threshold: 1.5,
    currentValue: 1.54,
    startTime: Date.now() - 25 * 60 * 1000,
    assignee: 'user-004',
  },
  {
    id: 'alert-002',
    type: 'TEMPERATURE_HIGH',
    level: 1,
    status: 'PROCESSING',
    dataCenterId: 'dc-001',
    rackId: 'dc-001-rack-012',
    threshold: 32,
    currentValue: 33.5,
    startTime: Date.now() - 50 * 60 * 1000,
    assignee: 'user-003',
  },
  {
    id: 'alert-003',
    type: 'PUE_EXCEEDED',
    level: 2,
    status: 'ESCALATED',
    dataCenterId: 'dc-004',
    threshold: 1.5,
    currentValue: 1.58,
    startTime: Date.now() - 2 * HOUR_MS,
    escalationTime: Date.now() - 1 * HOUR_MS,
    assignee: 'user-004',
    approvalFlow: [
      {
        id: 'appr-001',
        level: 1,
        role: 'ENGINEER',
        userId: 'user-004',
        status: 'APPROVED',
        comment: '确认PUE持续超标，已检查冷却系统运行正常，需要调整空调设定',
        timestamp: Date.now() - 58 * 60 * 1000,
      },
      {
        id: 'appr-002',
        level: 2,
        role: 'MANAGER',
        userId: 'user-002',
        status: 'PENDING',
        comment: '',
      },
      {
        id: 'appr-003',
        level: 3,
        role: 'CTO',
        userId: 'user-001',
        status: 'PENDING',
        comment: '',
      },
    ],
  },
  {
    id: 'alert-004',
    type: 'POWER_OVERLOAD',
    level: 2,
    status: 'ESCALATED',
    dataCenterId: 'dc-003',
    rackId: 'dc-003-rack-028',
    threshold: 95,
    currentValue: 98.2,
    startTime: Date.now() - 3 * HOUR_MS,
    escalationTime: Date.now() - 2 * HOUR_MS,
    assignee: 'user-005',
    approvalFlow: [
      {
        id: 'appr-004',
        level: 1,
        role: 'ENGINEER',
        userId: 'user-005',
        status: 'APPROVED',
        comment: '确认机柜负载过高，建议将部分业务迁移至其他机柜',
        timestamp: Date.now() - 115 * 60 * 1000,
      },
      {
        id: 'appr-005',
        level: 2,
        role: 'MANAGER',
        userId: 'user-003',
        status: 'APPROVED',
        comment: '同意负载迁移方案，已协调运维团队执行',
        timestamp: Date.now() - 90 * 60 * 1000,
      },
      {
        id: 'appr-006',
        level: 3,
        role: 'CTO',
        userId: 'user-001',
        status: 'PENDING',
        comment: '',
      },
    ],
  },
  {
    id: 'alert-005',
    type: 'HUMIDITY_ABNORMAL',
    level: 1,
    status: 'ACKNOWLEDGED',
    dataCenterId: 'dc-006',
    threshold: 30,
    currentValue: 27.8,
    startTime: Date.now() - 15 * 60 * 1000,
    assignee: 'user-006',
  },
  {
    id: 'alert-006',
    type: 'TEMPERATURE_HIGH',
    level: 1,
    status: 'RESOLVED',
    dataCenterId: 'dc-002',
    rackId: 'dc-002-rack-035',
    threshold: 32,
    currentValue: 34.1,
    startTime: Date.now() - 5 * HOUR_MS,
    assignee: 'user-007',
    resolution: '调整空调风量，清理机柜进风口，温度已恢复正常',
    resolutionTime: Date.now() - 2 * HOUR_MS,
  },
  {
    id: 'alert-007',
    type: 'PUE_EXCEEDED',
    level: 1,
    status: 'CLOSED',
    dataCenterId: 'dc-008',
    threshold: 1.5,
    currentValue: 1.52,
    startTime: Date.now() - 24 * HOUR_MS,
    assignee: 'user-008',
    resolution: '优化冷却策略，PUE已降至1.42',
    resolutionTime: Date.now() - 20 * HOUR_MS,
  },
  {
    id: 'alert-008',
    type: 'POWER_OVERLOAD',
    level: 1,
    status: 'PROCESSING',
    dataCenterId: 'dc-005',
    rackId: 'dc-005-rack-017',
    threshold: 95,
    currentValue: 96.5,
    startTime: Date.now() - 40 * 60 * 1000,
    assignee: 'user-009',
  },
];

export const generateApprovalSteps = (): ApprovalStep[] => [
  {
    id: `appr-${Date.now()}-1`,
    level: 1,
    role: 'ENGINEER',
    userId: '',
    status: 'PENDING',
    comment: '',
  },
  {
    id: `appr-${Date.now()}-2`,
    level: 2,
    role: 'MANAGER',
    userId: '',
    status: 'PENDING',
    comment: '',
  },
  {
    id: `appr-${Date.now()}-3`,
    level: 3,
    role: 'CTO',
    userId: '',
    status: 'PENDING',
    comment: '',
  },
];

export const getAlertsByDataCenter = (dataCenterId: string): Alert[] => {
  return mockAlerts.filter(a => a.dataCenterId === dataCenterId);
};

export const getActiveAlerts = (): Alert[] => {
  return mockAlerts.filter(a => 
    a.status === 'PENDING' || a.status === 'ACKNOWLEDGED' || 
    a.status === 'PROCESSING' || a.status === 'ESCALATED'
  );
};

export const getAlertsByLevel = (level: 1 | 2): Alert[] => {
  return mockAlerts.filter(a => a.level === level);
};

export const getAlertStats = () => {
  const active = getActiveAlerts();
  return {
    total: mockAlerts.length,
    active: active.length,
    level1: active.filter(a => a.level === 1).length,
    level2: active.filter(a => a.level === 2).length,
    pending: active.filter(a => a.status === 'PENDING').length,
    processing: active.filter(a => a.status === 'PROCESSING' || a.status === 'ACKNOWLEDGED').length,
    escalated: active.filter(a => a.status === 'ESCALATED').length,
    resolved: mockAlerts.filter(a => a.status === 'RESOLVED' || a.status === 'CLOSED').length,
  };
};

import { create } from 'zustand';
import { Alert, AlertStatus, ApprovalStatus } from '@/types';
import { mockAlerts, getAlertStats, generateApprovalSteps } from '@/mock/alerts';
import { mockUsers } from '@/mock/users';

interface AlertState {
  alerts: Alert[];
  loading: boolean;
  filterLevel: 1 | 2 | 'all';
  filterStatus: AlertStatus | 'all';
  selectedAlert: Alert | null;
  fetchAlerts: (dataCenterId?: string) => Promise<void>;
  fetchAlertById: (id: string) => Alert | undefined;
  updateAlertStatus: (id: string, status: AlertStatus, resolution?: string) => void;
  escalateAlert: (id: string) => void;
  approveStep: (alertId: string, stepId: string, status: ApprovalStatus, comment: string, userId: string) => void;
  assignAlert: (id: string, userId: string) => void;
  selectAlert: (alert: Alert | null) => void;
  setFilterLevel: (level: 1 | 2 | 'all') => void;
  setFilterStatus: (status: AlertStatus | 'all') => void;
  getFilteredAlerts: () => Alert[];
  getStats: () => ReturnType<typeof getAlertStats>;
  createAlert: (alert: Omit<Alert, 'id'>) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  loading: false,
  filterLevel: 'all',
  filterStatus: 'all',
  selectedAlert: null,

  fetchAlerts: async (dataCenterId) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 300));
    let alerts = mockAlerts;
    if (dataCenterId) {
      alerts = alerts.filter(a => a.dataCenterId === dataCenterId);
    }
    set({ alerts, loading: false });
  },

  fetchAlertById: (id) => {
    return get().alerts.find(a => a.id === id);
  },

  updateAlertStatus: (id, status, resolution) => {
    set(state => ({
      alerts: state.alerts.map(a => 
        a.id === id 
          ? { 
              ...a, 
              status, 
              resolution, 
              resolutionTime: status === 'RESOLVED' || status === 'CLOSED' ? Date.now() : undefined 
            }
          : a
      ),
    }));
  },

  escalateAlert: (id) => {
    set(state => ({
      alerts: state.alerts.map(a => 
        a.id === id 
          ? { 
              ...a, 
              level: 2, 
              status: 'ESCALATED',
              escalationTime: Date.now(),
              approvalFlow: generateApprovalSteps(),
            }
          : a
      ),
    }));
  },

  approveStep: (alertId, stepId, status, comment, userId) => {
    const user = mockUsers.find(u => u.id === userId);
    set(state => ({
      alerts: state.alerts.map(alert => {
        if (alert.id !== alertId || !alert.approvalFlow) return alert;
        
        const updatedFlow = alert.approvalFlow.map(step => 
          step.id === stepId 
            ? { ...step, status, comment, userId, timestamp: Date.now() }
            : step
        );
        
        const allApproved = updatedFlow.every(s => s.status === 'APPROVED');
        
        return {
          ...alert,
          approvalFlow: updatedFlow,
          status: allApproved ? 'PROCESSING' : alert.status,
        };
      }),
    }));
  },

  assignAlert: (id, userId) => {
    set(state => ({
      alerts: state.alerts.map(a => 
        a.id === id ? { ...a, assignee: userId } : a
      ),
    }));
  },

  selectAlert: (alert) => {
    set({ selectedAlert: alert });
  },

  setFilterLevel: (level) => {
    set({ filterLevel: level });
  },

  setFilterStatus: (status) => {
    set({ filterStatus: status });
  },

  getFilteredAlerts: () => {
    const { alerts, filterLevel, filterStatus } = get();
    return alerts.filter(alert => {
      if (filterLevel !== 'all' && alert.level !== filterLevel) return false;
      if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => {
      const levelOrder = { 2: 0, 1: 1 };
      const statusOrder = { PENDING: 0, ACKNOWLEDGED: 1, PROCESSING: 2, ESCALATED: 3, RESOLVED: 4, CLOSED: 5 };
      if (levelOrder[a.level] !== levelOrder[b.level]) {
        return levelOrder[a.level] - levelOrder[b.level];
      }
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.startTime - a.startTime;
    });
  },

  getStats: () => {
    return getAlertStats();
  },

  createAlert: (alert) => {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}`,
    };
    set(state => ({
      alerts: [newAlert, ...state.alerts],
    }));
  },
}));

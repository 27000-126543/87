import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, ThresholdConfig } from '@/types';
import { mockUsers, mockCurrentUser, mockThresholds, login as mockLogin } from '@/mock/users';
import { DEFAULT_THRESHOLDS } from '@/utils/constants';

interface UserState {
  currentUser: User | null;
  users: User[];
  thresholds: ThresholdConfig;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateThresholds: (thresholds: Partial<ThresholdConfig>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  hasPermission: (roles: string[]) => boolean;
  canAccessDataCenter: (dataCenterId: string, dataCenters?: any[]) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: mockUsers,
      thresholds: mockThresholds,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ loading: true, error: null });
        await new Promise(resolve => setTimeout(resolve, 500));
        const user = mockLogin(username, password);
        if (user) {
          set({ currentUser: user, isAuthenticated: true, loading: false });
          return true;
        } else {
          set({ error: '用户名或密码错误', loading: false });
          return false;
        }
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      clearError: () => {
        set({ error: null });
      },

      updateThresholds: (thresholds) => {
        set(state => ({
          thresholds: { ...state.thresholds, ...thresholds },
        }));
      },

      addUser: (user) => {
        const newUser: User = {
          ...user,
          id: `user-${Date.now()}`,
        };
        set(state => ({
          users: [...state.users, newUser],
        }));
      },

      updateUser: (id, user) => {
        set(state => ({
          users: state.users.map(u => 
            u.id === id ? { ...u, ...user } : u
          ),
        }));
      },

      deleteUser: (id) => {
        set(state => ({
          users: state.users.filter(u => u.id !== id),
        }));
      },

      hasPermission: (roles) => {
        const { currentUser } = get();
        if (!currentUser) return false;
        const roleHierarchy = ['ENGINEER', 'DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN'];
        const userLevel = roleHierarchy.indexOf(currentUser.role);
        return roles.some(r => roleHierarchy.indexOf(r) <= userLevel);
      },

      canAccessDataCenter: (dataCenterId, dataCenters) => {
        const { currentUser } = get();
        if (!currentUser) return false;
        if (currentUser.role === 'GROUP_ADMIN') return true;
        if (currentUser.role === 'REGION_MANAGER') {
          if (!dataCenters || dataCenters.length === 0) {
            return true;
          }
          const dc = dataCenters.find(d => d.id === dataCenterId);
          return dc ? dc.region === currentUser.region : false;
        }
        return currentUser.dataCenterIds?.includes(dataCenterId) || false;
      },
    }),
    {
      name: 'user-storage',
      partialize: state => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        thresholds: state.thresholds,
      }),
    }
  )
);

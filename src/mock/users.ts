import { User, ThresholdConfig } from '@/types';
import { DEFAULT_THRESHOLDS } from '@/utils/constants';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    username: 'cto',
    name: '张明',
    role: 'GROUP_ADMIN',
    email: 'zhangming@company.com',
    phone: '13800138001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cto',
  },
  {
    id: 'user-002',
    username: 'region_manager_north',
    name: '李华',
    role: 'REGION_MANAGER',
    region: 'north',
    email: 'lihua@company.com',
    phone: '13800138002',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lihua',
  },
  {
    id: 'user-003',
    username: 'dc_manager_001',
    name: '王强',
    role: 'DC_MANAGER',
    dataCenterIds: ['dc-001'],
    email: 'wangqiang@company.com',
    phone: '13800138003',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangqiang',
  },
  {
    id: 'user-004',
    username: 'engineer_001',
    name: '赵磊',
    role: 'ENGINEER',
    dataCenterIds: ['dc-001', 'dc-008'],
    email: 'zhaolei@company.com',
    phone: '13800138004',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaolei',
  },
  {
    id: 'user-005',
    username: 'dc_manager_003',
    name: '陈芳',
    role: 'DC_MANAGER',
    dataCenterIds: ['dc-003'],
    email: 'chenfang@company.com',
    phone: '13800138005',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenfang',
  },
  {
    id: 'user-006',
    username: 'engineer_002',
    name: '刘伟',
    role: 'ENGINEER',
    dataCenterIds: ['dc-003', 'dc-006'],
    email: 'liuwei@company.com',
    phone: '13800138006',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuwei',
  },
  {
    id: 'user-007',
    username: 'dc_manager_002',
    name: '孙敏',
    role: 'DC_MANAGER',
    dataCenterIds: ['dc-002'],
    email: 'sunmin@company.com',
    phone: '13800138007',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunmin',
  },
  {
    id: 'user-008',
    username: 'engineer_003',
    name: '周杰',
    role: 'ENGINEER',
    dataCenterIds: ['dc-002', 'dc-007'],
    email: 'zhoujie@company.com',
    phone: '13800138008',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhoujie',
  },
  {
    id: 'user-009',
    username: 'engineer_004',
    name: '吴涛',
    role: 'ENGINEER',
    dataCenterIds: ['dc-004', 'dc-005'],
    email: 'wutao@company.com',
    phone: '13800138009',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wutao',
  },
];

export const mockThresholds: ThresholdConfig = DEFAULT_THRESHOLDS;

export const mockCurrentUser: User = mockUsers[0];

export const login = (username: string, password: string): User | null => {
  const user = mockUsers.find(u => u.username === username);
  if (user && password === 'password123') {
    return user;
  }
  return null;
};

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(u => u.id === id);
};

export const getUsersByRole = (role: string): User[] => {
  return mockUsers.filter(u => u.role === role);
};

export const getUsersByDataCenter = (dataCenterId: string): User[] => {
  return mockUsers.filter(u => u.dataCenterIds?.includes(dataCenterId));
};

export const hasPermission = (user: User, requiredRole: string[]): boolean => {
  const roleHierarchy = ['ENGINEER', 'DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN'];
  const userLevel = roleHierarchy.indexOf(user.role);
  return requiredRole.some(r => roleHierarchy.indexOf(r) <= userLevel);
};

export const canAccessDataCenter = (user: User, dataCenterId: string, dataCenters?: any[]): boolean => {
  if (user.role === 'GROUP_ADMIN') return true;
  if (user.role === 'REGION_MANAGER') {
    if (!dataCenters) return true;
    const dc = dataCenters.find(d => d.id === dataCenterId);
    return dc ? dc.region === user.region : false;
  }
  return user.dataCenterIds?.includes(dataCenterId) || false;
};

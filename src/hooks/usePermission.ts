import { useMemo } from 'react';
import { useUserStore } from '@/store/userStore';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { UserRole } from '@/types';

export const usePermission = () => {
  const { currentUser, hasPermission, canAccessDataCenter: userCanAccessDataCenter } = useUserStore();
  const { dataCenters } = useDataCenterStore();

  const canAccessDataCenter = useMemo(() => {
    return (dataCenterId: string) => userCanAccessDataCenter(dataCenterId, dataCenters);
  }, [userCanAccessDataCenter, dataCenters]);

  const role = useMemo(() => currentUser?.role, [currentUser]);

  const isAdmin = useMemo(() => role === 'GROUP_ADMIN', [role]);
  const isRegionManager = useMemo(() => role === 'REGION_MANAGER', [role]);
  const isDCManager = useMemo(() => role === 'DC_MANAGER', [role]);
  const isEngineer = useMemo(() => role === 'ENGINEER', [role]);

  const canViewAlerts = useMemo(() => 
    hasPermission(['ENGINEER', 'DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN']),
    [hasPermission]
  );

  const canManageAlerts = useMemo(() => 
    hasPermission(['DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN']),
    [hasPermission]
  );

  const canApproveLevel1 = useMemo(() => 
    hasPermission(['ENGINEER', 'DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN']),
    [hasPermission]
  );

  const canApproveLevel2 = useMemo(() => 
    hasPermission(['DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN']),
    [hasPermission]
  );

  const canApproveLevel3 = useMemo(() => 
    hasPermission(['GROUP_ADMIN']),
    [hasPermission]
  );

  const canViewReports = useMemo(() => 
    hasPermission(['DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN']),
    [hasPermission]
  );

  const canManageCapacity = useMemo(() => 
    hasPermission(['DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN']),
    [hasPermission]
  );

  const canManageSettings = useMemo(() => 
    hasPermission(['GROUP_ADMIN']),
    [hasPermission]
  );

  const canManageUsers = useMemo(() => 
    hasPermission(['GROUP_ADMIN']),
    [hasPermission]
  );

  const getAccessibleDataCenterIds = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'GROUP_ADMIN' || currentUser.role === 'REGION_MANAGER') {
      return null;
    }
    return currentUser.dataCenterIds || [];
  }, [currentUser]);

  const getUserRegion = useMemo(() => {
    return currentUser?.region || null;
  }, [currentUser]);

  return {
    currentUser,
    role,
    isAdmin,
    isRegionManager,
    isDCManager,
    isEngineer,
    canViewAlerts,
    canManageAlerts,
    canApproveLevel1,
    canApproveLevel2,
    canApproveLevel3,
    canViewReports,
    canManageCapacity,
    canManageSettings,
    canManageUsers,
    hasPermission,
    canAccessDataCenter,
    getAccessibleDataCenterIds,
    getUserRegion,
  };
};

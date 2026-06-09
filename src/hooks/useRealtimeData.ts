import { useEffect, useMemo } from 'react';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { TelemetryData, EfficiencyMetrics } from '@/types';

export const useRealtimeData = (dataCenterId: string | string[] | null) => {
  const {
    isConnected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    getLatestData,
    getMetrics,
  } = useRealtimeStore();

  useEffect(() => {
    if (!dataCenterId) return;

    connect();

    const ids = Array.isArray(dataCenterId) ? dataCenterId : [dataCenterId];
    ids.forEach(id => subscribe(id));

    return () => {
      ids.forEach(id => unsubscribe(id));
    };
  }, [dataCenterId, connect, subscribe, unsubscribe]);

  const latestData: Record<string, TelemetryData | null> = useMemo(() => {
    if (!dataCenterId) return {};
    
    const ids = Array.isArray(dataCenterId) ? dataCenterId : [dataCenterId];
    const result: Record<string, TelemetryData | null> = {};
    
    ids.forEach(id => {
      result[id] = getLatestData(id);
    });
    
    return result;
  }, [dataCenterId, getLatestData]);

  const metrics: Record<string, EfficiencyMetrics | null> = useMemo(() => {
    if (!dataCenterId) return {};
    
    const ids = Array.isArray(dataCenterId) ? dataCenterId : [dataCenterId];
    const result: Record<string, EfficiencyMetrics | null> = {};
    
    ids.forEach(id => {
      result[id] = getMetrics(id);
    });
    
    return result;
  }, [dataCenterId, getMetrics]);

  return {
    isConnected,
    latestData,
    metrics,
  };
};

export const useAllRealtimeData = () => {
  const { dataCenters } = useDataCenterStore();
  const dataCenterIds = dataCenters.map(dc => dc.id);
  
  return useRealtimeData(dataCenterIds);
};

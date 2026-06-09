import { DataCenter, CityData, Rack } from '@/types';

export const mockDataCenters: DataCenter[] = [
  {
    id: 'dc-001',
    name: '北京亦庄数据中心',
    city: '北京',
    region: 'north',
    address: '北京市亦庄经济技术开发区',
    totalRacks: 1200,
    totalPower: 24000,
    designPUE: 1.3,
    coordinates: { lat: 39.78, lng: 116.50 },
    status: 'online',
  },
  {
    id: 'dc-002',
    name: '上海张江数据中心',
    city: '上海',
    region: 'east',
    address: '上海市浦东新区张江高科技园区',
    totalRacks: 1500,
    totalPower: 30000,
    designPUE: 1.25,
    coordinates: { lat: 31.20, lng: 121.58 },
    status: 'online',
  },
  {
    id: 'dc-003',
    name: '深圳前海数据中心',
    city: '深圳',
    region: 'south',
    address: '深圳市南山区前海自贸区',
    totalRacks: 1000,
    totalPower: 20000,
    designPUE: 1.28,
    coordinates: { lat: 22.53, lng: 113.93 },
    status: 'online',
  },
  {
    id: 'dc-004',
    name: '成都西部数据中心',
    city: '成都',
    region: 'west',
    address: '成都市高新区天府大道',
    totalRacks: 800,
    totalPower: 16000,
    designPUE: 1.35,
    coordinates: { lat: 30.57, lng: 104.06 },
    status: 'online',
  },
  {
    id: 'dc-005',
    name: '武汉光谷数据中心',
    city: '武汉',
    region: 'central',
    address: '武汉市东湖高新区光谷大道',
    totalRacks: 600,
    totalPower: 12000,
    designPUE: 1.32,
    coordinates: { lat: 30.49, lng: 114.39 },
    status: 'online',
  },
  {
    id: 'dc-006',
    name: '广州南沙数据中心',
    city: '广州',
    region: 'south',
    address: '广州市南沙区',
    totalRacks: 900,
    totalPower: 18000,
    designPUE: 1.3,
    coordinates: { lat: 23.12, lng: 113.26 },
    status: 'online',
  },
  {
    id: 'dc-007',
    name: '杭州萧山数据中心',
    city: '杭州',
    region: 'east',
    address: '杭州市萧山区',
    totalRacks: 700,
    totalPower: 14000,
    designPUE: 1.29,
    coordinates: { lat: 30.27, lng: 120.15 },
    status: 'maintenance',
  },
  {
    id: 'dc-008',
    name: '天津滨海数据中心',
    city: '天津',
    region: 'north',
    address: '天津市滨海新区',
    totalRacks: 1100,
    totalPower: 22000,
    designPUE: 1.33,
    coordinates: { lat: 39.03, lng: 117.72 },
    status: 'online',
  },
];

export const mockCities: CityData[] = [
  {
    id: 'city-001',
    name: '北京',
    region: 'north',
    dataCenterCount: 2,
    avgPUE: 1.38,
    totalCarbon: 125000,
    coordinates: { lat: 39.90, lng: 116.40 },
  },
  {
    id: 'city-002',
    name: '上海',
    region: 'east',
    dataCenterCount: 1,
    avgPUE: 1.32,
    totalCarbon: 98000,
    coordinates: { lat: 31.23, lng: 121.47 },
  },
  {
    id: 'city-003',
    name: '深圳',
    region: 'south',
    dataCenterCount: 1,
    avgPUE: 1.41,
    totalCarbon: 87000,
    coordinates: { lat: 22.54, lng: 114.05 },
  },
  {
    id: 'city-004',
    name: '成都',
    region: 'west',
    dataCenterCount: 1,
    avgPUE: 1.45,
    totalCarbon: 72000,
    coordinates: { lat: 30.67, lng: 104.06 },
  },
  {
    id: 'city-005',
    name: '武汉',
    region: 'central',
    dataCenterCount: 1,
    avgPUE: 1.39,
    totalCarbon: 54000,
    coordinates: { lat: 30.59, lng: 114.30 },
  },
  {
    id: 'city-006',
    name: '广州',
    region: 'south',
    dataCenterCount: 1,
    avgPUE: 1.36,
    totalCarbon: 78000,
    coordinates: { lat: 23.12, lng: 113.26 },
  },
  {
    id: 'city-007',
    name: '杭州',
    region: 'east',
    dataCenterCount: 1,
    avgPUE: 1.34,
    totalCarbon: 61000,
    coordinates: { lat: 30.27, lng: 120.15 },
  },
  {
    id: 'city-008',
    name: '天津',
    region: 'north',
    dataCenterCount: 1,
    avgPUE: 1.42,
    totalCarbon: 92000,
    coordinates: { lat: 39.14, lng: 117.20 },
  },
];

export const generateRacks = (dataCenterId: string): Rack[] => {
  const racks: Rack[] = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const positions = 10;
  
  let rackIndex = 0;
  for (const row of rows) {
    for (let pos = 1; pos <= positions; pos++) {
      const utilization = 40 + Math.random() * 50;
      const baseTemp = 22 + Math.random() * 6;
      racks.push({
        id: `${dataCenterId}-rack-${rackIndex.toString().padStart(3, '0')}`,
        dataCenterId,
        name: `${row}${pos.toString().padStart(2, '0')}`,
        row,
        position: pos,
        ratedPower: 6000 + Math.random() * 2000,
        servers: Math.floor(20 + Math.random() * 20),
        maxTemp: baseTemp + 3 + Math.random() * 4,
        minTemp: baseTemp - 2 - Math.random() * 2,
        utilization,
      });
      rackIndex++;
    }
  }
  
  return racks;
};

export const mockRacksByDataCenter: Record<string, Rack[]> = {};
mockDataCenters.forEach(dc => {
  mockRacksByDataCenter[dc.id] = generateRacks(dc.id);
});

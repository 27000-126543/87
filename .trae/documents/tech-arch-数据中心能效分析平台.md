## 1. 架构设计

```mermaid
graph TD
    subgraph "数据层"
        A1["实时数据流 Kafka"]
        A2["时序数据库 InfluxDB"]
        A3["关系型数据库 PostgreSQL"]
        A4["缓存 Redis"]
        A5["文件存储 MinIO"]
    end

    subgraph "服务层"
        B1["数据采集服务"]
        B2["数据清洗服务"]
        B3["实时计算引擎 Flink"]
        B4["能效分析服务"]
        B5["预警引擎服务"]
        B6["预测分析服务"]
        B7["报告生成服务"]
    end

    subgraph "前端层"
        C1["React 应用"]
        C2["ECharts 可视化"]
        C3["实时数据推送 WebSocket"]
        C4["状态管理 Zustand"]
        C5["路由管理 React Router"]
    end

    subgraph "外部系统"
        D1["机房传感器"]
        D2["服务器监控"]
        D3["冷却系统"]
        D4["邮件/短信通知"]
        D5["Excel 导入导出"]
    end

    A1 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> A2
    B3 --> A3
    B4 --> A2
    B4 --> A3
    B5 --> B4
    B6 --> A2
    B7 --> A3
    B7 --> A5
    C1 --> C3
    C3 --> B4
    C3 --> B5
    D1 --> B1
    D2 --> B1
    D3 --> B1
    B5 --> D4
    C1 --> D5
```

## 2. 技术栈说明

### 2.1 前端技术栈
- **核心框架**: React 18 + TypeScript 5
- **构建工具**: Vite 5
- **样式方案**: TailwindCSS 3 + SCSS
- **状态管理**: Zustand 4
- **路由管理**: React Router v6
- **图表库**: ECharts 5 + @echarts/react
- **UI组件库**: Ant Design 5
- **地图可视化**: 高德地图 JS API
- **Excel处理**: SheetJS (xlsx)
- **HTTP客户端**: Axios
- **实时通信**: Socket.io-client
- **动画库**: Framer Motion

### 2.2 模拟后端与数据
- **Mock数据**: MSW (Mock Service Worker)
- **数据生成**: Faker.js
- **本地存储**: localStorage + IndexedDB
- **模拟实时流**: setInterval + WebSocket模拟

## 3. 路由定义

| 路由路径 | 页面名称 | 权限要求 |
|---------|---------|---------|
| /login | 登录页 | 公开 |
| /dashboard | 总览看板 | 所有登录用户 |
| /dashboard/:cityId | 城市机房列表 | 对应区域权限 |
| /data-center/:id | 机房详情 | 对应机房权限 |
| /alerts | 预警中心 | 运维工程师及以上 |
| /alerts/:id | 预警详情/审批 | 对应审批权限 |
| /reports | 能效报表 | 机房主管及以上 |
| /capacity | 扩容预测 | 数据中心经理及以上 |
| /health-reports | 健康报告 | 所有登录用户 |
| /health-reports/:id | 报告详情 | 对应权限 |
| /settings | 系统设置 | 集团管理员 |
| /settings/users | 用户管理 | 集团管理员 |
| /settings/roles | 角色权限 | 集团管理员 |
| /settings/thresholds | 阈值配置 | 集团管理员 |

## 4. 核心数据类型定义

```typescript
// 机房数据
interface DataCenter {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  totalRacks: number;
  totalPower: number;
  designPUE: number;
  coordinates: { lat: number; lng: number };
}

// 机柜数据
interface Rack {
  id: string;
  dataCenterId: string;
  name: string;
  row: string;
  position: number;
  ratedPower: number;
  servers: number;
  maxTemp: number;
  minTemp: number;
}

// 实时数据点
interface TelemetryData {
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

// 能效指标
interface EfficiencyMetrics {
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

// 预警信息
interface Alert {
  id: string;
  type: 'PUE_EXCEEDED' | 'TEMPERATURE_HIGH' | 'HUMIDITY_ABNORMAL' | 'POWER_OVERLOAD';
  level: 1 | 2;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'PROCESSING' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  dataCenterId: string;
  rackId?: string;
  threshold: number;
  currentValue: number;
  startTime: number;
  escalationTime?: number;
  assignee?: string;
  approvalFlow?: ApprovalStep[];
  resolution?: string;
}

// 审批步骤
interface ApprovalStep {
  id: string;
  level: 1 | 2 | 3;
  role: 'ENGINEER' | 'MANAGER' | 'CTO';
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment: string;
  timestamp?: number;
}

// 扩容计划
interface ExpansionPlan {
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

// 节能建议
interface EnergySavingRecommendation {
  id: string;
  type: 'SERVER_SHUTDOWN' | 'AC_TEMPERATURE_ADJUST' | 'LOAD_BALANCING' | 'COOLING_OPTIMIZATION';
  description: string;
  estimatedEnergySaving: number;
  estimatedCarbonSaving: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// 健康报告
interface HealthReport {
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

// 用户与权限
interface User {
  id: string;
  username: string;
  name: string;
  role: 'GROUP_ADMIN' | 'REGION_MANAGER' | 'DC_MANAGER' | 'ENGINEER';
  region?: string;
  dataCenterIds?: string[];
  email: string;
  phone: string;
}
```

## 5. 前端核心模块架构

```mermaid
graph TD
    subgraph "应用入口"
        A["main.tsx"] --> B["App.tsx"]
        B --> C["路由配置"]
        B --> D["全局状态初始化"]
    end

    subgraph "布局层"
        E["MainLayout"] --> F["侧边导航"]
        E --> G["顶部导航栏"]
        E --> H["内容区域"]
        E --> I["全局告警浮窗"]
    end

    subgraph "页面层"
        J["DashboardPage"] --> K["热力图组件"]
        J --> L["指标卡片组件"]
        J --> M["排名列表组件"]
        N["DataCenterPage"] --> O["趋势图组件"]
        N --> P["箱线图组件"]
        N --> Q["机柜列表组件"]
        R["AlertsPage"] --> S["告警列表组件"]
        R --> T["审批流程组件"]
        U["CapacityPage"] --> V["文件上传组件"]
        U --> W["预测图表组件"]
        U --> X["建议列表组件"]
    end

    subgraph "数据层"
        Y["Zustand Stores"] --> Y1["用户Store"]
        Y --> Y2["机房Store"]
        Y --> Y3["告警Store"]
        Y --> Y4["实时数据Store"]
        Z["API Services"] --> Z1["REST API"]
        Z --> Z2["WebSocket Service"]
        Z --> Z3["Mock Service Worker"]
    end

    subgraph "工具层"
        AA["计算工具"] --> AA1["能效计算"]
        AA --> AA2["预测算法"]
        AA --> AA3["格式化工具"]
        AB["自定义Hooks"] --> AB1["useRealtimeData"]
        AB --> AB2["usePermission"]
        AB --> AB3["useChartTheme"]
    end
```

## 6. 前端目录结构

```
src/
├── assets/                 # 静态资源
│   ├── fonts/             # 字体文件
│   ├── icons/             # 图标
│   └── images/            # 图片
├── components/            # 公共组件
│   ├── charts/           # 图表组件
│   ├── layout/           # 布局组件
│   ├── ui/               # 基础UI组件
│   └── common/           # 通用业务组件
├── pages/                 # 页面组件
│   ├── Login/
│   ├── Dashboard/
│   ├── DataCenter/
│   ├── Alerts/
│   ├── Reports/
│   ├── Capacity/
│   ├── HealthReports/
│   └── Settings/
├── store/                 # 状态管理
│   ├── userStore.ts
│   ├── dataCenterStore.ts
│   ├── alertStore.ts
│   └── realtimeStore.ts
├── services/              # API服务
│   ├── api.ts
│   ├── websocket.ts
│   └── mock/
├── hooks/                 # 自定义Hooks
│   ├── useRealtimeData.ts
│   ├── usePermission.ts
│   └── useChartTheme.ts
├── utils/                 # 工具函数
│   ├── efficiency.ts
│   ├── prediction.ts
│   ├── formatters.ts
│   └── constants.ts
├── types/                 # 类型定义
│   └── index.ts
├── styles/                # 全局样式
│   ├── index.scss
│   ├── variables.scss
│   └── animations.scss
├── mock/                  # Mock数据
│   ├── dataCenters.ts
│   ├── telemetry.ts
│   └── alerts.ts
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

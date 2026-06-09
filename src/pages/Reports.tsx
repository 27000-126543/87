import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Table,
  Tag,
  Button,
  Statistic,
  Space,
  Tabs,
  Empty,
} from 'antd';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Zap,
  Thermometer,
  Gauge,
  Leaf,
} from 'lucide-react';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { useUserStore } from '@/store/userStore';
import { usePermission } from '@/hooks/usePermission';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import {
  formatPUE,
  formatPower,
  formatEnergy,
  formatCarbon,
  formatTemperature,
  formatCurrency,
  formatPercentage,
  formatDateTime,
  getChangeColor,
  formatChange,
} from '@/utils/formatters';
import { REGIONS } from '@/utils/constants';
import { TimeRange } from '@/types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

export default function Reports() {
  const {
    dataCenters,
    cities,
    selectedDataCenter,
    selectDataCenter,
    fetchMetrics,
    fetchEnergyTrend,
    fetchCarbonTrend,
    metrics,
    energyTrends,
    carbonTrends,
    timeRange,
    setTimeRange,
  } = useDataCenterStore();
  const { currentUser } = useUserStore();
  const { canAccessDataCenter } = usePermission();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const visibleDataCenters = useMemo(() => {
    return dataCenters.filter(dc => canAccessDataCenter(dc.id));
  }, [dataCenters, canAccessDataCenter]);

  const visibleCities = useMemo(() => {
    const dcCityIds = new Set(visibleDataCenters.map(dc => dc.city));
    return cities.filter(c => dcCityIds.has(c.id));
  }, [cities, visibleDataCenters]);

  useEffect(() => {
    selectDataCenter(null);
    setTimeRange('24h');
    setDateRange(null);
  }, [currentUser?.id, selectDataCenter, setTimeRange]);

  useEffect(() => {
    const visibleDCIds = visibleDataCenters.map(dc => dc.id);
    if (selectedDataCenter && !visibleDCIds.includes(selectedDataCenter.id)) {
      selectDataCenter(null);
    }
  }, [visibleDataCenters, selectedDataCenter, selectDataCenter]);

  const dcMetrics = useMemo(() => {
    if (!selectedDataCenter) return null;
    return metrics[selectedDataCenter.id] || [];
  }, [selectedDataCenter, metrics]);

  const energyTrend = useMemo(() => {
    if (!selectedDataCenter) return [];
    return energyTrends[selectedDataCenter.id] || [];
  }, [selectedDataCenter, energyTrends]);

  const carbonTrend = useMemo(() => {
    if (!selectedDataCenter) return [];
    return carbonTrends[selectedDataCenter.id] || [];
  }, [selectedDataCenter, carbonTrends]);

  const pueTrendData = useMemo(() => {
    return dcMetrics.map(m => ({
      timestamp: m.timestamp,
      value: m.pue,
    }));
  }, [dcMetrics]);

  const utilizationTrendData = useMemo(() => {
    return dcMetrics.map(m => ({
      timestamp: m.timestamp,
      value: m.rackUtilization,
    }));
  }, [dcMetrics]);

  const avgMetrics = useMemo(() => {
    if (dcMetrics.length === 0) return null;
    const sum = dcMetrics.reduce(
      (acc, m) => ({
        pue: acc.pue + m.pue,
        rackUtilization: acc.rackUtilization + m.rackUtilization,
        temperatureUniformity: acc.temperatureUniformity + m.temperatureUniformity,
        totalPower: acc.totalPower + m.totalPower,
        carbonEmission: acc.carbonEmission + m.carbonEmission,
      }),
      { pue: 0, rackUtilization: 0, temperatureUniformity: 0, totalPower: 0, carbonEmission: 0 }
    );
    return {
      avgPUE: sum.pue / dcMetrics.length,
      avgUtilization: sum.rackUtilization / dcMetrics.length,
      avgUniformity: sum.temperatureUniformity / dcMetrics.length,
      totalEnergy: sum.totalPower * 24 / 1000,
      totalCarbon: sum.carbonEmission,
    };
  }, [dcMetrics]);

  const energyComparisonData = useMemo(() => {
    return visibleDataCenters.slice(0, 6).map(dc => ({
      name: dc.name,
      value: dc.totalPower * 24 * 30 / 1000,
    })).sort((a, b) => b.value - a.value);
  }, [visibleDataCenters]);

  const carbonComparisonData = useMemo(() => {
    return visibleCities.slice(0, 6).map(city => ({
      name: city.name,
      value: city.totalCarbon,
    })).sort((a, b) => b.value - a.value);
  }, [visibleCities]);

  useEffect(() => {
    if (selectedDataCenter) {
      fetchMetrics(selectedDataCenter.id, timeRange);
      fetchEnergyTrend(selectedDataCenter.id, 30);
      fetchCarbonTrend(selectedDataCenter.id, 30);
    }
  }, [selectedDataCenter, timeRange, fetchMetrics, fetchEnergyTrend, fetchCarbonTrend]);

  const timeRangeOptions = [
    { value: '1h', label: '近1小时' },
    { value: '6h', label: '近6小时' },
    { value: '24h', label: '近24小时' },
    { value: '7d', label: '近7天' },
    { value: '30d', label: '近30天' },
    { value: '90d', label: '近90天' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-display">
            能效报表
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            多维度分析数据中心能效与碳排放数据
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            placeholder="选择机房"
            className="w-48"
            value={selectedDataCenter?.id}
            onChange={(val) => {
              const dc = visibleDataCenters.find(d => d.id === val);
              selectDataCenter(dc || null);
            }}
            allowClear
          >
            {visibleDataCenters.map(dc => (
              <Option key={dc.id} value={dc.id}>
                {dc.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="时间范围"
            className="w-36"
            value={timeRange}
            onChange={(val: TimeRange) => setTimeRange(val)}
          >
            {timeRangeOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange as any}
            className="w-64"
          />
          <Button icon={<Download className="w-4 h-4" />}>
            导出报表
          </Button>
        </div>
      </div>

      {selectedDataCenter ? (
        <>
          {avgMetrics && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="glass-card border-border/50">
                  <Statistic
                    title={
                      <span className="text-text-tertiary flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        平均PUE
                      </span>
                    }
                    value={avgMetrics.avgPUE}
                    precision={3}
                    valueStyle={{ color: avgMetrics.avgPUE < 1.4 ? '#2ED573' : avgMetrics.avgPUE < 1.5 ? '#FFA502' : '#FF4757' }}
                    suffix={<span className="text-sm">({formatChange(-1.2)}%)</span>}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="glass-card border-border/50">
                  <Statistic
                    title={
                      <span className="text-text-tertiary flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        总能耗
                      </span>
                    }
                    value={avgMetrics.totalEnergy}
                    precision={2}
                    suffix="kWh"
                    valueStyle={{ color: '#00D4FF' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="glass-card border-border/50">
                  <Statistic
                    title={
                      <span className="text-text-tertiary flex items-center gap-2">
                        <Leaf className="w-4 h-4" />
                        碳排放
                      </span>
                    }
                    value={avgMetrics.totalCarbon}
                    precision={2}
                    suffix="吨"
                    valueStyle={{ color: '#FF4757' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="glass-card border-border/50">
                  <Statistic
                    title={
                      <span className="text-text-tertiary flex items-center gap-2">
                        <Thermometer className="w-4 h-4" />
                        温度均匀性
                      </span>
                    }
                    value={avgMetrics.avgUniformity}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#2ED573' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          <Tabs defaultActiveKey="trend">
            <TabPane tab="趋势分析" key="trend">
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card className="glass-card border-border/50 h-full">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                      PUE 趋势
                    </h3>
                    <LineChart
                      data={pueTrendData}
                      name="PUE"
                      color="#00D4FF"
                      height={280}
                      showArea
                      smooth
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card className="glass-card border-border/50 h-full">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                      机柜利用率趋势
                    </h3>
                    <LineChart
                      data={utilizationTrendData}
                      name="利用率(%)"
                      color="#2ED573"
                      height={280}
                      showArea
                      smooth
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card className="glass-card border-border/50 h-full">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                      能耗趋势
                    </h3>
                    <LineChart
                      data={energyTrend}
                      name="能耗(kWh)"
                      color="#A55EEA"
                      height={280}
                      showArea
                      smooth
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card className="glass-card border-border/50 h-full">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                      碳排放趋势
                    </h3>
                    <LineChart
                      data={carbonTrend}
                      name="碳排放(吨)"
                      color="#FF4757"
                      height={280}
                      showArea
                      smooth
                    />
                  </Card>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="对比分析" key="comparison">
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card className="glass-card border-border/50">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                      机房能耗对比
                    </h3>
                    <BarChart
                      data={energyComparisonData}
                      name="月能耗(kWh)"
                      colors={['#00D4FF', '#2ED573', '#FFA502', '#FF4757', '#A55EEA', '#718096']}
                      height={350}
                      horizontal
                      sort="desc"
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card className="glass-card border-border/50">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                      城市碳排放对比
                    </h3>
                    <BarChart
                      data={carbonComparisonData}
                      name="碳排放(吨)"
                      colors={['#FF4757', '#FFA502', '#2ED573', '#00D4FF', '#A55EEA', '#718096']}
                      height={350}
                      horizontal
                      sort="desc"
                    />
                  </Card>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="明细数据" key="detail">
              <Card className="glass-card border-border/50">
                <Table
                  dataSource={dcMetrics}
                  rowKey="timestamp"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  scroll={{ x: 1000 }}
                  columns={[
                    {
                      title: '时间',
                      dataIndex: 'timestamp',
                      key: 'timestamp',
                      render: (t: number) => formatDateTime(t),
                      width: 180,
                    },
                    {
                      title: 'PUE',
                      dataIndex: 'pue',
                      key: 'pue',
                      render: (val: number) => (
                        <span className="font-mono" style={{ color: getChangeColor(val - 1.4) }}>
                          {formatPUE(val)}
                        </span>
                      ),
                    },
                    {
                      title: '机柜利用率',
                      dataIndex: 'rackUtilization',
                      key: 'rackUtilization',
                      render: (val: number) => (
                        <Tag color={val > 80 ? 'red' : val > 60 ? 'orange' : 'green'}>
                          {formatPercentage(val)}
                        </Tag>
                      ),
                    },
                    {
                      title: '温度均匀性',
                      dataIndex: 'temperatureUniformity',
                      key: 'temperatureUniformity',
                      render: (val: number) => (
                        <span className="font-mono text-success">
                          {formatPercentage(val)}
                        </span>
                      ),
                    },
                    {
                      title: '总功率(kW)',
                      dataIndex: 'totalPower',
                      key: 'totalPower',
                      render: (val: number) => (
                        <span className="font-mono text-text-primary">
                          {formatPower(val)}
                        </span>
                      ),
                    },
                    {
                      title: 'IT功率(kW)',
                      dataIndex: 'itPower',
                      key: 'itPower',
                      render: (val: number) => (
                        <span className="font-mono text-text-primary">
                          {formatPower(val)}
                        </span>
                      ),
                    },
                    {
                      title: '冷却功率(kW)',
                      dataIndex: 'coolingPower',
                      key: 'coolingPower',
                      render: (val: number) => (
                        <span className="font-mono text-text-primary">
                          {formatPower(val)}
                        </span>
                      ),
                    },
                    {
                      title: '碳排放(吨)',
                      dataIndex: 'carbonEmission',
                      key: 'carbonEmission',
                      render: (val: number) => (
                        <span className="font-mono text-danger">
                          {formatCarbon(val)}
                        </span>
                      ),
                    },
                  ]}
                />
              </Card>
            </TabPane>
          </Tabs>
        </>
      ) : (
        <Card className="glass-card border-border/50">
          <Empty
            description="请选择机房查看详细报表"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, Row, Col, Badge, Tabs, Tag, Table, Space } from 'antd';
import {
  ArrowLeft,
  Server,
  Thermometer,
  Zap,
  Gauge,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import MetricCard from '@/components/common/MetricCard';
import LineChart from '@/components/charts/LineChart';
import BoxPlotChart from '@/components/charts/BoxPlotChart';
import {
  formatPUE,
  formatPower,
  formatTemperature,
  formatPercentage,
  formatCarbon,
  getPUEColor,
  getTemperatureColor,
  getUtilizationColor,
} from '@/utils/formatters';
import { calculateBoxPlotStats } from '@/utils/efficiency';
import { Rack, TelemetryData } from '@/types';

const { TabPane } = Tabs;

export default function DataCenterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedRack, setSelectedRack] = useState<Rack | null>(null);

  const {
    fetchDataCenterById,
    fetchRacks,
    fetchMetrics,
    fetchRackTelemetry,
    fetchEnergyTrend,
    fetchCurrentMetrics,
    racks,
    metrics,
    currentMetrics,
    rackTelemetry,
    energyTrends,
  } = useDataCenterStore();

  const { latestData, metrics: realtimeMetrics } = useRealtimeData(id || null);

  const dataCenter = useMemo(() => {
    if (!id) return null;
    return fetchDataCenterById(id);
  }, [id, fetchDataCenterById]);

  const dcRacks = useMemo(() => {
    if (!id) return [];
    return racks[id] || [];
  }, [id, racks]);

  const dcMetrics = useMemo(() => {
    if (!id) return null;
    const current = currentMetrics[id];
    if (current) return current;
    const realtime = realtimeMetrics[id];
    if (realtime) return realtime;
    const history = metrics[id];
    if (history && history.length > 0) return history[history.length - 1];
    return null;
  }, [id, currentMetrics, metrics, realtimeMetrics]);

  const latestTelemetry = useMemo(() => {
    if (!id) return null;
    return latestData[id];
  }, [id, latestData]);

  const energyTrend = useMemo(() => {
    if (!id) return [];
    return energyTrends[id] || [];
  }, [id, energyTrends]);

  const pueTrendData = useMemo(() => {
    return energyTrend.map(t => ({
      timestamp: t.timestamp,
      value: t.value / 5000 + 1.2,
    }));
  }, [energyTrend]);

  const powerTrendData = useMemo(() => {
    return energyTrend.map(t => ({
      timestamp: t.timestamp,
      value: t.value,
    }));
  }, [energyTrend]);

  const temperatureBoxPlotData = useMemo(() => {
    if (!id || dcRacks.length === 0) return [];

    const rackTemps: Record<string, number[]> = {};
    dcRacks.forEach(rack => {
      const key = `${id}-${rack.id}`;
      const telemetry = rackTelemetry[key] || [];
      rackTemps[rack.name] = telemetry.map(t => t.temperature);
    });

    return Object.entries(rackTemps).map(([name, temps]) => ({
      name,
      ...calculateBoxPlotStats(temps),
    }));
  }, [id, dcRacks, rackTelemetry]);

  const rackPowerTrendData = useMemo(() => {
    if (!selectedRack || !id) return [];
    const key = `${id}-${selectedRack.id}`;
    const telemetry = rackTelemetry[key] || [];
    return telemetry.map(t => ({
      timestamp: t.timestamp,
      value: t.powerUsage,
    }));
  }, [id, selectedRack, rackTelemetry]);

  useEffect(() => {
    if (id) {
      fetchRacks(id);
      fetchMetrics(id, '7d');
      fetchEnergyTrend(id, 7);
      fetchCurrentMetrics(id);
    }
  }, [id, fetchRacks, fetchMetrics, fetchEnergyTrend, fetchCurrentMetrics]);

  useEffect(() => {
    if (id && selectedRack) {
      fetchRackTelemetry(id, selectedRack.id);
    }
  }, [id, selectedRack, fetchRackTelemetry]);

  if (!dataCenter) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-text-tertiary">机房不存在</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            返回看板
          </Button>
        </div>
      </div>
    );
  }

  const rackColumns = [
    {
      title: '机柜名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Rack) => (
        <span className="font-medium text-text-primary">{text}</span>
      ),
    },
    {
      title: '位置',
      dataIndex: 'row',
      key: 'row',
      render: (text: string, record: Rack) => (
        <span className="text-text-secondary">{text}-{record.position}</span>
      ),
    },
    {
      title: '服务器数量',
      dataIndex: 'servers',
      key: 'servers',
      render: (val: number) => (
        <span className="font-mono text-text-primary">{val}</span>
      ),
    },
    {
      title: '额定功率',
      dataIndex: 'ratedPower',
      key: 'ratedPower',
      render: (val: number) => (
        <span className="font-mono text-text-primary">{formatPower(val)}</span>
      ),
    },
    {
      title: '利用率',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (val: number) => (
        <Tag color={val > 80 ? 'red' : val > 60 ? 'orange' : 'green'}>
          {formatPercentage(val)}
        </Tag>
      ),
    },
    {
      title: '最高温度',
      dataIndex: 'maxTemp',
      key: 'maxTemp',
      render: (val: number) => (
        <span className="font-mono" style={{ color: getTemperatureColor(val) }}>
          {formatTemperature(val)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Rack) => (
        <Button
          type="link"
          size="small"
          onClick={() => setSelectedRack(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/dashboard')}
            className="text-text-secondary hover:text-text-primary"
          >
            返回
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary font-display">
                {dataCenter.name}
              </h1>
              <Badge
                status={dataCenter.status === 'online' ? 'success' : dataCenter.status === 'maintenance' ? 'warning' : 'error'}
                text={dataCenter.status === 'online' ? '运行中' : dataCenter.status === 'maintenance' ? '维护中' : '离线'}
              />
            </div>
            <p className="text-sm text-text-tertiary mt-1">
              {dataCenter.address} · {dataCenter.region}区域
            </p>
          </div>
        </div>
        <Space>
          <Tag color="blue">机柜 {dataCenter.totalRacks} 个</Tag>
          <Tag color="green">设计PUE {dataCenter.designPUE}</Tag>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="当前PUE"
            value={formatPUE(dcMetrics?.pue || 1.35)}
            icon={<Gauge className="w-5 h-5" />}
            color={(dcMetrics?.pue || 1.35) < 1.4 ? 'success' : (dcMetrics?.pue || 1.35) < 1.5 ? 'warning' : 'danger'}
            trend={(dcMetrics?.pue || 1.35) < 1.4 ? 'down' : 'up'}
            change={0.8}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="机柜利用率"
            value={formatPercentage(dcMetrics?.rackUtilization || 72.5)}
            icon={<Server className="w-5 h-5" />}
            color={dcMetrics?.rackUtilization || 72.5 > 80 ? 'warning' : 'primary'}
            trend="up"
            change={1.5}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="温度均匀性"
            value={formatPercentage(dcMetrics?.temperatureUniformity || 85.3)}
            icon={<Thermometer className="w-5 h-5" />}
            color="success"
            trend="stable"
            change={0.2}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="实时功率"
            value={formatPower(latestTelemetry?.powerUsage || dataCenter.totalPower * 0.7)}
            icon={<Zap className="w-5 h-5" />}
            color="purple"
            trend="up"
            change={2.1}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="glass-card border-border/50">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              近7天功耗趋势
            </h3>
            <LineChart
              data={powerTrendData}
              name="功耗(kW)"
              color="#00D4FF"
              height={280}
              showArea
              smooth
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="glass-card border-border/50">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              近7天PUE趋势
            </h3>
            <LineChart
              data={pueTrendData}
              name="PUE"
              color="#2ED573"
              height={280}
              showArea
              smooth
            />
          </Card>
        </Col>
      </Row>

      <Card className="glass-card border-border/50">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          机柜温度分布（近7天）
        </h3>
        <BoxPlotChart
          data={temperatureBoxPlotData}
          labels={temperatureBoxPlotData.map(d => d.name)}
          yAxisName="温度"
          yAxisUnit="°C"
          height={350}
        />
      </Card>

      <Card className="glass-card border-border/50">
        <Tabs defaultActiveKey="racks">
          <TabPane tab="机柜列表" key="racks">
            <Table
              columns={rackColumns}
              dataSource={dcRacks}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </TabPane>
          <TabPane tab="实时监控" key="realtime">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {dcRacks.slice(0, 12).map((rack, index) => {
                const key = `${id}-${rack.id}`;
                const telemetry = rackTelemetry[key]?.[rackTelemetry[key]?.length - 1];
                const temp = telemetry?.temperature || rack.minTemp + Math.random() * (rack.maxTemp - rack.minTemp);
                return (
                  <motion.div
                    key={rack.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl border border-border/50 bg-background-secondary/50 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => setSelectedRack(rack)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">{rack.name}</span>
                      <Activity className="w-4 h-4 text-success animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">温度</span>
                        <span className="font-mono" style={{ color: getTemperatureColor(temp) }}>
                          {formatTemperature(temp)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">负载</span>
                        <span className="font-mono" style={{ color: getUtilizationColor(rack.utilization) }}>
                          {formatPercentage(rack.utilization)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {selectedRack && (
        <Card
          className="glass-card border-border/50"
          title={
            <div className="flex items-center justify-between">
              <span>机柜详情 - {selectedRack.name}</span>
              <Button type="text" onClick={() => setSelectedRack(null)}>
                关闭
              </Button>
            </div>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">额定功率</p>
                <p className="text-xl font-bold text-primary font-mono">
                  {formatPower(selectedRack.ratedPower)}
                </p>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">服务器数量</p>
                <p className="text-xl font-bold text-purple font-mono">
                  {selectedRack.servers} 台
                </p>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">温度范围</p>
                <p className="text-xl font-bold font-mono" style={{ color: getTemperatureColor(selectedRack.maxTemp) }}>
                  {formatTemperature(selectedRack.minTemp)} ~ {formatTemperature(selectedRack.maxTemp)}
                </p>
              </div>
            </Col>
          </Row>
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-text-primary mb-4">
              近7天功耗趋势
            </h4>
            <LineChart
              data={rackPowerTrendData}
              name="功耗(kW)"
              color="#A55EEA"
              height={200}
              showArea
              smooth
            />
          </div>
        </Card>
      )}
    </div>
  );
}

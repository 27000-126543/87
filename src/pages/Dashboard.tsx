import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Select, Row, Col, Card, Badge, Tag } from 'antd';
import {
  Building2,
  Server,
  Gauge,
  Thermometer,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { useAlertStore } from '@/store/alertStore';
import { useAllRealtimeData } from '@/hooks/useRealtimeData';
import { usePermission } from '@/hooks/usePermission';
import MetricCard from '@/components/common/MetricCard';
import HeatMap from '@/components/charts/HeatMap';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import GaugeChart from '@/components/charts/GaugeChart';
import {
  formatPUE,
  formatPower,
  formatCarbon,
  formatPercentage,
  formatTemperature,
  getPUEColor,
} from '@/utils/formatters';
import { REGIONS } from '@/utils/constants';

const { Option } = Select;

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    dataCenters,
    cities,
    selectedCity,
    selectedDataCenter,
    selectCity,
    selectDataCenter,
    getNationalStats,
    fetchEnergyTrend,
    fetchCarbonTrend,
    energyTrends,
    carbonTrends,
  } = useDataCenterStore();
  const { getStats, alerts } = useAlertStore();
  const { metrics, isConnected } = useAllRealtimeData();
  const { canAccessDataCenter } = usePermission();

  const nationalStats = useMemo(() => getNationalStats(), [getNationalStats]);
  const alertStats = useMemo(() => getStats(), [getStats]);

  const visibleDataCenters = useMemo(() => {
    return dataCenters.filter(dc => canAccessDataCenter(dc.id));
  }, [dataCenters, canAccessDataCenter]);

  const visibleCities = useMemo(() => {
    const dcCityIds = new Set(visibleDataCenters.map(dc => dc.city));
    return cities.filter(c => dcCityIds.has(c.id));
  }, [cities, visibleDataCenters]);

  useEffect(() => {
    if (selectedDataCenter) {
      fetchEnergyTrend(selectedDataCenter.id, 30);
      fetchCarbonTrend(selectedDataCenter.id, 30);
    }
  }, [selectedDataCenter, fetchEnergyTrend, fetchCarbonTrend]);

  const handleCityClick = (city: any) => {
    selectCity(city);
    const dcInCity = visibleDataCenters.find(dc => dc.city === city.id);
    if (dcInCity) {
      selectDataCenter(dcInCity);
    }
  };

  const handleDataCenterClick = (dc: any) => {
    navigate(`/data-center/${dc.id}`);
  };

  const pueTrendData = useMemo(() => {
    if (!selectedDataCenter) return [];
    const trend = energyTrends[selectedDataCenter.id] || [];
    return trend.map(t => ({
      timestamp: t.timestamp,
      value: t.value / 1000 + 1.2,
    }));
  }, [selectedDataCenter, energyTrends]);

  const carbonRankingData = useMemo(() => {
    return visibleCities
      .map(city => ({
        name: city.name,
        value: city.totalCarbon,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [visibleCities]);

  const avgPUE = useMemo(() => {
    if (selectedDataCenter && metrics[selectedDataCenter.id]) {
      return metrics[selectedDataCenter.id]!.pue;
    }
    return nationalStats.avgPUE;
  }, [selectedDataCenter, metrics, nationalStats.avgPUE]);

  const pendingAlerts = useMemo(() => {
    return alerts.filter(a =>
      a.status === 'PENDING' || a.status === 'ACKNOWLEDGED' || a.status === 'ESCALATED'
    ).length;
  }, [alerts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-display">
            能效总览看板
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            实时监控全国数据中心能效与运维状态
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            status={isConnected ? 'success' : 'error'}
            text={isConnected ? '实时连接' : '连接中断'}
          />
          <Select
            placeholder="选择区域"
            className="w-40"
            allowClear
          >
            {REGIONS.map(region => (
              <Option key={region.value} value={region.value}>
                {region.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="选择城市"
            className="w-40"
            value={selectedCity?.id}
            onChange={(val) => {
              const city = visibleCities.find(c => c.id === val);
              selectCity(city || null);
            }}
            allowClear
          >
            {visibleCities.map(city => (
              <Option key={city.id} value={city.id}>
                {city.name}
              </Option>
            ))}
          </Select>
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
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="在线机房"
            value={nationalStats.totalDataCenters}
            unit="个"
            icon={<Building2 className="w-5 h-5" />}
            color="primary"
            trend="stable"
            change={0}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="机柜总数"
            value={nationalStats.totalRacks}
            unit="个"
            icon={<Server className="w-5 h-5" />}
            color="purple"
            trend="up"
            change={2.5}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="平均PUE"
            value={formatPUE(nationalStats.avgPUE)}
            icon={<Gauge className="w-5 h-5" />}
            color={nationalStats.avgPUE < 1.4 ? 'success' : nationalStats.avgPUE < 1.5 ? 'warning' : 'danger'}
            trend="down"
            change={1.2}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="今日碳排放"
            value={formatCarbon(nationalStats.totalCarbon)}
            icon={<TrendingUp className="w-5 h-5" />}
            color="danger"
            trend="up"
            change={3.8}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="glass-card border-border/50 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                全国能效热力图
              </h3>
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span>PUE {'<'} 1.3</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span>1.3 - 1.5</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-danger" />
                  <span>PUE {'>'} 1.5</span>
                </div>
              </div>
            </div>
            <HeatMap
              data={visibleCities}
              onCityClick={handleCityClick}
              height={400}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="glass-card border-border/50 h-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              当前PUE指数
            </h3>
            <GaugeChart
              value={avgPUE}
              min={1.0}
              max={2.0}
              title="PUE"
              subtitle={selectedDataCenter?.name || '全国平均'}
              thresholds={[1.3, 1.5, 1.7]}
              height={300}
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">总功率</p>
                <p className="text-lg font-bold text-primary font-mono">
                  {formatPower(nationalStats.totalPower)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">待处理告警</p>
                <p className="text-lg font-bold text-danger font-mono">
                  {pendingAlerts}
                </p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card className="glass-card border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {selectedDataCenter ? `${selectedDataCenter.name} - PUE趋势` : '全国平均PUE趋势'}
              </h3>
              <Tag color="blue">近30天</Tag>
            </div>
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

        <Col xs={24} lg={10}>
          <Card className="glass-card border-border/50">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              城市碳排放排名
            </h3>
            <BarChart
              data={carbonRankingData}
              name="碳排放(吨)"
              colors={['#FF4757', '#FFA502', '#2ED573', '#00D4FF', '#A55EEA']}
              height={280}
              horizontal
              sort="desc"
            />
          </Card>
        </Col>
      </Row>

      <Card className="glass-card border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            机房列表
          </h3>
          <span className="text-sm text-text-tertiary">
            点击机房卡片查看详情
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleDataCenters.map((dc, index) => {
            const dcMetrics = metrics[dc.id];
            return (
              <motion.div
                key={dc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => handleDataCenterClick(dc)}
                className="p-4 rounded-xl border border-border/50 bg-background-secondary/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-text-primary">{dc.name}</h4>
                    <p className="text-xs text-text-tertiary">{dc.city}</p>
                  </div>
                  <Badge
                    status={dc.status === 'online' ? 'success' : dc.status === 'maintenance' ? 'warning' : 'error'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-tertiary text-xs">机柜数</p>
                    <p className="font-mono font-semibold text-text-primary">{dc.totalRacks}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">设计PUE</p>
                    <p className="font-mono font-semibold text-text-primary">{dc.designPUE}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">当前PUE</p>
                    <p
                      className="font-mono font-bold"
                      style={{ color: getPUEColor(dcMetrics?.pue || 1.4) }}
                    >
                      {formatPUE(dcMetrics?.pue || 1.35 + Math.random() * 0.2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">功率</p>
                    <p className="font-mono font-semibold text-text-primary">
                      {formatPower(dc.totalPower)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Select, Row, Col, Card, Badge, Tag, Button, Radio, Space } from 'antd';
import {
  Building2,
  Server,
  Gauge,
  Thermometer,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  GitCompare,
  X,
} from 'lucide-react';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { useAlertStore } from '@/store/alertStore';
import { useUserStore } from '@/store/userStore';
import { useAllRealtimeData } from '@/hooks/useRealtimeData';
import { usePermission } from '@/hooks/usePermission';
import MetricCard from '@/components/common/MetricCard';
import HeatMap from '@/components/charts/HeatMap';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import GaugeChart from '@/components/charts/GaugeChart';
import { TrendPoint } from '@/types';
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
    getStatsForDataCenters,
    resetSelection,
    clearInvalidSelection,
    fetchDataCenters,
    fetchEnergyTrend,
    fetchCarbonTrend,
    fetchCurrentMetrics,
    energyTrends,
    carbonTrends,
    currentMetrics,
  } = useDataCenterStore();
  const { alerts } = useAlertStore();
  const { currentUser } = useUserStore();
  const { metrics, isConnected } = useAllRealtimeData();
  const { canAccessDataCenter } = usePermission();

  const [viewMode, setViewMode] = useState<'normal' | 'compare'>('normal');
  const [compareType, setCompareType] = useState<'city' | 'dc'>('dc');
  const [selectedCompareItems, setSelectedCompareItems] = useState<string[]>([]);

  const visibleDataCenters = useMemo(() => {
    return dataCenters.filter(dc => canAccessDataCenter(dc.id));
  }, [dataCenters, canAccessDataCenter]);

  const visibleCities = useMemo(() => {
    const dcCityIds = new Set(visibleDataCenters.map(dc => dc.city));
    return cities.filter(c => dcCityIds.has(c.id));
  }, [cities, visibleDataCenters]);

  const calculateStats = (dataCenters: any[]) => {
    const onlineDCs = dataCenters.filter(dc => dc.status === 'online');
    
    const totalRacks = onlineDCs.reduce((sum, dc) => sum + dc.totalRacks, 0);
    const totalPower = onlineDCs.reduce((sum, dc) => sum + dc.totalPower, 0);
    
    let totalPUE = 0;
    let totalCarbon = 0;
    
    onlineDCs.forEach(dc => {
      const m = metrics[dc.id] || currentMetrics[dc.id];
      if (m) {
        totalPUE += m.pue;
        totalCarbon += m.carbonEmission;
      } else {
        totalPUE += dc.designPUE + (Math.random() * 0.1 - 0.05);
        totalCarbon += dc.totalPower * 24 * 0.5839 / 1000;
      }
    });
    
    if (totalCarbon === 0 && visibleCities.length > 0) {
      const visibleCityIds = new Set(onlineDCs.map(dc => dc.city));
      totalCarbon = visibleCities
        .filter(c => visibleCityIds.has(c.id))
        .reduce((sum, c) => sum + c.totalCarbon, 0);
    }
    
    const avgPUE = onlineDCs.length > 0 ? totalPUE / onlineDCs.length : 1.35;
    
    return {
      totalDataCenters: onlineDCs.length,
      totalRacks,
      avgPUE,
      totalCarbon,
      totalPower,
    };
  };

  const stats = useMemo(() => {
    if (selectedDataCenter) {
      return calculateStats([selectedDataCenter]);
    } else if (selectedCity) {
      const dcsInCity = visibleDataCenters.filter(dc => dc.city === selectedCity.id);
      return calculateStats(dcsInCity);
    }
    return calculateStats(visibleDataCenters);
  }, [selectedDataCenter, selectedCity, visibleDataCenters, visibleCities, metrics, currentMetrics]);

  useEffect(() => {
    resetSelection();
    setSelectedCompareItems([]);
    setViewMode('normal');
  }, [currentUser?.id, resetSelection]);

  useEffect(() => {
    const visibleDCIds = visibleDataCenters.map(dc => dc.id);
    const visibleCityIds = visibleCities.map(c => c.id);
    clearInvalidSelection(visibleDCIds, visibleCityIds);
  }, [visibleDataCenters, visibleCities, clearInvalidSelection]);

  useEffect(() => {
    const loadData = async () => {
      await fetchDataCenters();
      visibleDataCenters.forEach(dc => {
        fetchCurrentMetrics(dc.id);
      });
    };
    loadData();
  }, [fetchDataCenters, fetchCurrentMetrics, visibleDataCenters.length]);

  useEffect(() => {
    if (selectedDataCenter) {
      fetchEnergyTrend(selectedDataCenter.id, 30);
      fetchCarbonTrend(selectedDataCenter.id, 30);
    } else if (selectedCity) {
      const dcsInCity = visibleDataCenters.filter(dc => dc.city === selectedCity.id);
      dcsInCity.forEach(dc => {
        fetchEnergyTrend(dc.id, 30);
        fetchCarbonTrend(dc.id, 30);
      });
    } else {
      visibleDataCenters.forEach(dc => {
        fetchEnergyTrend(dc.id, 30);
        fetchCarbonTrend(dc.id, 30);
      });
    }
  }, [selectedDataCenter, selectedCity, visibleDataCenters, fetchEnergyTrend, fetchCarbonTrend]);

  const handleCityClick = (city: any) => {
    const cityData = visibleCities.find(c => c.id === city.id);
    if (cityData) {
      selectCity(cityData);
      const dcInCity = visibleDataCenters.find(dc => dc.city === cityData.id);
      if (dcInCity) {
        selectDataCenter(dcInCity);
      }
    }
  };

  const handleDataCenterClick = (dc: any) => {
    navigate(`/data-center/${dc.id}`);
  };

  const avgPUE = useMemo(() => {
    if (selectedDataCenter) {
      const m = metrics[selectedDataCenter.id] || currentMetrics[selectedDataCenter.id];
      if (m) return m.pue;
    }
    return stats.avgPUE;
  }, [selectedDataCenter, metrics, currentMetrics, stats.avgPUE]);

  const filteredDataCenters = useMemo(() => {
    if (selectedCity) {
      return visibleDataCenters.filter(dc => dc.city === selectedCity.id);
    }
    return visibleDataCenters;
  }, [visibleDataCenters, selectedCity]);

  const visibleAlerts = useMemo(() => {
    if (selectedDataCenter) {
      return alerts.filter(a => a.dataCenterId === selectedDataCenter.id);
    }
    if (selectedCity) {
      const dcIdsInCity = filteredDataCenters.map(dc => dc.id);
      return alerts.filter(a => dcIdsInCity.includes(a.dataCenterId));
    }
    return alerts.filter(a => canAccessDataCenter(a.dataCenterId));
  }, [alerts, canAccessDataCenter, selectedDataCenter, selectedCity, filteredDataCenters]);

  const carbonRankingData = useMemo(() => {
    if (selectedCity) {
      return filteredDataCenters
        .map(dc => {
          const m = metrics[dc.id] || currentMetrics[dc.id];
          const carbon = m ? m.carbonEmission : dc.totalPower * 24 * 0.5839 / 1000;
          return {
            name: dc.name,
            value: carbon,
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    }
    return visibleCities
      .map(city => ({
        name: city.name,
        value: city.totalCarbon,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [selectedCity, visibleCities, filteredDataCenters, metrics, currentMetrics]);

  const heatMapData = useMemo(() => {
    if (selectedCity) {
      return visibleCities.filter(c => c.id === selectedCity.id);
    }
    return visibleCities;
  }, [selectedCity, visibleCities]);

  const pendingAlerts = useMemo(() => {
    return visibleAlerts.filter(a =>
      a.status === 'PENDING' || a.status === 'ACKNOWLEDGED' || a.status === 'ESCALATED'
    ).length;
  }, [visibleAlerts]);

  const getLatestData = (dcIds: string[]) => {
    let totalPower = 0;
    let totalPUE = 0;
    let count = 0;
    
    dcIds.forEach(dcId => {
      const m = metrics[dcId] || currentMetrics[dcId];
      if (m) {
        totalPower += m.totalPower;
        totalPUE += m.pue;
        count++;
      }
    });
    
    return {
      avgPUE: count > 0 ? totalPUE / count : 1.35,
      totalPower,
    };
  };

  const energyTrendData = useMemo(() => {
    let trendData: TrendPoint[] = [];
    let relevantDCs: string[] = [];
    
    if (selectedDataCenter) {
      trendData = energyTrends[selectedDataCenter.id] || [];
      relevantDCs = [selectedDataCenter.id];
    } else if (selectedCity) {
      const dcsInCity = visibleDataCenters.filter(dc => dc.city === selectedCity.id);
      relevantDCs = dcsInCity.map(dc => dc.id);
      dcsInCity.forEach(dc => {
        const dcTrend = energyTrends[dc.id] || [];
        if (trendData.length === 0) {
          trendData = dcTrend.map(t => ({ ...t }));
        } else {
          dcTrend.forEach((t, i) => {
            if (trendData[i]) {
              trendData[i].value += t.value;
            }
          });
        }
      });
    } else {
      relevantDCs = visibleDataCenters.map(dc => dc.id);
      visibleDataCenters.forEach(dc => {
        const dcTrend = energyTrends[dc.id] || [];
        if (trendData.length === 0) {
          trendData = dcTrend.map(t => ({ ...t }));
        } else {
          dcTrend.forEach((t, i) => {
            if (trendData[i]) {
              trendData[i].value += t.value;
            }
          });
        }
      });
    }
    
    const latest = getLatestData(relevantDCs);
    const now = Date.now();
    const result = trendData.map(t => ({
      timestamp: t.timestamp,
      value: t.value,
    }));
    
    if (result.length > 0 && latest.totalPower > 0) {
      const lastPoint = result[result.length - 1];
      const timeDiff = now - lastPoint.timestamp;
      
      if (timeDiff < 5 * 60 * 1000) {
        result[result.length - 1] = {
          timestamp: now,
          value: latest.totalPower,
        };
      } else {
        result.push({
          timestamp: now,
          value: latest.totalPower,
        });
      }
    }
    
    return result;
  }, [selectedDataCenter, selectedCity, visibleDataCenters, energyTrends, metrics, currentMetrics]);

  const pueTrendData = useMemo(() => {
    let pueData: { timestamp: number; value: number }[] = [];
    let relevantDCs: string[] = [];
    
    if (selectedDataCenter) {
      const trend = energyTrends[selectedDataCenter.id] || [];
      relevantDCs = [selectedDataCenter.id];
      pueData = trend.map(t => {
        const m = metrics[selectedDataCenter.id] || currentMetrics[selectedDataCenter.id];
        return {
          timestamp: t.timestamp,
          value: m ? m.pue : (t.value / 1000 + 1.2),
        };
      });
    } else {
      const dcs = selectedCity 
        ? visibleDataCenters.filter(dc => dc.city === selectedCity.id)
        : visibleDataCenters;
      relevantDCs = dcs.map(dc => dc.id);
      
      if (dcs.length > 0) {
        const firstDCTrend = energyTrends[dcs[0].id] || [];
        pueData = firstDCTrend.map((t, i) => {
          let totalPUE = 0;
          let count = 0;
          dcs.forEach(dc => {
            const dcTrend = energyTrends[dc.id] || [];
            if (dcTrend[i]) {
              const m = metrics[dc.id] || currentMetrics[dc.id];
              totalPUE += m ? m.pue : (dcTrend[i].value / 1000 + 1.2);
              count++;
            }
          });
          return {
            timestamp: t.timestamp,
            value: count > 0 ? totalPUE / count : 1.35,
          };
        });
      }
    }
    
    const latest = getLatestData(relevantDCs);
    const now = Date.now();
    
    if (pueData.length > 0) {
      const lastPoint = pueData[pueData.length - 1];
      const timeDiff = now - lastPoint.timestamp;
      
      if (timeDiff < 5 * 60 * 1000) {
        pueData[pueData.length - 1] = {
          timestamp: now,
          value: latest.avgPUE,
        };
      } else {
        pueData.push({
          timestamp: now,
          value: latest.avgPUE,
        });
      }
    }
    
    return pueData;
  }, [selectedDataCenter, selectedCity, visibleDataCenters, energyTrends, metrics, currentMetrics]);

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
              if (city) {
                const dcsInCity = visibleDataCenters.filter(dc => dc.city === city.id);
                if (selectedDataCenter && !dcsInCity.find(dc => dc.id === selectedDataCenter.id)) {
                  selectDataCenter(dcsInCity[0] || null);
                }
              } else {
                if (selectedDataCenter) {
                  selectDataCenter(null);
                }
              }
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
              if (dc && (!selectedCity || dc.city !== selectedCity.id)) {
                const city = visibleCities.find(c => c.id === dc.city);
                selectCity(city || null);
              }
            }}
            allowClear
          >
            {(selectedCity 
              ? visibleDataCenters.filter(dc => dc.city === selectedCity.id)
              : visibleDataCenters
            ).map(dc => (
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
            title={selectedDataCenter ? selectedDataCenter.name : selectedCity ? `${selectedCity.name}机房` : '在线机房'}
            value={stats.totalDataCenters}
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
            value={stats.totalRacks}
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
            value={formatPUE(stats.avgPUE)}
            icon={<Gauge className="w-5 h-5" />}
            color={stats.avgPUE < 1.4 ? 'success' : stats.avgPUE < 1.5 ? 'warning' : 'danger'}
            trend="down"
            change={1.2}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="今日碳排放"
            value={formatCarbon(stats.totalCarbon)}
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
                {selectedCity ? `${selectedCity.name} - ` : selectedDataCenter ? `${selectedDataCenter.name} - ` : ''}能效热力图
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
              data={heatMapData}
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
              subtitle={selectedDataCenter?.name || selectedCity?.name || '平均'}
              thresholds={[1.3, 1.5, 1.7]}
              height={300}
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">总功率</p>
                <p className="text-lg font-bold text-primary font-mono">
                  {formatPower(stats.totalPower)}
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
                {selectedDataCenter ? `${selectedDataCenter.name} - ` : selectedCity ? `${selectedCity.name} - ` : ''}PUE趋势
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
              {selectedCity ? '机房碳排放排名' : '城市碳排放排名'}
            </h3>
            <BarChart
              data={carbonRankingData}
              name={selectedCity ? '碳排放(吨)' : '碳排放(吨)'}
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
            {selectedCity ? `${selectedCity.name} - ` : ''}机房列表
          </h3>
          <span className="text-sm text-text-tertiary">
            点击机房卡片查看详情
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredDataCenters.map((dc, index) => {
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

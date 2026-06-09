import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Table,
  Tag,
  Modal,
  List,
  Statistic,
  Timeline,
  Badge,
  Tabs,
  Empty,
  message,
  Space,
  Progress,
  Alert,
} from 'antd';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Zap,
  Gauge,
  DollarSign,
  Plus,
} from 'lucide-react';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { useReportStore } from '@/store/reportStore';
import { useUserStore } from '@/store/userStore';
import { usePermission } from '@/hooks/usePermission';
import LineChart from '@/components/charts/LineChart';
import {
  formatPUE,
  formatDuration,
  formatCurrency,
  formatDateTime,
  formatDate,
  getChangeColor,
  formatChange,
  formatPercentage,
} from '@/utils/formatters';
import { HealthReport, MaintenanceTask } from '@/types';

const { Option } = Select;
const { TabPane } = Tabs;

export default function HealthReports() {
  const { dataCenters } = useDataCenterStore();
  const { reports, fetchReports, generateReport, selectReport, selectedReport, loading } = useReportStore();
  const { currentUser } = useUserStore();
  const { canAccessDataCenter, hasPermission } = usePermission();

  const [selectedDataCenterId, setSelectedDataCenterId] = useState<string>('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [generating, setGenerating] = useState(false);

  const visibleDataCenters = useMemo(() => {
    return dataCenters.filter(dc => canAccessDataCenter(dc.id));
  }, [dataCenters, canAccessDataCenter]);

  const visibleReports = useMemo(() => {
    let filtered = reports;
    if (selectedDataCenterId) {
      filtered = reports.filter(r => r.dataCenterId === selectedDataCenterId);
    }
    return filtered
      .filter(r => canAccessDataCenter(r.dataCenterId))
      .sort((a, b) => b.generatedAt - a.generatedAt);
  }, [reports, selectedDataCenterId, canAccessDataCenter]);

  useEffect(() => {
    setSelectedDataCenterId('');
    setDetailModalVisible(false);
    selectReport(null);
  }, [currentUser?.id, selectReport]);

  useEffect(() => {
    const visibleDCIds = visibleDataCenters.map(dc => dc.id);
    if (selectedDataCenterId && !visibleDCIds.includes(selectedDataCenterId)) {
      setSelectedDataCenterId('');
    }
  }, [visibleDataCenters, selectedDataCenterId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerateReport = async () => {
    if (!selectedDataCenterId) {
      message.error('请选择机房');
      return;
    }

    setGenerating(true);
    try {
      await generateReport(selectedDataCenterId);
      message.success('报告生成成功');
    } catch (error) {
      message.error('报告生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewDetail = (report: HealthReport) => {
    selectReport(report);
    setDetailModalVisible(true);
  };

  const getDataCenterName = (id: string) => {
    return dataCenters.find(dc => dc.id === id)?.name || '未知机房';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'red';
      case 'MEDIUM': return 'orange';
      default: return 'green';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '高';
      case 'MEDIUM': return '中';
      default: return '低';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'processing';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '已完成';
      case 'IN_PROGRESS': return '进行中';
      default: return '待处理';
    }
  };

  const energyCostChartData = useMemo(() => {
    if (!selectedReport) return [];
    return selectedReport.energyCostTrend.map(t => ({
      timestamp: t.timestamp,
      value: t.value,
    }));
  }, [selectedReport]);

  const columns = [
    {
      title: '报告周期',
      key: 'period',
      render: (_: any, record: HealthReport) => (
        <span className="font-medium text-text-primary">
          {record.year}年 第{record.weekNumber}周
        </span>
      ),
    },
    {
      title: '机房',
      dataIndex: 'dataCenterId',
      key: 'dataCenterId',
      render: (id: string) => getDataCenterName(id),
    },
    {
      title: '平均PUE',
      dataIndex: 'avgPUE',
      key: 'avgPUE',
      render: (val: number) => (
        <span
          className="font-mono font-semibold"
          style={{ color: val < 1.4 ? '#2ED573' : val < 1.5 ? '#FFA502' : '#FF4757' }}
        >
          {formatPUE(val)}
        </span>
      ),
    },
    {
      title: 'PUE同比',
      dataIndex: 'pueYoY',
      key: 'pueYoY',
      render: (val: number) => (
        <span className="font-mono" style={{ color: getChangeColor(val) }}>
          {val > 0 ? '+' : ''}{val.toFixed(2)}%
        </span>
      ),
    },
    {
      title: 'PUE环比',
      dataIndex: 'pueMoM',
      key: 'pueMoM',
      render: (val: number) => (
        <span className="font-mono" style={{ color: getChangeColor(val) }}>
          {val > 0 ? '+' : ''}{val.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '平均故障处理时长',
      dataIndex: 'avgFaultResolutionTime',
      key: 'avgFaultResolutionTime',
      render: (val: number) => (
        <span className="font-mono text-text-primary">
          {formatDuration(val * 60)}
        </span>
      ),
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (time: number) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: HealthReport) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          <Button type="link" size="small">
            导出
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-display">
            健康报告
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            每周自动生成能效健康报告，包含PUE分析、优化建议和维护计划
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            placeholder="选择机房"
            className="w-48"
            value={selectedDataCenterId}
            onChange={setSelectedDataCenterId}
            allowClear
          >
            {visibleDataCenters.map(dc => (
              <Option key={dc.id} value={dc.id}>
                {dc.name}
              </Option>
            ))}
          </Select>
          {hasPermission(['DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN']) && (
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              loading={generating}
              onClick={handleGenerateReport}
            >
              生成报告
            </Button>
          )}
        </div>
      </div>

      <Card className="glass-card border-border/50">
        <Tabs defaultActiveKey="all">
          <TabPane tab="全部报告" key="all">
            {visibleReports.length > 0 ? (
              <Table
                columns={columns}
                dataSource={visibleReports}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                loading={loading}
                scroll={{ x: 1000 }}
              />
            ) : (
              <Empty description="暂无报告数据" />
            )}
          </TabPane>
          <TabPane tab="报告说明" key="info">
            <div className="space-y-4">
              <Alert
                message="报告生成规则"
                description="系统每周一凌晨自动生成上一周的健康报告，包含PUE同比环比分析、故障处理时长统计、能耗成本趋势分析，并提供冷却策略优化建议和设备维护计划。"
                type="info"
                showIcon
              />
              <Row gutter={[16, 16]}>
                <Col xs={24} md={6}>
                  <Card className="bg-background-tertiary/30 border-border/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Gauge className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-semibold text-text-primary">PUE分析</span>
                    </div>
                    <p className="text-sm text-text-tertiary">
                      包含平均PUE、同比、环比数据，评估能效改善情况
                    </p>
                  </Card>
                </Col>
                <Col xs={24} md={6}>
                  <Card className="bg-background-tertiary/30 border-border/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-warning/10">
                        <Clock className="w-5 h-5 text-warning" />
                      </div>
                      <span className="font-semibold text-text-primary">故障处理</span>
                    </div>
                    <p className="text-sm text-text-tertiary">
                      统计平均故障处理时长，评估运维响应效率
                    </p>
                  </Card>
                </Col>
                <Col xs={24} md={6}>
                  <Card className="bg-background-tertiary/30 border-border/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-success/10">
                        <DollarSign className="w-5 h-5 text-success" />
                      </div>
                      <span className="font-semibold text-text-primary">能耗成本</span>
                    </div>
                    <p className="text-sm text-text-tertiary">
                      展示近7天能耗成本趋势，分析成本波动原因
                    </p>
                  </Card>
                </Col>
                <Col xs={24} md={6}>
                  <Card className="bg-background-tertiary/30 border-border/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-purple/10">
                        <Wrench className="w-5 h-5 text-purple" />
                      </div>
                      <span className="font-semibold text-text-primary">维护计划</span>
                    </div>
                    <p className="text-sm text-text-tertiary">
                      基于设备运行状态，自动生成预防性维护计划
                    </p>
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>健康报告详情</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button key="export" type="primary" icon={<Download className="w-4 h-4" />}>
            导出报告
          </Button>,
        ]}
        width={900}
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary/50">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {getDataCenterName(selectedReport.dataCenterId)}
                </h3>
                <p className="text-sm text-text-tertiary">
                  {selectedReport.year}年 第{selectedReport.weekNumber}周 · 生成于 {formatDateTime(selectedReport.generatedAt)}
                </p>
              </div>
              <Badge status="success" text="已生成" />
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card className="bg-background-tertiary/30 border-border/30">
                  <Statistic
                    title={
                      <span className="text-text-tertiary flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        平均PUE
                      </span>
                    }
                    value={selectedReport.avgPUE}
                    precision={3}
                    valueStyle={{ color: selectedReport.avgPUE < 1.4 ? '#2ED573' : selectedReport.avgPUE < 1.5 ? '#FFA502' : '#FF4757' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="bg-background-tertiary/30 border-border/30">
                  <Statistic
                    title={
                      <span className="text-text-tertiary flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        同比变化
                      </span>
                    }
                    value={selectedReport.pueYoY}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: getChangeColor(selectedReport.pueYoY) }}
                    prefix={selectedReport.pueYoY > 0 ? '+' : ''}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="bg-background-tertiary/30 border-border/30">
                  <Statistic
                    title={
                      <span className="text-text-tertiary flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        环比变化
                      </span>
                    }
                    value={selectedReport.pueMoM}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: getChangeColor(selectedReport.pueMoM) }}
                    prefix={selectedReport.pueMoM > 0 ? '+' : ''}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card className="glass-card border-border/50">
                  <h4 className="font-semibold text-text-primary mb-4">
                    能耗成本趋势
                  </h4>
                  <LineChart
                    data={energyCostChartData}
                    name="成本(元)"
                    color="#00D4FF"
                    height={220}
                    showArea
                    smooth
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card className="glass-card border-border/50">
                  <h4 className="font-semibold text-text-primary mb-4">
                    运维效率指标
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-text-tertiary">平均故障处理时长</span>
                        <span className="font-mono text-text-primary">
                          {formatDuration(selectedReport.avgFaultResolutionTime * 60)}
                        </span>
                      </div>
                      <Progress
                        percent={Math.min(100, (120 - selectedReport.avgFaultResolutionTime) / 120 * 100)}
                        strokeColor="#2ED573"
                        showInfo={false}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-text-tertiary">PUE达标率</span>
                        <span className="font-mono text-text-primary">
                          {formatPercentage(selectedReport.avgPUE < 1.4 ? 95 : selectedReport.avgPUE < 1.5 ? 80 : 60)}
                        </span>
                      </div>
                      <Progress
                        percent={selectedReport.avgPUE < 1.4 ? 95 : selectedReport.avgPUE < 1.5 ? 80 : 60}
                        strokeColor={selectedReport.avgPUE < 1.4 ? '#2ED573' : selectedReport.avgPUE < 1.5 ? '#FFA502' : '#FF4757'}
                        showInfo={false}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-text-tertiary">设备健康度</span>
                        <span className="font-mono text-text-primary">92%</span>
                      </div>
                      <Progress
                        percent={92}
                        strokeColor="#A55EEA"
                        showInfo={false}
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Card className="glass-card border-border/50">
              <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                优化建议
              </h4>
              <List
                dataSource={selectedReport.optimizationSuggestions}
                renderItem={(item: string, index) => (
                  <List.Item className="border border-border/50 rounded-lg p-4 mb-3 bg-background-secondary/50">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-text-primary">{item}</span>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            <Card className="glass-card border-border/50">
              <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple" />
                维护计划
              </h4>
              <Timeline
                items={selectedReport.maintenancePlan.map((task: MaintenanceTask) => ({
                  color: task.priority === 'HIGH' ? 'red' : task.priority === 'MEDIUM' ? 'orange' : 'green',
                  dot: task.status === 'COMPLETED' ? <CheckCircle className="w-4 h-4" /> : <Wrench className="w-4 h-4" />,
                  children: (
                    <div className="pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-text-primary">{task.description}</span>
                        <Space>
                          <Tag color={getPriorityColor(task.priority)}>
                            {getPriorityText(task.priority)}优先级
                          </Tag>
                          <Badge status={getStatusColor(task.status) as any} text={getStatusText(task.status)} />
                        </Space>
                      </div>
                      <p className="text-sm text-text-tertiary">
                        计划日期：{formatDate(task.scheduledDate)}
                      </p>
                    </div>
                  ),
                }))}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}

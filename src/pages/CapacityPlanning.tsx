import { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Upload,
  Form,
  InputNumber,
  Statistic,
  Table,
  Tag,
  Alert,
  Space,
  Modal,
  List,
  Progress,
  message,
  Tabs,
} from 'antd';
import {
  Upload as UploadIcon,
  TrendingUp,
  Zap,
  Leaf,
  AlertTriangle,
  CheckCircle,
  Server,
  Download,
  FileText,
  Lightbulb,
  Thermometer,
  Power,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { useReportStore } from '@/store/reportStore';
import { usePermission } from '@/hooks/usePermission';
import LineChart from '@/components/charts/LineChart';
import {
  formatPower,
  formatEnergy,
  formatCarbon,
  formatCurrency,
  formatPercentage,
  formatDateTime,
} from '@/utils/formatters';
import { predictEnergyConsumption, predictCarbonEmission } from '@/utils/efficiency';
import { ExpansionPlan, EnergySavingRecommendation } from '@/types';

const { Option } = Select;
const { Dragger } = Upload;
const { TabPane } = Tabs;

export default function CapacityPlanning() {
  const { dataCenters, energyTrends, fetchEnergyTrend } = useDataCenterStore();
  const { expansionPlans, createExpansionPlan, fetchExpansionPlans, selectExpansionPlan, selectedExpansionPlan } = useReportStore();
  const { canAccessDataCenter } = usePermission();

  const [form] = Form.useForm();
  const [selectedDataCenterId, setSelectedDataCenterId] = useState<string>('');
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const fileInputRef = useRef<any>(null);

  const visibleDataCenters = useMemo(() => {
    return dataCenters.filter(dc => canAccessDataCenter(dc.id));
  }, [dataCenters, canAccessDataCenter]);

  useEffect(() => {
    fetchExpansionPlans();
  }, [fetchExpansionPlans]);

  useEffect(() => {
    if (selectedDataCenterId) {
      fetchEnergyTrend(selectedDataCenterId, 90);
    }
  }, [selectedDataCenterId, fetchEnergyTrend]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          const firstRow = jsonData[0] as any;
          const rackCount = firstRow['机柜数量'] || firstRow['rackCount'] || firstRow['数量'] || 0;
          const powerPerRack = firstRow['单柜功率'] || firstRow['powerPerRack'] || firstRow['功率'] || 6000;
          const totalPower = rackCount * powerPerRack;

          setUploadedData({
            rackCount,
            powerPerRack,
            totalPower,
            rawData: jsonData,
          });

          form.setFieldsValue({
            newRacks: rackCount,
            newPower: totalPower,
          });

          message.success('Excel解析成功，已提取扩容数据');
        } else {
          message.error('Excel文件中没有数据');
        }
      } catch (error) {
        message.error('Excel解析失败，请检查文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleAnalyze = async () => {
    if (!selectedDataCenterId) {
      message.error('请选择机房');
      return;
    }

    try {
      const values = await form.validateFields();
      setAnalyzing(true);

      const plan = await createExpansionPlan(
        selectedDataCenterId,
        values.newRacks,
        values.newPower
      );

      selectExpansionPlan(plan);
      setDetailModalVisible(true);
      message.success('分析完成');
    } catch (error) {
      message.error('分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewDetail = (plan: ExpansionPlan) => {
    selectExpansionPlan(plan);
    setDetailModalVisible(true);
  };

  const energyTrend = useMemo(() => {
    if (!selectedDataCenterId) return [];
    return energyTrends[selectedDataCenterId] || [];
  }, [selectedDataCenterId, energyTrends]);

  const predictedEnergy = useMemo(() => {
    return predictEnergyConsumption(energyTrend, 90, 0.1);
  }, [energyTrend]);

  const predictedCarbon = useMemo(() => {
    return predictCarbonEmission(predictedEnergy);
  }, [predictedEnergy]);

  const predictionChartData = useMemo(() => {
    return predictedEnergy.map(p => ({
      timestamp: p.timestamp,
      value: p.value,
    }));
  }, [predictedEnergy]);

  const getDataCenterName = (id: string) => {
    return dataCenters.find(dc => dc.id === id)?.name || '未知机房';
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'SERVER_SHUTDOWN':
        return <Power className="w-5 h-5" />;
      case 'AC_TEMPERATURE_ADJUST':
        return <Thermometer className="w-5 h-5" />;
      case 'LOAD_BALANCING':
        return <Server className="w-5 h-5" />;
      case 'COOLING_OPTIMIZATION':
        return <Zap className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const columns = [
    {
      title: '机房',
      dataIndex: 'dataCenterId',
      key: 'dataCenterId',
      render: (id: string) => getDataCenterName(id),
    },
    {
      title: '新增机柜',
      dataIndex: 'newRacks',
      key: 'newRacks',
      render: (val: number) => (
        <span className="font-mono text-text-primary">{val} 个</span>
      ),
    },
    {
      title: '新增功率',
      dataIndex: 'newPower',
      key: 'newPower',
      render: (val: number) => (
        <span className="font-mono text-text-primary">{formatPower(val)}</span>
      ),
    },
    {
      title: '预测90天能耗',
      dataIndex: 'predictedEnergy90d',
      key: 'predictedEnergy90d',
      render: (val: number) => (
        <span className="font-mono text-primary">{formatEnergy(val)}</span>
      ),
    },
    {
      title: '预测90天碳排放',
      dataIndex: 'predictedCarbon90d',
      key: 'predictedCarbon90d',
      render: (val: number) => (
        <span className="font-mono text-danger">{formatCarbon(val)}</span>
      ),
    },
    {
      title: '配额状态',
      dataIndex: 'quotaExceeded',
      key: 'quotaExceeded',
      render: (exceeded: boolean) => (
        <Tag color={exceeded ? 'red' : 'green'}>
          {exceeded ? '超出配额' : '在配额内'}
        </Tag>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      render: (time: number) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ExpansionPlan) => (
        <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  const monthlyQuota = 500000;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-display">
            扩容预测
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            上传扩容计划，系统自动预测能耗与碳排放，提供节能建议
          </p>
        </div>
        <Button
          icon={<Download className="w-4 h-4" />}
          onClick={() => {
            const template = [
              { '机柜数量': 10, '单柜功率(W)': 6000, '备注': '可选' },
            ];
            const ws = XLSX.utils.json_to_sheet(template);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, '扩容计划');
            XLSX.writeFile(wb, '扩容计划模板.xlsx');
          }}
        >
          下载模板
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card className="glass-card border-border/50 h-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              上传扩容计划
            </h3>
            <Form form={form} layout="vertical">
              <Form.Item
                name="dataCenter"
                label="选择机房"
                rules={[{ required: true, message: '请选择机房' }]}
              >
                <Select
                  placeholder="选择需要扩容的机房"
                  value={selectedDataCenterId}
                  onChange={setSelectedDataCenterId}
                >
                  {visibleDataCenters.map(dc => (
                    <Option key={dc.id} value={dc.id}>
                      {dc.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="上传Excel文件">
                <Dragger
                  accept=".xlsx,.xls"
                  showUploadList={false}
                  beforeUpload={handleFileUpload}
                  className="bg-background-tertiary/30"
                >
                  <p className="ant-upload-drag-icon">
                    <UploadIcon className="w-12 h-12 text-primary mx-auto" />
                  </p>
                  <p className="ant-upload-text text-text-primary">
                    点击或拖拽文件到此处上传
                  </p>
                  <p className="ant-upload-hint text-text-tertiary text-sm">
                    支持 .xlsx, .xls 格式，需包含机柜数量和单柜功率列
                  </p>
                </Dragger>
              </Form.Item>

              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Form.Item
                    name="newRacks"
                    label="新增机柜数量"
                    rules={[{ required: true, message: '请输入机柜数量' }]}
                  >
                    <InputNumber
                      min={1}
                      placeholder="机柜数量"
                      className="w-full"
                      addonAfter="个"
                    />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item
                    name="newPower"
                    label="新增总功率"
                    rules={[{ required: true, message: '请输入功率' }]}
                  >
                    <InputNumber
                      min={1}
                      placeholder="总功率"
                      className="w-full"
                      addonAfter="W"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {uploadedData && (
                <Alert
                  message="数据已提取"
                  description={
                    <div>
                      <p>机柜数量：{uploadedData.rackCount} 个</p>
                      <p>单柜功率：{formatPower(uploadedData.powerPerRack)}</p>
                      <p>总功率：{formatPower(uploadedData.totalPower)}</p>
                    </div>
                  }
                  type="success"
                  showIcon
                  className="mb-4"
                />
              )}

              <Button
                type="primary"
                size="large"
                block
                loading={analyzing}
                onClick={handleAnalyze}
                icon={<TrendingUp className="w-4 h-4" />}
                className="h-12 bg-gradient-to-r from-primary to-primary-light border-none hover:opacity-90"
              >
                开始分析预测
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="glass-card border-border/50 h-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              能耗预测（未来90天）
            </h3>
            {predictedEnergy.length > 0 ? (
              <>
                <LineChart
                  data={predictionChartData}
                  name="预测能耗(kWh)"
                  color="#A55EEA"
                  height={250}
                  showArea
                  smooth
                />
                <Row gutter={[16, 16]} className="mt-4">
                  <Col xs={12}>
                    <Statistic
                      title={
                        <span className="text-text-tertiary flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          预测总能耗
                        </span>
                      }
                      value={predictedEnergy.reduce((sum, p) => sum + p.value, 0)}
                      precision={2}
                      suffix="kWh"
                      valueStyle={{ color: '#00D4FF' }}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title={
                        <span className="text-text-tertiary flex items-center gap-2">
                          <Leaf className="w-4 h-4" />
                          预测碳排放
                        </span>
                      }
                      value={predictedCarbon.reduce((sum, p) => sum + p.value, 0)}
                      precision={2}
                      suffix="吨"
                      valueStyle={{ color: '#FF4757' }}
                    />
                  </Col>
                </Row>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-text-tertiary">
                请选择机房查看预测数据
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card className="glass-card border-border/50">
        <Tabs defaultActiveKey="history">
          <TabPane tab="历史计划" key="history">
            <Table
              columns={columns}
              dataSource={expansionPlans}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          </TabPane>
          <TabPane tab="配额说明" key="quota">
            <div className="space-y-4">
              <Alert
                message="能耗配额说明"
                description="根据集团碳中和目标，每个机房每月能耗配额为 500,000 kWh，超出配额将触发节能优化建议。"
                type="info"
                showIcon
              />
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card className="bg-background-tertiary/30 border-border/30">
                    <h4 className="font-semibold text-text-primary mb-2">月度能耗配额</h4>
                    <p className="text-3xl font-bold text-primary font-mono">
                      {formatEnergy(monthlyQuota)}
                    </p>
                    <p className="text-sm text-text-tertiary mt-1">每机房每月</p>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card className="bg-background-tertiary/30 border-border/30">
                    <h4 className="font-semibold text-text-primary mb-2">碳排放强度</h4>
                    <p className="text-3xl font-bold text-danger font-mono">
                      0.5839
                    </p>
                    <p className="text-sm text-text-tertiary mt-1">kg CO₂/kWh</p>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card className="bg-background-tertiary/30 border-border/30">
                    <h4 className="font-semibold text-text-primary mb-2">年度减排目标</h4>
                    <p className="text-3xl font-bold text-success font-mono">
                      -15%
                    </p>
                    <p className="text-sm text-text-tertiary mt-1">较上一年度</p>
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
            <span>扩容分析报告</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button key="export" type="primary">
            导出报告
          </Button>,
        ]}
        width={800}
      >
        {selectedExpansionPlan && (
          <div className="space-y-6">
            {selectedExpansionPlan.quotaExceeded && (
              <Alert
                message="预测能耗超出配额"
                description="根据分析结果，扩容后90天预测能耗将超出配额，建议采取以下节能措施。"
                type="warning"
                showIcon
                icon={<AlertTriangle className="w-5 h-5" />}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">机房</p>
                <p className="font-semibold text-text-primary">
                  {getDataCenterName(selectedExpansionPlan.dataCenterId)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">新增机柜</p>
                <p className="font-semibold text-text-primary">
                  {selectedExpansionPlan.newRacks} 个
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">新增功率</p>
                <p className="font-semibold text-text-primary">
                  {formatPower(selectedExpansionPlan.newPower)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">配额状态</p>
                <Tag color={selectedExpansionPlan.quotaExceeded ? 'red' : 'green'}>
                  {selectedExpansionPlan.quotaExceeded ? '超出配额' : '在配额内'}
                </Tag>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-text-tertiary mb-1">预测90天总能耗</p>
                <p className="text-2xl font-bold text-primary font-mono">
                  {formatEnergy(selectedExpansionPlan.predictedEnergy90d)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-danger/10 border border-danger/30">
                <p className="text-xs text-text-tertiary mb-1">预测90天碳排放</p>
                <p className="text-2xl font-bold text-danger font-mono">
                  {formatCarbon(selectedExpansionPlan.predictedCarbon90d)}
                </p>
              </div>
            </div>

            {selectedExpansionPlan.quotaExceeded && (
              <div>
                <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-warning" />
                  推荐节能措施
                </h4>
                <List
                  dataSource={selectedExpansionPlan.recommendations}
                  renderItem={(item: EnergySavingRecommendation) => (
                    <List.Item className="border border-border/50 rounded-lg p-4 mb-3 bg-background-secondary/50">
                      <List.Item.Meta
                        avatar={
                          <div className={`p-2 rounded-lg ${
                            item.priority === 'HIGH' ? 'bg-danger/10 text-danger' :
                            item.priority === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                            'bg-success/10 text-success'
                          }`}>
                            {getRecommendationIcon(item.type)}
                          </div>
                        }
                        title={
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-text-primary">
                              {item.description}
                            </span>
                            <Tag color={
                              item.priority === 'HIGH' ? 'red' :
                              item.priority === 'MEDIUM' ? 'orange' : 'green'
                            }>
                              {item.priority === 'HIGH' ? '高优先级' :
                               item.priority === 'MEDIUM' ? '中优先级' : '低优先级'}
                            </Tag>
                          </div>
                        }
                        description={
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-tertiary">预计节能量</span>
                              <span className="font-mono text-success">
                                {formatEnergy(item.estimatedEnergySaving)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-tertiary">预计碳减排</span>
                              <span className="font-mono text-primary">
                                {formatCarbon(item.estimatedCarbonSaving)}
                              </span>
                            </div>
                            <Progress
                              percent={Math.round((item.estimatedEnergySaving / (selectedExpansionPlan.newPower * 24 * 90 / 1000)) * 100)}
                              showInfo={false}
                              strokeColor={
                                item.priority === 'HIGH' ? '#FF4757' :
                                item.priority === 'MEDIUM' ? '#FFA502' : '#2ED573'
                              }
                              size="small"
                            />
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

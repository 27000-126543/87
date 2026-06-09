import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Timeline,
  Badge,
  message,
  Popconfirm,
} from 'antd';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  ChevronRight,
  Bell,
  AlertCircle,
  ArrowUp,
} from 'lucide-react';
import { useAlertStore } from '@/store/alertStore';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { useUserStore } from '@/store/userStore';
import { usePermission } from '@/hooks/usePermission';
import { Alert, AlertStatus, ApprovalStatus, AlertLevel } from '@/types';
import {
  formatDateTime,
  formatRelativeTime,
  formatDuration,
  getPUEColor,
  getTemperatureColor,
} from '@/utils/formatters';
import { ALERT_TYPE_LABELS, ALERT_STATUS_COLORS, ALERT_LEVEL_LABELS } from '@/utils/constants';

const { TextArea } = Input;
const { Option } = Select;

export default function Alerts() {
  const { id: alertId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    alerts,
    fetchAlerts,
    getFilteredAlerts,
    getStats,
    updateAlertStatus,
    escalateAlert,
    approveStep,
    assignAlert,
    selectAlert,
    selectedAlert,
    setFilterLevel,
    setFilterStatus,
    filterLevel,
    filterStatus,
  } = useAlertStore();
  const { dataCenters } = useDataCenterStore();
  const { currentUser, users } = useUserStore();
  const { canAccessDataCenter, hasPermission } = usePermission();

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [escalateModalVisible, setEscalateModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [approvalForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  const visibleAlerts = useMemo(() => {
    return getFilteredAlerts().filter(alert => canAccessDataCenter(alert.dataCenterId));
  }, [getFilteredAlerts, canAccessDataCenter]);

  useEffect(() => {
    setFilterLevel('all');
    setFilterStatus('all');
    selectAlert(null);
    setDetailModalVisible(false);
    setResolveModalVisible(false);
    setEscalateModalVisible(false);
    setApprovalModalVisible(false);
    setAssignModalVisible(false);
  }, [currentUser?.id, setFilterLevel, setFilterStatus, selectAlert]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (alertId) {
      const alert = visibleAlerts.find(a => a.id === alertId);
      if (alert) {
        selectAlert(alert);
        setDetailModalVisible(true);
      } else {
        navigate('/alerts', { replace: true });
      }
    } else {
      setDetailModalVisible(false);
    }
  }, [alertId, visibleAlerts, selectAlert, navigate]);

  const getDataCenterName = (id: string) => {
    return dataCenters.find(dc => dc.id === id)?.name || '未知机房';
  };

  const getUserName = (id?: string) => {
    if (!id) return '未分配';
    return users.find(u => u.id === id)?.name || '未知用户';
  };

  const handleViewDetail = (alert: Alert) => {
    selectAlert(alert);
    setDetailModalVisible(true);
  };

  const handleAcknowledge = (alert: Alert) => {
    updateAlertStatus(alert.id, 'ACKNOWLEDGED');
    message.success('已确认告警');
  };

  const handleResolve = (alert: Alert) => {
    form.setFieldsValue({ resolution: '' });
    selectAlert(alert);
    setResolveModalVisible(true);
  };

  const handleEscalate = (alert: Alert) => {
    selectAlert(alert);
    setEscalateModalVisible(true);
  };

  const handleAssign = (alert: Alert) => {
    assignForm.setFieldsValue({ userId: alert.assignee });
    selectAlert(alert);
    setAssignModalVisible(true);
  };

  const handleApproval = (alert: Alert) => {
    selectAlert(alert);
    setApprovalModalVisible(true);
  };

  const handleConfirmResolve = () => {
    form.validateFields().then(values => {
      if (selectedAlert) {
        updateAlertStatus(selectedAlert.id, 'RESOLVED', values.resolution);
        message.success('告警已解决');
        setResolveModalVisible(false);
        form.resetFields();
      }
    });
  };

  const handleConfirmEscalate = () => {
    if (selectedAlert) {
      escalateAlert(selectedAlert.id);
      message.success('告警已升级，启动三级审批流程');
      setEscalateModalVisible(false);
    }
  };

  const handleConfirmAssign = () => {
    assignForm.validateFields().then(values => {
      if (selectedAlert) {
        assignAlert(selectedAlert.id, values.userId);
        message.success('告警已分配');
        setAssignModalVisible(false);
      }
    });
  };

  const handleApproveStep = (stepId: string, status: ApprovalStatus) => {
    approvalForm.validateFields().then(values => {
      if (selectedAlert && currentUser) {
        approveStep(selectedAlert.id, stepId, status, values.comment, currentUser.id);
        message.success(status === 'APPROVED' ? '已批准' : '已拒绝');
        approvalForm.resetFields();
      }
    });
  };

  const canApproveStep = (step: any) => {
    if (!currentUser || !selectedAlert) return false;
    if (step.status !== 'PENDING') return false;

    const roleMap: Record<string, string[]> = {
      'ENGINEER': ['ENGINEER'],
      'MANAGER': ['DC_MANAGER', 'REGION_MANAGER'],
      'CTO': ['GROUP_ADMIN'],
    };

    return roleMap[step.role]?.includes(currentUser.role) || false;
  };

  const columns = [
    {
      title: '告警级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: AlertLevel) => (
        <Tag color={level === 2 ? 'red' : 'orange'}>
          {ALERT_LEVEL_LABELS[level]}
        </Tag>
      ),
    },
    {
      title: '告警类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: string) => (
        <span className="text-text-primary">{ALERT_TYPE_LABELS[type as keyof typeof ALERT_TYPE_LABELS] || type}</span>
      ),
    },
    {
      title: '机房',
      dataIndex: 'dataCenterId',
      key: 'dataCenterId',
      render: (id: string) => (
        <span className="text-text-secondary">{getDataCenterName(id)}</span>
      ),
    },
    {
      title: '当前值/阈值',
      key: 'value',
      render: (_: any, record: Alert) => (
        <span className="font-mono">
          <span style={{ color: record.type === 'PUE_EXCEEDED' ? getPUEColor(record.currentValue) : getTemperatureColor(record.currentValue) }}>
            {record.currentValue.toFixed(2)}
          </span>
          <span className="text-text-tertiary"> / {record.threshold}</span>
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AlertStatus) => (
        <Tag color={ALERT_STATUS_COLORS[status as keyof typeof ALERT_STATUS_COLORS]}>
          {status === 'PENDING' && '待处理'}
          {status === 'ACKNOWLEDGED' && '已确认'}
          {status === 'PROCESSING' && '处理中'}
          {status === 'ESCALATED' && '已升级'}
          {status === 'RESOLVED' && '已解决'}
          {status === 'CLOSED' && '已关闭'}
        </Tag>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (id?: string) => (
        <span className="text-text-secondary">{getUserName(id)}</span>
      ),
    },
    {
      title: '触发时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: number) => (
        <span className="text-text-tertiary text-sm">{formatRelativeTime(time)}</span>
      ),
    },
    {
      title: '持续时间',
      key: 'duration',
      render: (_: any, record: Alert) => {
        const duration = (record.resolutionTime || Date.now()) - record.startTime;
        return (
          <span className="font-mono text-text-secondary">
            {formatDuration(duration / 1000)}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Alert) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <Button type="link" size="small" onClick={() => handleAcknowledge(record)}>
              确认
            </Button>
          )}
          {(record.status === 'ACKNOWLEDGED' || record.status === 'PROCESSING') && (
            <Button type="link" size="small" onClick={() => handleResolve(record)}>
              解决
            </Button>
          )}
          {record.status === 'PENDING' && (
            <Button type="link" size="small" danger onClick={() => handleEscalate(record)}>
              升级
            </Button>
          )}
          {record.status === 'ESCALATED' && record.approvalFlow && hasPermission(['DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN']) && (
            <Button type="link" size="small" onClick={() => handleApproval(record)}>
              审批
            </Button>
          )}
          {hasPermission(['DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN']) && (
            <Button type="link" size="small" onClick={() => handleAssign(record)}>
              分配
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const pendingCount = visibleAlerts.filter(a => a.status === 'PENDING').length;
  const processingCount = visibleAlerts.filter(a => a.status === 'ACKNOWLEDGED' || a.status === 'PROCESSING').length;
  const escalatedCount = visibleAlerts.filter(a => a.status === 'ESCALATED').length;
  const resolvedCount = visibleAlerts.filter(a => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-display">
            预警中心
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            监控并处理所有数据中心的告警事件
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            placeholder="告警级别"
            className="w-32"
            value={filterLevel === 'all' ? undefined : filterLevel}
            onChange={(val) => setFilterLevel(val || 'all')}
            allowClear
          >
            <Option value={1}>一级预警</Option>
            <Option value={2}>二级预警</Option>
          </Select>
          <Select
            placeholder="告警状态"
            className="w-32"
            value={filterStatus === 'all' ? undefined : filterStatus}
            onChange={(val) => setFilterStatus(val || 'all')}
            allowClear
          >
            <Option value="PENDING">待处理</Option>
            <Option value="ACKNOWLEDGED">已确认</Option>
            <Option value="PROCESSING">处理中</Option>
            <Option value="ESCALATED">已升级</Option>
            <Option value="RESOLVED">已解决</Option>
          </Select>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card className="glass-card border-border/50">
            <Statistic
              title={<span className="text-text-tertiary">待处理告警</span>}
              value={pendingCount}
              prefix={<AlertTriangle className="w-5 h-5 text-warning" />}
              valueStyle={{ color: '#FFA502' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="glass-card border-border/50">
            <Statistic
              title={<span className="text-text-tertiary">处理中</span>}
              value={processingCount}
              prefix={<Clock className="w-5 h-5 text-primary" />}
              valueStyle={{ color: '#00D4FF' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="glass-card border-border/50">
            <Statistic
              title={<span className="text-text-tertiary">已升级</span>}
              value={escalatedCount}
              prefix={<ArrowUp className="w-5 h-5 text-danger" />}
              valueStyle={{ color: '#FF4757' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="glass-card border-border/50">
            <Statistic
              title={<span className="text-text-tertiary">已解决</span>}
              value={resolvedCount}
              prefix={<CheckCircle className="w-5 h-5 text-success" />}
              valueStyle={{ color: '#2ED573' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="glass-card border-border/50">
        <Table
          columns={columns}
          dataSource={visibleAlerts}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          rowClassName={(record) =>
            record.status === 'PENDING' ? 'bg-warning/5' : ''
          }
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            <span>告警详情</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          if (alertId) {
            navigate('/alerts', { replace: true });
          }
        }}
        footer={null}
        width={700}
      >
        {selectedAlert && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">告警类型</p>
                <p className="font-semibold text-text-primary">
                  {ALERT_TYPE_LABELS[selectedAlert.type as keyof typeof ALERT_TYPE_LABELS]}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">告警级别</p>
                <Tag color={selectedAlert.level === 2 ? 'red' : 'orange'}>
                  {ALERT_LEVEL_LABELS[selectedAlert.level]}
                </Tag>
              </div>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">机房</p>
                <p className="font-semibold text-text-primary">
                  {getDataCenterName(selectedAlert.dataCenterId)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">状态</p>
                <Tag color={ALERT_STATUS_COLORS[selectedAlert.status as keyof typeof ALERT_STATUS_COLORS]}>
                  {selectedAlert.status === 'PENDING' && '待处理'}
                  {selectedAlert.status === 'ACKNOWLEDGED' && '已确认'}
                  {selectedAlert.status === 'PROCESSING' && '处理中'}
                  {selectedAlert.status === 'ESCALATED' && '已升级'}
                  {selectedAlert.status === 'RESOLVED' && '已解决'}
                </Tag>
              </div>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">当前值</p>
                <p className="font-mono font-bold text-lg" style={{ color: selectedAlert.type === 'PUE_EXCEEDED' ? getPUEColor(selectedAlert.currentValue) : getTemperatureColor(selectedAlert.currentValue) }}>
                  {selectedAlert.currentValue.toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">阈值</p>
                <p className="font-mono font-semibold text-text-primary">
                  {selectedAlert.threshold}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">触发时间</p>
                <p className="font-mono text-text-primary text-sm">
                  {formatDateTime(selectedAlert.startTime)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <p className="text-xs text-text-tertiary mb-1">负责人</p>
                <p className="font-semibold text-text-primary">
                  {getUserName(selectedAlert.assignee)}
                </p>
              </div>
            </div>

            {selectedAlert.approvalFlow && (
              <div className="p-4 rounded-lg bg-background-tertiary/50">
                <h4 className="font-semibold text-text-primary mb-4">三级审批流程</h4>
                <Timeline
                  items={selectedAlert.approvalFlow.map((step, index) => ({
                    color: step.status === 'APPROVED' ? 'green' : step.status === 'REJECTED' ? 'red' : 'blue',
                    dot: step.status === 'APPROVED' ? <CheckCircle className="w-4 h-4" /> : step.status === 'REJECTED' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />,
                    children: (
                      <div>
                        <p className="font-medium text-text-primary">
                          {step.level === 1 && '第一步：运维工程师确认'}
                          {step.level === 2 && '第二步：数据中心经理复核'}
                          {step.level === 3 && '第三步：集团CTO批准'}
                        </p>
                        <p className="text-sm text-text-tertiary">
                          {getUserName(step.userId)} · {step.status === 'APPROVED' ? '已批准' : step.status === 'REJECTED' ? '已拒绝' : '待审批'}
                        </p>
                        {step.comment && (
                          <p className="text-sm text-text-secondary mt-1">
                            备注：{step.comment}
                          </p>
                        )}
                        {step.timestamp && (
                          <p className="text-xs text-text-tertiary mt-1">
                            {formatDateTime(step.timestamp)}
                          </p>
                        )}
                      </div>
                    ),
                  }))}
                />
              </div>
            )}

            {selectedAlert.resolution && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                <p className="text-xs text-text-tertiary mb-1">解决方案</p>
                <p className="text-text-primary">{selectedAlert.resolution}</p>
                {selectedAlert.resolutionTime && (
                  <p className="text-xs text-text-tertiary mt-2">
                    解决时间：{formatDateTime(selectedAlert.resolutionTime)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="升级告警"
        open={escalateModalVisible}
        onCancel={() => setEscalateModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEscalateModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="escalate"
            danger
            type="primary"
            onClick={handleConfirmEscalate}
            icon={<ArrowUp className="w-4 h-4" />}
          >
            确认升级
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-danger/10 border border-danger/30">
            <p className="text-sm text-danger font-medium">
              升级告警将启动三级审批流程：
            </p>
            <ul className="mt-2 text-sm text-text-secondary space-y-1">
              <li>• 第一步：运维工程师确认</li>
              <li>• 第二步：数据中心经理复核</li>
              <li>• 第三步：集团CTO批准</li>
            </ul>
          </div>
          <p className="text-sm text-text-tertiary">
            升级后，冷却策略调整或负载迁移需经三级审批后方可执行。
          </p>
        </div>
      </Modal>

      <Modal
        title="解决告警"
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setResolveModalVisible(false)}>
            取消
          </Button>,
          <Button key="resolve" type="primary" onClick={handleConfirmResolve}>
            确认解决
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="resolution"
            label="解决方案"
            rules={[{ required: true, message: '请输入解决方案' }]}
          >
            <TextArea rows={4} placeholder="请描述问题原因和解决方案..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配告警"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAssignModalVisible(false)}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmAssign}>
            确认分配
          </Button>,
        ]}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="userId"
            label="负责人"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select placeholder="选择运维工程师">
              {users
                .filter(u => u.role === 'ENGINEER' || u.role === 'DC_MANAGER')
                .map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.name} ({user.role === 'ENGINEER' ? '运维工程师' : '机房主管'})
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="审批流程"
        open={approvalModalVisible}
        onCancel={() => setApprovalModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedAlert?.approvalFlow && (
          <div className="space-y-6">
            <Timeline
              items={selectedAlert.approvalFlow.map((step, index) => ({
                color: step.status === 'APPROVED' ? 'green' : step.status === 'REJECTED' ? 'red' : 'blue',
                dot: step.status === 'APPROVED' ? <CheckCircle className="w-4 h-4" /> : step.status === 'REJECTED' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />,
                children: (
                  <div className="pb-4">
                    <p className="font-medium text-text-primary">
                      {step.level === 1 && '第一步：运维工程师确认'}
                      {step.level === 2 && '第二步：数据中心经理复核'}
                      {step.level === 3 && '第三步：集团CTO批准'}
                    </p>
                    <p className="text-sm text-text-tertiary mb-2">
                      {getUserName(step.userId)}
                    </p>
                    {canApproveStep(step) && (
                      <div className="mt-3 space-y-3">
                        <Form form={approvalForm}>
                          <Form.Item name="comment">
                            <TextArea rows={2} placeholder="请输入审批意见..." />
                          </Form.Item>
                        </Form>
                        <Space>
                          <Popconfirm
                            title="确认批准？"
                            onConfirm={() => handleApproveStep(step.id, 'APPROVED')}
                            okText="确认"
                            cancelText="取消"
                          >
                            <Button type="primary" size="small">
                              批准
                            </Button>
                          </Popconfirm>
                          <Popconfirm
                            title="确认拒绝？"
                            onConfirm={() => handleApproveStep(step.id, 'REJECTED')}
                            okText="确认"
                            cancelText="取消"
                          >
                            <Button danger size="small">
                              拒绝
                            </Button>
                          </Popconfirm>
                        </Space>
                      </div>
                    )}
                    {step.status !== 'PENDING' && step.comment && (
                      <p className="text-sm text-text-secondary mt-2">
                        意见：{step.comment}
                      </p>
                    )}
                    {step.timestamp && (
                      <p className="text-xs text-text-tertiary mt-1">
                        {formatDateTime(step.timestamp)}
                      </p>
                    )}
                  </div>
                ),
              }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

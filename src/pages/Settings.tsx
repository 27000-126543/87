import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Tabs,
  Space,
  message,
  Popconfirm,
  Avatar,
} from 'antd';
import {
  Settings as SettingsIcon,
  Users,
  Sliders,
  Bell,
  Plus,
  Edit2,
  Trash2,
  Save,
  UserPlus,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { User, UserRole, ThresholdConfig } from '@/types';
import { REGIONS, ROLE_LABELS } from '@/utils/constants';

const { Option } = Select;
const { TabPane } = Tabs;

export default function Settings() {
  const {
    users,
    thresholds,
    updateThresholds,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
  } = useUserStore();
  const { dataCenters } = useDataCenterStore();

  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm] = Form.useForm();
  const [thresholdsForm] = Form.useForm();

  const [savingThresholds, setSavingThresholds] = useState(false);

  useEffect(() => {
    thresholdsForm.setFieldsValue(thresholds);
  }, [thresholds, thresholdsForm]);

  const handleAddUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    userForm.setFieldsValue({
      ...user,
      dataCenterIds: user.dataCenterIds || [],
    });
    setUserModalVisible(true);
  };

  const handleDeleteUser = (user: User) => {
    deleteUser(user.id);
    message.success('用户已删除');
  };

  const handleSaveUser = async () => {
    try {
      const values = await userForm.validateFields();

      if (editingUser) {
        updateUser(editingUser.id, values);
        message.success('用户信息已更新');
      } else {
        addUser(values);
        message.success('用户创建成功');
      }

      setUserModalVisible(false);
    } catch (error) {
      // Validation error
    }
  };

  const handleSaveThresholds = async () => {
    try {
      const values = await thresholdsForm.validateFields();
      setSavingThresholds(true);

      await new Promise(resolve => setTimeout(resolve, 500));
      updateThresholds(values);

      message.success('阈值配置已保存');
    } catch (error) {
      // Validation error
    } finally {
      setSavingThresholds(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'GROUP_ADMIN': return 'red';
      case 'REGION_MANAGER': return 'orange';
      case 'DC_MANAGER': return 'blue';
      default: return 'green';
    }
  };

  const userColumns = [
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: User) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <p className="font-medium text-text-primary">{record.name}</p>
            <p className="text-xs text-text-tertiary">{record.username}</p>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={getRoleColor(role)}>
          {ROLE_LABELS[role]}
        </Tag>
      ),
    },
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
      render: (region?: string) => (
        <span className="text-text-secondary">
          {region ? REGIONS.find(r => r.value === region)?.label : '全部'}
        </span>
      ),
    },
    {
      title: '管理机房',
      dataIndex: 'dataCenterIds',
      key: 'dataCenterIds',
      render: (ids?: string[]) => {
        if (!ids || ids.length === 0) return <span className="text-text-tertiary">全部</span>;
        const names = ids.map(id => dataCenters.find(dc => dc.id === id)?.name).filter(Boolean);
        return (
          <Space wrap>
            {names.slice(0, 2).map(name => (
              <Tag key={name} color="blue">{name}</Tag>
            ))}
            {names.length > 2 && <Tag>+{names.length - 2}</Tag>}
          </Space>
        );
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <span className="text-text-secondary text-sm">{email}</span>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => (
        <span className="text-text-secondary text-sm font-mono">{phone}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => handleEditUser(record)}
            disabled={record.id === currentUser?.id}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该用户？"
            onConfirm={() => handleDeleteUser(record)}
            okText="确认"
            cancelText="取消"
            disabled={record.id === currentUser?.id}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<Trash2 className="w-4 h-4" />}
              disabled={record.id === currentUser?.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-display">
            系统设置
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            管理用户权限、告警阈值和系统配置
          </p>
        </div>
      </div>

      <Card className="glass-card border-border/50">
        <Tabs defaultActiveKey="users">
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                用户管理
              </span>
            }
            key="users"
          >
            <div className="flex justify-end mb-4">
              <Button
                type="primary"
                icon={<UserPlus className="w-4 h-4" />}
                onClick={handleAddUser}
              >
                添加用户
              </Button>
            </div>

            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          </TabPane>

          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                阈值配置
              </span>
            }
            key="thresholds"
          >
            <Form
              form={thresholdsForm}
              layout="vertical"
              className="max-w-3xl mx-auto"
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="pueWarning"
                    label="PUE 警告阈值"
                    rules={[{ required: true, message: '请输入PUE警告阈值' }]}
                  >
                    <InputNumber
                      min={1.0}
                      max={2.5}
                      step={0.01}
                      className="w-full"
                      addonAfter=""
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="pueCritical"
                    label="PUE 严重阈值"
                    rules={[{ required: true, message: '请输入PUE严重阈值' }]}
                  >
                    <InputNumber
                      min={1.0}
                      max={3.0}
                      step={0.01}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="temperatureWarning"
                    label="温度警告阈值 (°C)"
                    rules={[{ required: true, message: '请输入温度警告阈值' }]}
                  >
                    <InputNumber
                      min={15}
                      max={40}
                      step={0.5}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="temperatureCritical"
                    label="温度严重阈值 (°C)"
                    rules={[{ required: true, message: '请输入温度严重阈值' }]}
                  >
                    <InputNumber
                      min={20}
                      max={50}
                      step={0.5}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="humidityMin"
                    label="最小湿度 (%)"
                    rules={[{ required: true, message: '请输入最小湿度' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="humidityMax"
                    label="最大湿度 (%)"
                    rules={[{ required: true, message: '请输入最大湿度' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="powerLoadWarning"
                    label="功率负载警告阈值 (%)"
                    rules={[{ required: true, message: '请输入功率负载警告阈值' }]}
                  >
                    <InputNumber
                      min={50}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="powerLoadCritical"
                    label="功率负载严重阈值 (%)"
                    rules={[{ required: true, message: '请输入功率负载严重阈值' }]}
                  >
                    <InputNumber
                      min={60}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex justify-end mt-6">
                <Button
                  type="primary"
                  size="large"
                  icon={<Save className="w-4 h-4" />}
                  loading={savingThresholds}
                  onClick={handleSaveThresholds}
                >
                  保存配置
                </Button>
              </div>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                通知设置
              </span>
            }
            key="notifications"
          >
            <div className="max-w-2xl mx-auto space-y-4">
              <Card className="bg-background-tertiary/30 border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-text-primary">邮件通知</h4>
                    <p className="text-sm text-text-tertiary">告警发生时发送邮件通知</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </Card>
              <Card className="bg-background-tertiary/30 border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-text-primary">短信通知</h4>
                    <p className="text-sm text-text-tertiary">严重告警发送短信通知</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </Card>
              <Card className="bg-background-tertiary/30 border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-text-primary">钉钉/企业微信通知</h4>
                    <p className="text-sm text-text-tertiary">推送告警消息到企业IM</p>
                  </div>
                  <Switch />
                </div>
              </Card>
              <Card className="bg-background-tertiary/30 border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-text-primary">自动升级告警</h4>
                    <p className="text-sm text-text-tertiary">一级告警1小时未处理自动升级为二级</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </Card>
              <Card className="bg-background-tertiary/30 border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-text-primary">每周健康报告</h4>
                    <p className="text-sm text-text-tertiary">自动生成并发送周度健康报告</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </Card>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            {editingUser ? <Edit2 className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
            <span>{editingUser ? '编辑用户' : '添加用户'}</span>
          </div>
        }
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setUserModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveUser}>
            保存
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={userForm}
          layout="vertical"
          initialValues={{
            role: 'ENGINEER',
            region: undefined,
            dataCenterIds: [],
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="电话"
                rules={[{ required: true, message: '请输入电话' }]}
              >
                <Input placeholder="请输入电话" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="选择角色">
                  <Option value="ENGINEER">运维工程师</Option>
                  <Option value="DC_MANAGER">机房主管</Option>
                  <Option value="REGION_MANAGER">区域经理</Option>
                  <Option value="GROUP_ADMIN">集团管理员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="region"
                label="区域"
              >
                <Select placeholder="选择区域" allowClear>
                  {REGIONS.map(region => (
                    <Option key={region.value} value={region.value}>
                      {region.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="dataCenterIds"
                label="管理机房"
              >
                <Select
                  mode="multiple"
                  placeholder="选择可管理的机房（不选则为全部）"
                  allowClear
                >
                  {dataCenters.map(dc => (
                    <Option key={dc.id} value={dc.id}>
                      {dc.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

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
  History,
  Shield,
  UserCheck,
  CheckSquare,
} from 'lucide-react';
import { useAlertStore } from '@/store/alertStore';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { useUserStore } from '@/store/userStore';
import { usePermission } from '@/hooks/usePermission';
import { Alert, AlertStatus, ApprovalStatus, AlertLevel, CityData, DataCenter } from '@/types';
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

interface TimelineRecord {
  key: string;
  type: 'ACKNOWLEDGE' | 'ESCALATE' | 'ASSIGN' | 'APPROVAL' | 'RESOLVE' | 'CREATE';
  timestamp: number;
  title: string;
  description: string;
  user?: string;
  color: string;
}

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
  const { dataCenters, cities } = useDataCenterStore();
  const { currentUser, users } = useUserStore();
  const { canAccessDataCenter, hasPermission } = usePermission();

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [escalateModalVisible, setEscalateModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [alertsLoaded, setAlertsLoaded] = useState(false);
  const [form] = Form.useForm();
  const [approvalForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  const [filterDataCenter, setFilterDataCenter] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  const visibleAlerts = useMemo(() => {
    return getFilteredAlerts()
      .filter(alert => canAccessDataCenter(alert.dataCenterId))
      .filter(alert => {
        if (filterDataCenter && alert.dataCenterId !== filterDataCenter) return false;
        if (filterCity) {
          const dc = dataCenters.find(d => d.id === alert.dataCenterId);
          if (dc?.city !== filterCity) return false;
        }
        if (filterType && alert.type !== filterType) return false;
        if (filterAssignee && alert.assignee !== filterAssignee) return false;
        return true;
      });
  }, [getFilteredAlerts, canAccessDataCenter, filterDataCenter, filterCity, filterType, filterAssignee, dataCenters]);

  const accessibleDataCenters = useMemo(() => {
    return dataCenters.filter(dc => canAccessDataCenter(dc.id));
  }, [dataCenters, canAccessDataCenter]);

  const accessibleCities = useMemo(() => {
    const cityIds = new Set(accessibleDataCenters.map(dc => dc.city));
    return cities.filter(city => cityIds.has(city.id));
  }, [accessibleDataCenters, cities]);

  useEffect(() => {
    setFilterLevel('all');
    setFilterStatus('all');
    setFilterDataCenter('');
    setFilterCity('');
    setFilterType('');
    setFilterAssignee('');
    selectAlert(null);
    setDetailModalVisible(false);
    setResolveModalVisible(false);
    setEscalateModalVisible(false);
    setApprovalModalVisible(false);
    setAssignModalVisible(false);
    setAlertsLoaded(false);
  }, [currentUser?.id, setFilterLevel, setFilterStatus, selectAlert]);

  useEffect(() => {
    fetchAlerts().finally(() => {
      setAlertsLoaded(true);
    });
  }, [fetchAlerts]);

  useEffect(() => {
    if (!alertId) {
      setDetailModalVisible(false);
      return;
    }
    
    if (!alertsLoaded) {
      return;
    }
    
    const alert = visibleAlerts.find(a => a.id === alertId);
    if (alert) {
      selectAlert(alert);
      setDetailModalVisible(true);
    } else {
      navigate('/alerts', { replace: true });
    }
  }, [alertId, visibleAlerts, selectAlert, navigate, alertsLoaded]);

  const getDataCenterName = (id: string) => {
    return dataCenters.find(dc => dc.id === id)?.name || '未知机房';
  };

  const getCityName = (id: string) => {
    return cities.find(c => c.id === id)?.name || '未知城市';
  };

  const getUserName = (id?: string) => {
    if (!id) return '未分配';
    return users.find(u => u.id === id)?.name || '未知用户';
  };

  const generateTimelineRecords = (alert: Alert): TimelineRecord[] => {
    const records: TimelineRecord[] = [];

    records.push({
      key: 'create',
      type: 'CREATE',
      timestamp: alert.startTime,
      title: '告警产生',
      description: `${ALERT_TYPE_LABELS[alert.type as keyof typeof ALERT_TYPE_LABELS]} - ${ALERT_LEVEL_LABELS[alert.level]}`,
      color: '#FF4757',
    });

    if (alert.status !== 'PENDING' && alert.status !== 'ESCALATED') {
      records.push({
        key: 'acknowledge',
        type: 'ACKNOWLEDGE',
        timestamp: alert.startTime + 5 * 60 * 1000,
        title: '告警确认',
        description: '运维人员已确认收到告警，正在处理',
        user: getUserName(alert.assignee),
        color: '#00D4FF',
      });
    }

    if (alert.assignee) {
      records.push({
        key: 'assign',
        type: 'ASSIGN',
        timestamp: alert.startTime + 3 * 60 * 1000,
        title: '负责人分配',
        description: `告警已分配给 ${getUserName(alert.assignee)}`,
        color: '#A55EEA',
      });
    }

    if (alert.escalationTime) {
      records.push({
        key: 'escalate',
        type: 'ESCALATE',
        timestamp: alert.escalationTime,
        title: '告警升级',
        description: '告警已升级，启动三级审批流程',
        color: '#FF6B6B',
      });
    }

    if (alert.approvalFlow) {
      alert.approvalFlow.forEach((step, index) => {
        if (step.status !== 'PENDING' && step.timestamp) {
          records.push({
            key: `approval-${step.id}`,
            type: 'APP
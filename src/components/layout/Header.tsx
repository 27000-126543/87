import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Wifi,
  WifiOff,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { useAlertStore } from '@/store/alertStore';
import { useRealtimeStore } from '@/store/realtimeStore';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const { getStats, alerts } = useAlertStore();
  const { isConnected } = useRealtimeStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = getStats();
  const activeAlerts = alerts.filter(a => 
    a.status === 'PENDING' || a.status === 'ACKNOWLEDGED' || 
    a.status === 'PROCESSING' || a.status === 'ESCALATED'
  );

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return '总览看板';
    if (path.startsWith('/alerts')) return '预警中心';
    if (path.startsWith('/reports')) return '能效报表';
    if (path.startsWith('/capacity')) return '扩容预测';
    if (path.startsWith('/health-reports')) return '健康报告';
    if (path.startsWith('/settings')) return '系统设置';
    if (path.startsWith('/data-center')) return '机房详情';
    return '数据中心能效管理系统';
  };

  return (
    <header className="h-16 bg-background-secondary/60 backdrop-blur-xl border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          {getPageTitle()}
        </h2>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-background-tertiary/50 rounded-lg">
          <Clock className="w-4 h-4 text-text-tertiary" />
          <span className="font-mono text-sm text-text-secondary">
            {formatDateTime(currentTime.getTime())}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-background-tertiary/50 rounded-lg w-64">
          <Search className="w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="搜索机房、机柜、告警..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder-text-tertiary"
          />
        </div>

        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          isConnected ? 'bg-success/10' : 'bg-danger/10'
        )}>
          {isConnected ? (
            <Wifi className="w-4 h-4 text-success animate-pulse" />
          ) : (
            <WifiOff className="w-4 h-4 text-danger" />
          )}
          <span className={cn(
            'text-xs font-medium',
            isConnected ? 'text-success' : 'text-danger'
          )}>
            {isConnected ? '实时连接' : '连接中断'}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-background-tertiary transition-colors"
          >
            <Bell className="w-5 h-5 text-text-secondary" />
            {stats.active > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {stats.active > 9 ? '9+' : stats.active}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 bg-background-secondary border border-border rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">告警通知</h3>
                  <span className="text-xs text-text-tertiary">{activeAlerts.length} 条未处理</span>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-custom">
                  {activeAlerts.length === 0 ? (
                    <div className="p-8 text-center text-text-tertiary">
                      暂无未处理告警
                    </div>
                  ) : (
                    activeAlerts.slice(0, 5).map(alert => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          navigate(`/alerts/${alert.id}`);
                          setShowNotifications(false);
                        }}
                        className="p-4 border-b border-border hover:bg-background-tertiary/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                            alert.level === 2 ? 'bg-danger animate-pulse' : 'bg-warning animate-pulse'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {alert.type === 'PUE_EXCEEDED' && 'PUE超标告警'}
                              {alert.type === 'TEMPERATURE_HIGH' && '温度过高告警'}
                              {alert.type === 'HUMIDITY_ABNORMAL' && '湿度异常告警'}
                              {alert.type === 'POWER_OVERLOAD' && '功率过载告警'}
                            </p>
                            <p className="text-xs text-text-tertiary mt-1">
                              {alert.currentValue.toFixed(2)} / {alert.threshold}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-border">
                  <button
                    onClick={() => {
                      navigate('/alerts');
                      setShowNotifications(false);
                    }}
                    className="w-full py-2 text-sm text-primary hover:text-primary-light font-medium transition-colors"
                  >
                    查看全部告警
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    path: '/dashboard',
    label: '总览看板',
    icon: LayoutDashboard,
    roles: ['ENGINEER', 'DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN'],
  },
  {
    path: '/alerts',
    label: '预警中心',
    icon: AlertTriangle,
    roles: ['ENGINEER', 'DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN'],
    badge: true,
  },
  {
    path: '/reports',
    label: '能效报表',
    icon: BarChart3,
    roles: ['DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN'],
  },
  {
    path: '/capacity',
    label: '扩容预测',
    icon: TrendingUp,
    roles: ['DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN'],
  },
  {
    path: '/health-reports',
    label: '健康报告',
    icon: FileText,
    roles: ['ENGINEER', 'DC_MANAGER', 'REGION_MANAGER', 'GROUP_ADMIN'],
  },
  {
    path: '/settings',
    label: '系统设置',
    icon: Settings,
    roles: ['GROUP_ADMIN'],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout } = useUserStore();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();

  const visibleItems = menuItems.filter(item => hasPermission(item.roles));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="h-full bg-background-secondary/80 backdrop-blur-xl border-r border-border flex flex-col relative"
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <Zap className="w-6 h-6 text-background-primary" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-text-primary">DCMS</h1>
                <p className="text-xs text-text-tertiary">能效管理系统</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <Zap className="w-6 h-6 text-background-primary" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-background-tertiary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-custom">
        {visibleItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
              )
            }
          >
            <item.icon className={cn(
              'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110',
              collapsed && 'mx-auto'
            )} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-lg bg-background-tertiary/50 mb-3',
          collapsed && 'justify-center'
        )}>
          {currentUser?.avatar && (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full border-2 border-primary/30"
            />
          )}
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-text-primary truncate">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-text-tertiary truncate">
                  {currentUser?.role === 'GROUP_ADMIN' && '集团管理员'}
                  {currentUser?.role === 'REGION_MANAGER' && '区域经理'}
                  {currentUser?.role === 'DC_MANAGER' && '机房主管'}
                  {currentUser?.role === 'ENGINEER' && '运维工程师'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-danger/10 hover:text-danger transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-sm font-medium"
              >
                退出登录
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

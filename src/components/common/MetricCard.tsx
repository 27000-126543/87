import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'purple';
  trend?: 'up' | 'down' | 'stable';
  onClick?: () => void;
  className?: string;
}

export default function MetricCard({
  title,
  value,
  unit,
  change,
  changeLabel = '较昨日',
  icon,
  color = 'primary',
  trend,
  onClick,
  className,
}: MetricCardProps) {
  const colorClasses = {
    primary: 'text-primary border-primary/30 hover:border-primary/50 hover:shadow-primary/20',
    success: 'text-success border-success/30 hover:border-success/50 hover:shadow-success/20',
    warning: 'text-warning border-warning/30 hover:border-warning/50 hover:shadow-warning/20',
    danger: 'text-danger border-danger/30 hover:border-danger/50 hover:shadow-danger/20',
    purple: 'text-purple border-purple/30 hover:border-purple/50 hover:shadow-purple/20',
  };

  const bgColorClasses = {
    primary: 'bg-primary/10',
    success: 'bg-success/10',
    warning: 'bg-warning/10',
    danger: 'bg-danger/10',
    purple: 'bg-purple/10',
  };

  const changeColor = trend === 'down' ? 'text-success' : trend === 'up' ? 'text-danger' : 'text-text-tertiary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'glass-card-hover rounded-xl p-5 border cursor-pointer transition-all duration-300',
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-lg', bgColorClasses[color])}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn('flex items-center gap-1 text-sm font-medium', changeColor)}>
            {trend === 'up' && <ArrowUp className="w-4 h-4" />}
            {trend === 'down' && <ArrowDown className="w-4 h-4" />}
            {trend === 'stable' && <Minus className="w-4 h-4" />}
            <span>{Math.abs(change).toFixed(2)}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-text-secondary font-medium">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className={cn('font-mono text-3xl font-bold animate-number', `text-${color}`)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && <span className="text-sm text-text-tertiary font-medium">{unit}</span>}
        </div>
        {change !== undefined && (
          <p className="text-xs text-text-tertiary">{changeLabel}</p>
        )}
      </div>
    </motion.div>
  );
}

import { MetricCardProps } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const colorClasses = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200',
    icon: 'bg-blue-600',
    text: 'text-blue-900',
    subtitle: 'text-blue-700',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-green-100',
    border: 'border-green-200',
    icon: 'bg-green-600',
    text: 'text-green-900',
    subtitle: 'text-green-700',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    border: 'border-purple-200',
    icon: 'bg-purple-600',
    text: 'text-purple-900',
    subtitle: 'text-purple-700',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
    border: 'border-orange-200',
    icon: 'bg-orange-600',
    text: 'text-orange-900',
    subtitle: 'text-orange-700',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-red-100',
    border: 'border-red-200',
    icon: 'bg-red-600',
    text: 'text-red-900',
    subtitle: 'text-red-700',
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
    border: 'border-indigo-200',
    icon: 'bg-indigo-600',
    text: 'text-indigo-900',
    subtitle: 'text-indigo-700',
  },
};

export function MetricCard({ title, value, subtitle, icon, color, trend }: MetricCardProps) {
  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} rounded-xl p-6 ${classes.border} border`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`h-12 w-12 ${classes.icon} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className={`font-semibold ${classes.text} mb-1`}>{title}</h3>
        <p className={`text-2xl font-bold ${classes.text} mb-1`}>
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </p>
        {subtitle && (
          <p className={`text-sm ${classes.subtitle}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
} 
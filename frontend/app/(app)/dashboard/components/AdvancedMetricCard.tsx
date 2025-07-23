'use client';

import { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { AdvancedMetricCardProps } from '../types';

const colorClasses = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200',
    icon: 'bg-blue-600',
    text: 'text-blue-900',
    subtitle: 'text-blue-700',
    sparkline: '#3B82F6',
    hover: 'hover:from-blue-100 hover:to-blue-200',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-green-100',
    border: 'border-green-200',
    icon: 'bg-green-600',
    text: 'text-green-900',
    subtitle: 'text-green-700',
    sparkline: '#10B981',
    hover: 'hover:from-green-100 hover:to-green-200',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    border: 'border-purple-200',
    icon: 'bg-purple-600',
    text: 'text-purple-900',
    subtitle: 'text-purple-700',
    sparkline: '#8B5CF6',
    hover: 'hover:from-purple-100 hover:to-purple-200',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
    border: 'border-orange-200',
    icon: 'bg-orange-600',
    text: 'text-orange-900',
    subtitle: 'text-orange-700',
    sparkline: '#F97316',
    hover: 'hover:from-orange-100 hover:to-orange-200',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-red-100',
    border: 'border-red-200',
    icon: 'bg-red-600',
    text: 'text-red-900',
    subtitle: 'text-red-700',
    sparkline: '#EF4444',
    hover: 'hover:from-red-100 hover:to-red-200',
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
    border: 'border-indigo-200',
    icon: 'bg-indigo-600',
    text: 'text-indigo-900',
    subtitle: 'text-indigo-700',
    sparkline: '#6366F1',
    hover: 'hover:from-indigo-100 hover:to-indigo-200',
  },
};

const alertColors = {
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  error: 'bg-red-100 text-red-800 border-red-200',
};

export function AdvancedMetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  trend, 
  sparklineData,
  comparison,
  alert,
  onClick 
}: AdvancedMetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const classes = colorClasses[color];

  // Preparar dados do sparkline
  const chartData = sparklineData?.map((value, index) => ({ value, index })) || [];

  return (
    <div 
      className={`${classes.bg} ${classes.hover} rounded-xl p-6 ${classes.border} border transition-all duration-300 hover:shadow-lg hover:scale-105 ${onClick ? 'cursor-pointer' : ''} relative group`}
      onClick={onClick}
    >
      {/* Alert Badge */}
      {alert && (
        <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium border ${alertColors[alert.type]}`}>
          {alert.type === 'warning' && '⚠️'}
          {alert.type === 'success' && '✅'}
          {alert.type === 'info' && 'ℹ️'}
          {alert.type === 'error' && '❌'}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className={`h-12 w-12 ${classes.icon} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Trend Indicator */}
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

          {/* Info Tooltip */}
          {(alert || comparison) && (
            <div 
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <InformationCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
              
              {showTooltip && (
                <div className="absolute right-0 top-6 z-10 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {alert && (
                    <div className="mb-2">
                      <div className="font-medium text-gray-900">{alert.message}</div>
                    </div>
                  )}
                  {comparison && (
                    <div>
                      <div className="text-sm text-gray-600">
                        {comparison.label}: 
                        <span className={`ml-1 font-medium ${comparison.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {comparison.isPositive ? '+' : ''}{comparison.value}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <h3 className={`font-semibold ${classes.text} mb-1`}>{title}</h3>
          <p className={`text-3xl font-bold ${classes.text} mb-1`}>
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
          {subtitle && (
            <p className={`text-sm ${classes.subtitle}`}>{subtitle}</p>
          )}
        </div>

        {/* Sparkline Chart */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="h-12 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={classes.sparkline} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, stroke: classes.sparkline, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Comparison */}
        {comparison && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
            <span className="text-xs text-gray-600">{comparison.label}</span>
            <div className={`flex items-center space-x-1 text-xs font-medium ${comparison.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {comparison.isPositive ? (
                <ArrowUpIcon className="h-3 w-3" />
              ) : (
                <ArrowDownIcon className="h-3 w-3" />
              )}
              <span>{comparison.isPositive ? '+' : ''}{comparison.value}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
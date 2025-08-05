import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MetricCardProps } from '../types';

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon,
  trend = 'neutral' 
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-danger-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getChangeColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success-600';
      case 'down':
        return 'text-danger-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="metric-label">{title}</p>
          <p className="metric-value">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon()}
              <span className={`metric-change ${getChangeColor()}`}>
                {change > 0 ? '+' : ''}{change}% {changeLabel}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
            <Icon className="h-6 w-6 text-primary-600" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard; 
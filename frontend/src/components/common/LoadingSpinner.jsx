import React from 'react';
import SkeletonLoader from './SkeletonLoader';

const LoadingSpinner = ({ size = 'md', className = '', message = 'Loading...', type = 'dashboard' }) => {
  // For small inline indicators (buttons/chips)
  if (size === 'sm' || size === 'xs' || className.includes('inline')) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="w-3.5 h-3.5 rounded-full bg-blue-500/30 animate-pulse inline-block" />
        {message && message !== 'Loading...' && (
          <span className="text-xs text-slate-500">{message}</span>
        )}
      </span>
    );
  }

  // Full page / section skeleton loading (never circular spinner)
  return (
    <div className={`w-full ${className}`}>
      <SkeletonLoader type={type} />
    </div>
  );
};

export default LoadingSpinner;

import React from 'react';
import xlogoImage from '../assets/xlogoanimate.png';

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Spinning circle */}
        <div className={`absolute inset-0 rounded-full border-2 border-gray-200 border-t-primary-500 animate-spin ${sizeClasses[size]}`}></div>
        {/* Centered xlogo */}
        <img
          src={xlogoImage}
          alt="Loading..."
          className={`absolute inset-0 m-auto animate-pulse object-contain`}
          style={{
            width: '60%',
            height: '60%',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;
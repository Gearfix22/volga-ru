
import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Clean gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800" />
      
      {/* Subtle animated mesh overlay */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-blue-100/40 via-transparent to-indigo-100/40 dark:from-blue-900/20 dark:to-indigo-900/20"
          style={{
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />
        <div 
          className="absolute inset-0 bg-gradient-to-bl from-slate-100/30 via-transparent to-gray-100/30 dark:from-slate-800/30 dark:to-gray-800/30"
          style={{
            animation: 'float 16s ease-in-out infinite',
            animationDelay: '4s'
          }}
        />
      </div>
      
      {/* Minimal geometric pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)
          `,
          backgroundSize: '150px 150px, 200px 200px'
        }}
      />
      
      {/* Clean grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
};

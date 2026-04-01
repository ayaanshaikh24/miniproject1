import React from 'react';

const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 animate-pulse">
        <div className="w-full h-48 bg-neutral-800 rounded-xl mb-4"></div>
        <div className="h-6 bg-neutral-800 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-neutral-800 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-neutral-800 rounded w-1/4"></div>
      </div>
    );
  }

  if (type === 'retailer') {
    return (
      <div className="bg-neutral-900 rounded-xl p-4 flex items-center space-x-4 animate-pulse">
        <div className="w-12 h-12 bg-neutral-800 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-800 rounded w-1/4"></div>
          <div className="h-6 bg-neutral-800 rounded w-1/2"></div>
        </div>
        <div className="w-24 h-10 bg-neutral-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-neutral-800 rounded w-full"></div>
      <div className="h-4 bg-neutral-800 rounded w-5/6"></div>
      <div className="h-4 bg-neutral-800 rounded w-4/6"></div>
    </div>
  );
};

export default SkeletonLoader;

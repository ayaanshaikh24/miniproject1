import React from 'react';

const TrustScore = ({ score, size = 'md' }) => {
  const getColor = (s) => {
    if (s < 50) return 'bg-red-500';
    if (s < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = (s) => {
    if (s < 50) return 'text-red-400';
    if (s < 75) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getHeight = () => {
    if (size === 'sm') return 'h-1.5';
    if (size === 'lg') return 'h-3';
    return 'h-2';
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
        <span className="text-neutral-500">Trust Score</span>
        <span className={getTextColor(score)}>{score}/100</span>
      </div>
      <div className={`w-full ${getHeight()} bg-neutral-800 rounded-full overflow-hidden`}>
        <div 
          className={`${getHeight()} ${getColor(score)} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      {score < 50 && (
        <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wide">
          Low confidence listing
        </p>
      )}
    </div>
  );
};

export default TrustScore;

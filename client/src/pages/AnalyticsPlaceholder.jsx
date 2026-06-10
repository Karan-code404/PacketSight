import React from 'react';
import { BarChart2 } from 'lucide-react';

const AnalyticsPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <BarChart2 className="w-16 h-16 text-secondary/40 mb-4 animate-pulse" />
      <h1 className="text-2xl font-semibold text-primary mb-2">Traffic Analytics</h1>
      <p className="text-secondary text-sm max-w-md">
        Visualize endpoint performance graphs, success rate breakdown, and latency percentiles. This feature will be fully implemented in Part 3.
      </p>
    </div>
  );
};

export default AnalyticsPlaceholder;
//

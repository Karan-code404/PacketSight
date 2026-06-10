import React from 'react';
import { HeartPulse } from 'lucide-react';

const HealthPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <HeartPulse className="w-16 h-16 text-secondary/40 mb-4 animate-pulse" />
      <h1 className="text-2xl font-semibold text-primary mb-2">Health Monitor</h1>
      <p className="text-secondary text-sm max-w-md">
        Configure automated status polling and monitor uptime metrics across registered endpoints. This feature will be fully implemented in Part 4.
      </p>
    </div>
  );
};

export default HealthPlaceholder;

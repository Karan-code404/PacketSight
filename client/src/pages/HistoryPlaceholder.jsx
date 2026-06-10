import React from 'react';
import { Clock } from 'lucide-react';

const HistoryPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <Clock className="w-16 h-16 text-secondary/40 mb-4 animate-pulse" />
      <h1 className="text-2xl font-semibold text-primary mb-2">Request History</h1>
      <p className="text-secondary text-sm max-w-md">
        Monitor, search, and debug previously executed API request histories. This feature will be fully implemented in Part 2.
      </p>
    </div>
  );
};

export default HistoryPlaceholder;

"use client";

import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface SuccessAnimationProps {
  onComplete?: () => void;
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  useEffect(() => {
    // Trigger completion callback after 3 seconds
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-card p-8 rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Drill Successfully Created!</h2>
        <p className="text-muted-foreground">
          Your drill is now active and generating yield.
        </p>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-purple-600 h-2.5 rounded-full animate-progress"></div>
          </div>
          <p className="text-sm mt-2">Redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  );
}

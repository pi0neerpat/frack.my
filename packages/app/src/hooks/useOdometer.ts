import { useState, useEffect, useRef } from "react";

interface OdometerOptions {
  startValue: number;
  rate: number; // Amount to increase per second
}

export function useOdometer({ startValue, rate }: OdometerOptions) {
  const [displayValue, setDisplayValue] = useState(startValue);
  const lastUpdateTime = useRef(Date.now());
  const frameRef = useRef<number>();

  useEffect(() => {
    function updateValue() {
      const now = Date.now();
      const elapsed = now - lastUpdateTime.current;
      const increment = (rate / 1000) * elapsed; // Convert rate per second to rate per millisecond

      setDisplayValue((prev) => prev + increment);
      lastUpdateTime.current = now;

      frameRef.current = requestAnimationFrame(updateValue);
    }

    frameRef.current = requestAnimationFrame(updateValue);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [rate]);

  return displayValue;
}

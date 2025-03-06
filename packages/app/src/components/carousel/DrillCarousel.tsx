"use client";

import { motion } from "framer-motion";
import { DrillCard } from "./DrillCard";
import { NewDrillCard } from "./NewDrillCard";
import { useRef } from "react";

interface Drill {
  id: string;
  fluidId: string;
  amount: number;
  yieldRate: number;
  totalEarned: number;
  startTime: number;
  isActive: boolean;
  isExample?: boolean;
}

interface DrillCarouselProps {
  userDrills: Drill[];
  exampleDrills: Drill[];
  onShutdown: (id: string) => void;
}

export function DrillCarousel({ userDrills, exampleDrills, onShutdown }: DrillCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateDuration = (startTime: number) => {
    const diff = Date.now() - startTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}d`;
  };

  return (
    <motion.div
      ref={containerRef}
      className="w-full overflow-x-auto scrollbar-hide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex gap-6 pb-4 px-4 min-w-min">
        <div className="w-[320px] flex-shrink-0">
          <NewDrillCard />
        </div>
        
        {/* User's active drills */}
        {userDrills.map((drill) => (
          <div key={drill.id} className="w-[320px] flex-shrink-0">
            <DrillCard
              {...drill}
              duration={calculateDuration(drill.startTime)}
              onShutdown={() => onShutdown(drill.id)}
              isExample={false}
            />
          </div>
        ))}

        {/* Example drills */}
        {exampleDrills.map((drill) => (
          <div key={drill.id} className="w-[320px] flex-shrink-0">
            <DrillCard
              {...drill}
              duration={calculateDuration(drill.startTime)}
              onShutdown={() => onShutdown(drill.id)}
              isExample={true}
              isActive={false}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

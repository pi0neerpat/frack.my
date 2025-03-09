"use client";

import { motion } from "framer-motion";
import { DrillCard } from "./DrillCard";
import { NewDrillCard } from "./NewDrillCard";
import { useRef, useEffect } from "react";

interface Drill {
  id: string;
  fluidId: string;
  amount: number;
  yieldRate: number;
  totalEarned: number;
  startTime: number;
  isActive: boolean;
  isExample?: boolean;
  symbol?: string;
}

interface DrillCarouselProps {
  userDrills: Drill[];
  exampleDrills: Drill[];
  onShutdown: (id: string) => void;
}

export function DrillCarousel({
  userDrills,
  exampleDrills,
  onShutdown,
}: DrillCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Log the drill data to verify it's correct
  useEffect(() => {
    console.log("DrillCarousel received data:", {
      userDrills: userDrills.map((d) => ({
        id: d.id,
        amount: d.amount,
        symbol: d.symbol,
      })),
      exampleDrills: exampleDrills
        .slice(0, 3)
        .map((d) => ({ id: d.id, amount: d.amount, symbol: d.symbol })),
    });
  }, [userDrills, exampleDrills]);

  const calculateDuration = (startTime: number) => {
    const diff = Date.now() - startTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}d`;
  };

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
      >
        <div className="w-[320px] flex-shrink-0 snap-start">
          <NewDrillCard />
        </div>

        {/* User's active drills */}
        {userDrills.map((drill) => (
          <div key={drill.id} className="w-[320px] flex-shrink-0 snap-start">
            <DrillCard
              {...drill}
              duration={calculateDuration(drill.startTime)}
              onShutdown={() => onShutdown(drill.id)}
              isExample={false}
              symbol={drill.symbol}
            />
          </div>
        ))}

        {/* Example drills */}
        {exampleDrills.map((drill) => (
          <div key={drill.id} className="w-[320px] flex-shrink-0 snap-start">
            <DrillCard
              {...drill}
              duration={calculateDuration(drill.startTime)}
              onShutdown={() => onShutdown(drill.id)}
              isExample={true}
              isActive={false}
              symbol={drill.symbol}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

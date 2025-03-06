"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { FLUIDS } from "@/config/fluids";

export function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const assets = FLUIDS.map(fluid => fluid.symbol);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % assets.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [assets.length]);

  return (
    <div className="inline-flex flex-col items-center">
      <div className="h-[64px] w-[180px] flex items-center justify-center"> {/* Increased width */}
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-purple-500 text-center text-balance" /* Added text-balance for better text handling */
            style={{
              fontSize: assets[currentIndex].length > 4 ? '0.9em' : '1em' /* Scale text if longer than 4 chars */
            }}
          >
            {assets[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
      <div 
        className="h-1 w-[180px] bg-gradient-to-r from-purple-600 to-purple-400" /* Matched width */
        style={{ opacity: 0.8 }}
      />
    </div>
  );
}

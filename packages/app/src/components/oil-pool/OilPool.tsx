"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function OilPool() {
  const [earned, setEarned] = useState(0);
  const [flowRate, setFlowRate] = useState(125.45);

  useEffect(() => {
    const timer = setInterval(() => {
      setEarned((prev) => prev + flowRate / (30 * 24 * 60));
    }, 5000);
    return () => clearInterval(timer);
  }, [flowRate]);

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 h-[25vh]"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Wave overlay */}
      <motion.svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 400"
        preserveAspectRatio="none"
      >
        {/* Background wave */}
        <motion.path
          d="M0 200C160 160 320 140 480 160C640 180 800 240 960 240C1120 240 1280 180 1440 160C1600 140 1760 160 1920 200V400H0V200Z"
          fill="rgba(147, 51, 234, 0.15)"
          animate={{
            d: [
              "M0 200C160 160 320 140 480 160C640 180 800 240 960 240C1120 240 1280 180 1440 160C1600 140 1760 160 1920 200V400H0V200Z",
              "M0 220C160 180 320 160 480 180C640 200 800 260 960 260C1120 260 1280 200 1440 180C1600 160 1760 180 1920 220V400H0V220Z",
              "M0 200C160 160 320 140 480 160C640 180 800 240 960 240C1120 240 1280 180 1440 160C1600 140 1760 160 1920 200V400H0V200Z"
            ]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Mid wave */}
        <motion.path
          d="M0 220C160 180 320 160 480 180C640 200 800 260 960 260C1120 260 1280 200 1440 180C1600 160 1760 180 1920 220V400H0V220Z"
          fill="rgba(147, 51, 234, 0.25)"
          animate={{
            d: [
              "M0 220C160 180 320 160 480 180C640 200 800 260 960 260C1120 260 1280 200 1440 180C1600 160 1760 180 1920 220V400H0V220Z",
              "M0 200C160 160 320 140 480 160C640 180 800 240 960 240C1120 240 1280 180 1440 160C1600 140 1760 160 1920 200V400H0V200Z",
              "M0 220C160 180 320 160 480 180C640 200 800 260 960 260C1120 260 1280 200 1440 180C1600 160 1760 180 1920 220V400H0V220Z"
            ]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        {/* Top wave */}
        <motion.path
          d="M0 240C160 200 320 180 480 200C640 220 800 280 960 280C1120 280 1280 220 1440 200C1600 180 1760 200 1920 240V400H0V240Z"
          fill="rgba(147, 51, 234, 0.35)"
          animate={{
            d: [
              "M0 240C160 200 320 180 480 200C640 220 800 280 960 280C1120 280 1280 220 1440 200C1600 180 1760 200 1920 240V400H0V240Z",
              "M0 220C160 180 320 160 480 180C640 200 800 260 960 260C1120 260 1280 200 1440 180C1600 160 1760 180 1920 220V400H0V220Z",
              "M0 240C160 200 320 180 480 200C640 220 800 280 960 280C1120 280 1280 220 1440 200C1600 180 1760 200 1920 240V400H0V240Z"
            ]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />

        {/* Content container */}
        <foreignObject x="0" y="0" width="1920" height="400">
          <div className="h-full flex flex-col items-center justify-center text-white px-4">
            <motion.div 
              className="text-5xl font-bold mb-3"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ${earned.toFixed(2)} USDC
            </motion.div>
            <div className="text-xl opacity-75">
              Earning ${flowRate.toFixed(2)} USDC / month
            </div>
          </div>
        </foreignObject>
      </motion.svg>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useOdometer } from "@/hooks/useOdometer";

export function OilPool() {
  const flowRate = 125.45; // USDC per month
  const ratePerSecond = flowRate / (30 * 24 * 60 * 60); // Convert monthly rate to per second

  const displayEarned = useOdometer({
    startValue: 0,
    rate: ratePerSecond
  });

  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
      useGrouping: true,
    }).format(amount);
  }, []);

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 h-[35vh]" // Increased height
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Wave overlay */}
      <motion.svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 600" // Increased viewBox height
        preserveAspectRatio="none"
        style={{
          filter: "drop-shadow(0 -10px 20px rgba(147, 51, 234, 0.2))", // Added glow
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background wave */}
        <motion.path
          d="M0 300C320 240 640 210 960 240C1280 270 1600 240 1920 300V600H0V300Z"
          fill="rgba(147, 51, 234, 0.15)"
          filter="url(#glow)"
          animate={{
            d: [
              "M0 300C320 240 640 210 960 240C1280 270 1600 240 1920 300V600H0V300Z",
              "M0 330C320 270 640 240 960 270C1280 300 1600 270 1920 330V600H0V330Z",
              "M0 300C320 240 640 210 960 240C1280 270 1600 240 1920 300V600H0V300Z",
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Mid wave */}
        <motion.path
          d="M0 330C320 270 640 240 960 270C1280 300 1600 270 1920 330V600H0V330Z"
          fill="rgba(147, 51, 234, 0.25)"
          filter="url(#glow)"
          animate={{
            d: [
              "M0 330C320 270 640 240 960 270C1280 300 1600 270 1920 330V600H0V330Z",
              "M0 300C320 240 640 210 960 240C1280 270 1600 240 1920 300V600H0V300Z",
              "M0 330C320 270 640 240 960 270C1280 300 1600 270 1920 330V600H0V330Z",
            ],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Top wave */}
        <motion.path
          d="M0 360C320 300 640 270 960 300C1280 330 1600 300 1920 360V600H0V360Z"
          fill="rgba(147, 51, 234, 0.35)"
          filter="url(#glow)"
          animate={{
            d: [
              "M0 360C320 300 640 270 960 300C1280 330 1600 300 1920 360V600H0V360Z",
              "M0 330C320 270 640 240 960 270C1280 300 1600 270 1920 330V600H0V330Z",
              "M0 360C320 300 640 270 960 300C1280 330 1600 300 1920 360V600H0V360Z",
            ],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Content container - adjusted y and height values */}
        <foreignObject x="0" y="100" width="1920" height="500">
          <div className="h-full flex flex-col items-center justify-center text-white px-4 relative z-10 translate-y-12">
            <motion.div
              className="text-5xl font-bold mb-3 font-mono tabular-nums"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ${formatAmount(displayEarned)} USDC
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

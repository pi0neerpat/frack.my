"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function OilPool() {
  const [earned, setEarned] = useState(0);
  const [flowRate, setFlowRate] = useState(125.45);

  useEffect(() => {
    // Simulate earning updates
    const timer = setInterval(() => {
      setEarned(prev => prev + flowRate / (30 * 24 * 60)); // Monthly rate to per minute
    }, 5000);
    return () => clearInterval(timer);
  }, [flowRate]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[25vh] overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-purple-900/50 backdrop-blur-sm"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          backgroundImage: "url('/oil-texture.png')",
          backgroundSize: "200% 200%",
        }}
      >
        <div className="container mx-auto h-full flex flex-col items-center justify-center text-white">
          <motion.div 
            className="text-4xl font-bold mb-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ${earned.toFixed(2)} USDC
          </motion.div>
          <div className="text-lg opacity-75">
            Earning ${flowRate.toFixed(2)} USDC / month
          </div>
        </div>
      </motion.div>
    </div>
  );
}

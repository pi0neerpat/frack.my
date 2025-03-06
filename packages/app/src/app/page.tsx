"use client";

import { RotatingText } from "@/components/hero/RotatingText";
import { OilPool } from "@/components/oil-pool/OilPool";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <>
      <div className="min-h-[75vh] flex flex-col items-center pt-20">
        <motion.h1
          className="text-6xl font-bold text-center mb-10 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Frack My <RotatingText />
        </motion.h1>

        <motion.p
          className="text-xl text-muted-foreground text-center max-w-[600px] mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Build your drill, collect the yield, and watch your USDC flow.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Drill cards will be added here */}
          {/* For now, show the "Add Drill" card */}
        </motion.div>
      </div>

      <OilPool />
    </>
  );
}

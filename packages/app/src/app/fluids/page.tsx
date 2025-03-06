"use client";

import { FluidList } from "@/components/fluid-list/FluidList";
import { motion } from "framer-motion";

export default function FluidsPage() {
  return (
    <div className="container py-10 space-y-8">
      <div>
        <motion.h1
          className="text-4xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Available Fluids
        </motion.h1>
        <motion.p
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Select a fluid to start building your drill
        </motion.p>
      </div>

      <FluidList />
    </div>
  );
}

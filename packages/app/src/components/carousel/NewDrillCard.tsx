"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Link from "next/link";

export function NewDrillCard() {
  return (
    <Link href="/fluids">
      <Card className="h-full cursor-pointer group hover:border-purple-500/50 transition-colors">
        <CardContent className="h-full flex items-center justify-center p-6">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="p-4 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <Plus className="w-8 h-8 text-purple-500" />
            </div>
            <span className="text-lg font-medium text-purple-500">
              Create New Drill
            </span>
          </motion.div>
        </CardContent>
      </Card>
    </Link>
  );
}

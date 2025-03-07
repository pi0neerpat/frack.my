"use client";

import React from "react";
import Link from "next/link";
import { DrillList } from "@/components/drills/drill-list";

export default function DrillsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Your Drills</h1>
        <Link
          href="/fluids"
          className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-md transition-colors flex items-center"
        >
          <span className="mr-2">+</span>
          <span>New Drill</span>
        </Link>
      </div>

      <DrillList />
    </div>
  );
}

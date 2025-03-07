"use client";

import React from "react";
import { FluidList } from "@/components/fluids/fluid-list";

export default function FluidsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Available Fracking Fluids</h1>
        <p className="text-muted-foreground">
          Select a fluid to build a new drill and start earning yield
        </p>
      </div>

      <FluidList />
    </div>
  );
}

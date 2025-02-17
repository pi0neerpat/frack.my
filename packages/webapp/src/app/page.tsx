"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto py-0 px-4 sm:px-6 lg:px-8">
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-pink-500">
              Root Page - Title
            </CardTitle>
            <p className="mt-2 text-muted-foreground">
              Root Page - Description
            </p>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}

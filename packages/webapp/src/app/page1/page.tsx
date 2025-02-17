"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page1() {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto py-0 px-4 sm:px-6 lg:px-8">
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-pink-500">
              Page 1 - Title
            </CardTitle>
            <p className="mt-2 text-muted-foreground">Page 1 - Description</p>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </main>
    </div>
  );
}

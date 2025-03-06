import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";

export default function FluidsPage() {
  return (
    <PageTransition>
      <div className="py-10 space-y-10 max-w-[1024px] mx-auto">
        {" "}
        {/* Added max-width and centered */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Available Fluids</h1>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {" "}
          {/* Increased gap */}
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Fluid list will be populated from smart contracts
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

import { notFound } from "next/navigation";
import { PageTransition } from "@/components/PageTransition";

const VALID_ASSETS = ["eth", "wsteth", "reth", "btc"];

export default function FluidAssetPage({
  params,
}: {
  params: { asset: string };
}) {
  if (!VALID_ASSETS.includes(params.asset)) {
    notFound();
  }

  return (
    <PageTransition>
      <div className="py-10 space-y-10 max-w-[768px] mx-auto">
        {" "}
        {/* Added max-width and centered */}
        <h1 className="text-4xl font-bold capitalize">
          {params.asset.toUpperCase()} Fluid
        </h1>
        <div className="bg-card rounded-lg p-6">
          <p className="text-muted-foreground">
            Deposit form will be implemented here
          </p>
        </div>
      </div>
    </PageTransition>
  );
}

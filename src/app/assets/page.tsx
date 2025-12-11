import { assets } from "@/lib/data";
import { AssetClient } from "./components/client";

export default function AssetsPage() {
  const formattedAssets = assets.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    location: item.location,
    status: item.status,
    lastMaintenance: item.lastMaintenance,
  }));

  return (
    <div className="flex-1 space-y-4">
      <AssetClient data={formattedAssets} />
    </div>
  );
}

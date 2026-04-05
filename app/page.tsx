import { getDesignSystemConfig } from "@/lib/config";
import { DesignSystemView } from "@/components/design-system-view";

export default function Home() {
  const config = getDesignSystemConfig();
  return <DesignSystemView config={config} />;
}

import type { BugReportStore } from "../archive/store.js";

export function getOverview(store: BugReportStore) {
  const versions = store.getVersions();
  const analyzeResults = store.getAnalyzeResults();
  const proxyPods = store.getProxyPods();
  const istiodPods = store.getIstiodPods();
  const namespaces = store.getNamespaces();
  const clusterResources = store.getClusterResources();

  const errorCount = analyzeResults.filter((r) => r.severity === "Error").length;
  const warningCount = analyzeResults.filter((r) => r.severity === "Warning").length;
  const infoCount = analyzeResults.filter((r) => r.severity === "Info").length;

  const lines = [
    "=== Istio Mesh Overview ===",
    "",
    `Istio Version: ${versions?.clientVersion ?? "unknown"}`,
    `Control Plane: ${versions?.controlPlaneVersions.map((v) => `${v.version} (${v.revision})`).join(", ") || "unknown"}`,
    `Data Plane: ${versions?.proxyVersions.map((v) => `${v.version} (${v.count} proxies)`).join(", ") || "unknown"}`,
    "",
    `Namespaces with proxies: ${namespaces.length} (${namespaces.join(", ") || "none"})`,
    `Proxies: ${proxyPods.length} pods`,
    `Istiod: ${istiodPods.length} pods`,
    `Cluster Resources: ${clusterResources.length} objects`,
    "",
    `Analyze Results: ${errorCount} errors, ${warningCount} warnings, ${infoCount} info`,
  ];

  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}

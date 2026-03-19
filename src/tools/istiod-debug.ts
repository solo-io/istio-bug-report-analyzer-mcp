import type { BugReportStore } from "../archive/store.js";

export function getIstiodDebug(
  store: BugReportStore,
  params: { endpoint: string; namespace?: string; pod?: string },
) {
  const pods = params.namespace
    ? store.getIstiodPods(params.namespace)
    : store.getIstiodPods();

  if (pods.length === 0) {
    return { content: [{ type: "text" as const, text: "No istiod pods found in the bug report." }], isError: true };
  }

  const targetPod = params.pod
    ? pods.find((p) => p.podName === params.pod)
    : pods[0];

  if (!targetPod) {
    return { content: [{ type: "text" as const, text: `Istiod pod not found: ${params.pod}` }], isError: true };
  }

  if (!params.endpoint) {
    const endpoints = Array.from(targetPod.debugEndpoints.keys());
    return {
      content: [{
        type: "text" as const,
        text: `Available debug endpoints for ${targetPod.podName}:\n${endpoints.map((e) => `  - ${e}`).join("\n")}`,
      }],
    };
  }

  const data = targetPod.debugEndpoints.get(params.endpoint);
  if (data === undefined) {
    const available = Array.from(targetPod.debugEndpoints.keys()).join(", ");
    return {
      content: [{
        type: "text" as const,
        text: `Debug endpoint "${params.endpoint}" not found. Available: ${available}`,
      }],
    };
  }

  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

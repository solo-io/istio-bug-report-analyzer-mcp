import type { Session } from "../types.js";
import type { BugReportStore } from "../archive/store.js";
import { findIstioctl, downloadIstioctl, runBugReport } from "../cli/bootstrap.js";
import { loadBugReport } from "./load.js";

export async function collectBugReport(
  params: {
    context?: string;
    namespaces?: string;
    exclude?: string;
    istioctl_path?: string;
    istioctl_source?: string;
    istio_version?: string;
    outputDir?: string;
  },
  getStore: () => BugReportStore | null,
  setStore: (store: BugReportStore) => void,
  setSession: (session: Session) => void,
) {
  try {
    let istioctlPath = params.istioctl_path ?? await findIstioctl();
    if (!istioctlPath) {
      istioctlPath = await downloadIstioctl(
        params.istio_version,
        params.istioctl_source as "oss" | "solo" | undefined,
      );
    }

    const archivePath = await runBugReport(istioctlPath, {
      context: params.context,
      namespaces: params.namespaces?.split(",").map((n) => n.trim()),
      exclude: params.exclude?.split(",").map((n) => n.trim()),
      outputDir: params.outputDir,
    });

    return loadBugReport({ path: archivePath }, getStore, setStore, setSession);
  } catch (error) {
    return {
      content: [{ type: "text" as const, text: `Error collecting bug report: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
}

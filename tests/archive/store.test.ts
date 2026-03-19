import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMinimalArchive } from "../fixtures/create-fixture.js";
import { BugReportStore } from "../../src/archive/store.js";

describe("BugReportStore", () => {
  let tempDir: string;
  let archiveDir: string;
  let store: BugReportStore;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "store-test-"));
    archiveDir = join(tempDir, "bug-report");
    await createMinimalArchive(archiveDir);
    store = await BugReportStore.fromDirectory(archiveDir);
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("loads version info", () => {
    expect(store.getVersions()).not.toBeNull();
    expect(store.getVersions()!.clientVersion).toBe("1.29.1");
  });

  it("loads analyze results", () => {
    const results = store.getAnalyzeResults();
    expect(results.length).toBe(3);
    expect(results[0].code).toBe("IST0101");
  });

  it("lists proxy pods by namespace", () => {
    const proxies = store.getProxyPods("default");
    expect(proxies.length).toBe(1);
    expect(proxies[0].podName).toBe("test-pod-abc123");
  });

  it("returns proxy logs", () => {
    const logs = store.getProxyLogs("default", "test-pod-abc123");
    expect(logs).toContain("error");
  });

  it("returns istiod debug endpoint data", () => {
    const syncz = store.getIstiodDebug("istio-system", "istiod-abc", "syncz");
    expect(syncz).not.toBeNull();
  });

  it("returns cluster resources filtered by kind", () => {
    const namespaces = store.getClusterResources({ kind: "Namespace" });
    expect(namespaces.length).toBe(2);
  });

  it("returns raw file by relative path", async () => {
    const content = await store.getRawFile("versions");
    expect(content).toContain("1.29.1");
  });

  it("returns null for missing files", async () => {
    expect(await store.getRawFile("nonexistent")).toBeNull();
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMinimalArchive } from "../fixtures/create-fixture.js";
import { extractArchive, readArchiveDirectory } from "../../src/archive/extractor.js";

describe("readArchiveDirectory", () => {
  let tempDir: string;
  let archiveDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "bug-report-test-"));
    archiveDir = join(tempDir, "bug-report");
    await createMinimalArchive(archiveDir);
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("returns a file index with all archive entries", async () => {
    const index = await readArchiveDirectory(archiveDir);
    expect(index.rootPath).toBe(archiveDir);
    expect(index.files.length).toBeGreaterThan(10);
  });

  it("indexes files with correct relative paths", async () => {
    const index = await readArchiveDirectory(archiveDir);
    const paths = index.files.map((f) => f.relativePath);
    expect(paths).toContain("versions");
    expect(paths).toContain("cluster/k8s-resources");
    expect(paths).toContain("proxies/default/test-pod-abc123/istio-proxy.log");
    expect(paths).toContain("istio/istio-system/istiod-abc/debug/syncz");
    expect(paths).toContain("analyze/allNamespaces");
  });

  it("categorizes files by section", async () => {
    const index = await readArchiveDirectory(archiveDir);
    expect(index.sections.cluster.length).toBeGreaterThan(0);
    expect(index.sections.proxies.length).toBeGreaterThan(0);
    expect(index.sections.istio.length).toBeGreaterThan(0);
    expect(index.sections.analyze.length).toBeGreaterThan(0);
  });
});

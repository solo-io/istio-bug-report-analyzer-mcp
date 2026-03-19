import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMinimalArchive } from "../fixtures/create-fixture.js";
import { BugReportStore } from "../../src/archive/store.js";
import { DiagnosticEngine } from "../../src/diagnostics/engine.js";
import type { DiagnosticTemplate } from "../../src/types.js";

describe("DiagnosticEngine", () => {
  let store: BugReportStore;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "engine-test-"));
    const archiveDir = join(tempDir, "bug-report");
    await createMinimalArchive(archiveDir);
    store = await BugReportStore.fromDirectory(archiveDir);
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("runs a matching template and returns a finding", async () => {
    const engine = new DiagnosticEngine();
    const template: DiagnosticTemplate = {
      id: "TEST-001",
      name: "Test IST0101 Detected",
      category: "config",
      severity: "critical",
      signals: [
        { source: { type: "analyze", code: "IST0101" }, check: { op: "exists" } },
      ],
      description: "IST0101 was found",
      rootCause: "Bad config",
      impact: "Broken routing",
      remediation: [{ order: 1, description: "Fix it", effort: "low", risk: "low" }],
      references: [],
    };
    engine.addTemplate(template);
    const findings = await engine.run(store);
    expect(findings.length).toBe(1);
    expect(findings[0].templateId).toBe("TEST-001");
  });

  it("skips a template when signals don't match", async () => {
    const engine = new DiagnosticEngine();
    const template: DiagnosticTemplate = {
      id: "TEST-002",
      name: "Non-existent IST code",
      category: "config",
      severity: "warning",
      signals: [
        { source: { type: "analyze", code: "IST9999" }, check: { op: "exists" } },
      ],
      description: "Should not fire",
      rootCause: "N/A",
      impact: "N/A",
      remediation: [],
      references: [],
    };
    engine.addTemplate(template);
    const findings = await engine.run(store);
    expect(findings.length).toBe(0);
  });

  it("filters by category", async () => {
    const engine = new DiagnosticEngine();
    engine.addTemplate({
      id: "TEST-CAT-A", name: "Cat A", category: "config", severity: "info",
      signals: [{ source: { type: "analyze", code: "IST0101" }, check: { op: "exists" } }],
      description: "", rootCause: "", impact: "", remediation: [], references: [],
    });
    engine.addTemplate({
      id: "TEST-CAT-B", name: "Cat B", category: "version", severity: "info",
      signals: [{ source: { type: "version" }, check: { op: "exists" } }],
      description: "", rootCause: "", impact: "", remediation: [], references: [],
    });
    const findings = await engine.run(store, ["config"]);
    expect(findings.length).toBe(1);
    expect(findings[0].templateId).toBe("TEST-CAT-A");
  });
});

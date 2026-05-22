import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock framework-nodejs-core
vi.mock("framework-nodejs-core", () => ({
  DevFramework: {
    create: vi.fn(),
  },
}));

// Mock framework-nodejs-appconfig (side-effects only)
vi.mock("framework-nodejs-appconfig", () => ({}));

import { DevFramework } from "framework-nodejs-core";
import "framework-nodejs-appconfig";

// Simulate app.ts main function
async function startApp() {
  const framework = await DevFramework.create({});
  await framework.initAppConfig({useEnvironmentVariables: false});
  await framework.start();
}

describe("App initialization", () => {
  let frameworkMock: any;

  beforeEach(() => {
    frameworkMock = {
      initAppConfig: vi.fn().mockResolvedValue(undefined),
      start: vi.fn().mockResolvedValue(undefined),
    };
    (DevFramework.create as any).mockResolvedValue(frameworkMock);
  });

  it("should call create, initAppConfig, and start", async () => {
    await expect(startApp()).resolves.not.toThrow();

    expect(DevFramework.create).toHaveBeenCalledWith({});
    expect(frameworkMock.initAppConfig).toHaveBeenCalled();
    expect(frameworkMock.start).toHaveBeenCalled();
  });
});
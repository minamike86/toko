import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("POS delivery boundary", () => {
  const ordersRoutePath = "src/app/api/orders/route.ts";
  const cancelRoutePath = "src/app/api/orders/[id]/cancel/route.ts";
  const payCreditRoutePath = "src/app/api/orders/[id]/pay-credit/route.ts";

  it("route POS create order memakai helper delivery resmi", () => {
    const source = read(ordersRoutePath);

    expect(source).toContain(
      'from "@/shared/delivery/parse-actor-context"',
    );
    expect(source).toContain(
      'from "@/shared/delivery/map-http-error"',
    );
    expect(source).toContain("parseActorContext(");
    expect(source).toContain("mapHttpError(");
  });

  it("route POS cancel memakai helper delivery resmi", () => {
    const source = read(cancelRoutePath);

    expect(source).toContain(
      'from "@/shared/delivery/parse-actor-context"',
    );
    expect(source).toContain(
      'from "@/shared/delivery/map-http-error"',
    );
    expect(source).toContain("parseActorContext(");
    expect(source).toContain("mapHttpError(");
  });

  it("route POS pay-credit memakai helper delivery resmi", () => {
    const source = read(payCreditRoutePath);

    expect(source).toContain(
      'from "@/shared/delivery/parse-actor-context"',
    );
    expect(source).toContain(
      'from "@/shared/delivery/map-http-error"',
    );
    expect(source).toContain("parseActorContext(");
    expect(source).toContain("mapHttpError(");
  });

  it("route POS tidak boleh hardcode actor lagi", () => {
    const sources = [
      read(ordersRoutePath),
      read(cancelRoutePath),
      read(payCreditRoutePath),
    ];

    for (const source of sources) {
      expect(source).not.toContain("POS-OPERATOR-001");
      expect(source).not.toContain('role: "ADMIN"');
      expect(source).not.toContain('role: "SALES"');
      expect(source).not.toContain("SYSTEM-CANCEL-ORDER");
    }
  });

  it("route POS tidak boleh punya mapper error manual lokal", () => {
    const sources = [
      read(ordersRoutePath),
      read(cancelRoutePath),
      read(payCreditRoutePath),
    ];

    for (const source of sources) {
      expect(source).not.toContain("function mapErrorToResponse");
      expect(source).not.toContain("const response = mapErrorToResponse");
    }
  });

  it("route POS tidak boleh instantiate Prisma atau repository langsung", () => {
    const sources = [
      read(ordersRoutePath),
      read(cancelRoutePath),
      read(payCreditRoutePath),
    ];

    for (const source of sources) {
      expect(source).not.toContain("new PrismaClient(");
      expect(source).not.toMatch(/new\s+Prisma[A-Za-z]+Repository\s*\(/);
      expect(source).not.toContain("/infrastructure/");
    }
  });
});
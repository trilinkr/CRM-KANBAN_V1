import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), select: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select } }));
import { GET } from "../src/app/api/chat/images/[messageId]/route";
const params = { params: Promise.resolve({ messageId: "11111111-1111-4111-8111-111111111111" }) };
describe("private chat image delivery", () => {
  beforeEach(() => vi.resetAllMocks());
  it("requires login", async () => {
    mocks.user.mockResolvedValue(null);
    expect((await GET(new Request("https://example.test"), params)).status).toBe(401);
    expect(mocks.select).not.toHaveBeenCalled();
  });
  it("does not return images to users without a matching room membership", async () => {
    mocks.user.mockResolvedValue({ id: "member", forcePasswordChange: false });
    const query = { from: vi.fn().mockReturnThis(), innerJoin: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([]) };
    mocks.select.mockReturnValue(query);
    const result = await GET(new Request("https://example.test"), params);
    expect(result.status).toBe(404);
    expect(result.headers.get("cache-control")).toBe("private, no-store");
    expect(query.innerJoin).toHaveBeenCalledTimes(2);
  });
  it("serves an authorised image without public caching", async () => {
    mocks.user.mockResolvedValue({ id: "member", forcePasswordChange: false });
    mocks.select.mockReturnValue({ from: () => ({ innerJoin: () => ({ innerJoin: () => ({ where: () => ({ limit: async () => [{ data: Buffer.from("image") }] }) }) }) }) });
    const response = await GET(new Request("https://example.test"), params);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});

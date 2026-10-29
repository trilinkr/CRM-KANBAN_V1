import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { validateChatImage } from "../src/lib/validate-chat-image";
import { MAX_CHAT_IMAGE_BYTES } from "../src/lib/chat-image-limits";
describe("chat image validation", () => {
  it("converts a valid image to small WebP and strips metadata", async () => {
    const source = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "orange" } }).png().withMetadata().toBuffer();
    const data = await validateChatImage(new File([new Uint8Array(source)], "photo.png", { type: "image/png" }));
    const metadata = await sharp(data).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
    expect(metadata.width).toBe(1200);
    expect(data.length).toBeLessThanOrEqual(MAX_CHAT_IMAGE_BYTES);
  });
  it("rejects oversize uploads before decoding", async () => {
    await expect(validateChatImage(new File([new Uint8Array(MAX_CHAT_IMAGE_BYTES + 1)], "photo.webp"))).rejects.toThrow("350 KB");
  });
  it("rejects excessive dimensions and disguised SVG content", async () => {
    const large = await sharp({ create: { width: 1800, height: 10, channels: 3, background: "white" } }).png().toBuffer();
    await expect(validateChatImage(new File([new Uint8Array(large)], "photo.png"))).rejects.toThrow("1,600");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>';
    await expect(validateChatImage(new File([svg], "photo.jpg", { type: "image/jpeg" }))).rejects.toThrow("still JPG");
  });
});

import sharp from "sharp";
import { MAX_CHAT_IMAGE_BYTES } from "./chat-image-limits";
export async function validateChatImage(file: File) {
  if (file.size > MAX_CHAT_IMAGE_BYTES) throw new Error("The compressed image must be under 350 KB.");
  const source = Buffer.from(await file.arrayBuffer());
  const decoder = sharp(source, { limitInputPixels: 4000000, animated: false });
  const metadata = await decoder.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || !metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) throw new Error("Only still JPG, PNG, or WebP images are supported.");
  if (metadata.width > 1600 || metadata.height > 1600) throw new Error("Resize the image to 1,600 pixels or smaller.");
  const data = await decoder.rotate().webp({ quality: 75, effort: 4 }).toBuffer();
  if (data.length > MAX_CHAT_IMAGE_BYTES) throw new Error("The image is still too large. Please crop it and try again.");
  return data;
}

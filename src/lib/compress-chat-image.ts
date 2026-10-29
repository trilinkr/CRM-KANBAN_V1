import { MAX_CHAT_IMAGE_BYTES, MAX_SOURCE_IMAGE_BYTES } from "./chat-image-limits";
export async function compressChatImage(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > MAX_SOURCE_IMAGE_BYTES) throw new Error("Choose an image smaller than 20 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    for (const edge of [1600, 1280, 1024, 800]) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare this image.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.75, 0.6, 0.45]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
        if (blob?.type === "image/webp" && blob.size <= MAX_CHAT_IMAGE_BYTES) return blob;
      }
    }
    throw new Error("This image is too detailed to fit the 350 KB limit. Please crop it and try again.");
  } finally { bitmap.close(); }
}

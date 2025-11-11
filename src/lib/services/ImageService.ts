import { put } from "@vercel/blob";
import sharp from "sharp";

export class ImageService {
  private static instance: ImageService;
  private readonly TIMEOUT_DURATION = 10000; // 10 seconds
  private readonly MAX_DIMENSION = 1920;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB before processing

  private constructor() {}

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  /**
   * Download an image from an external URL, resize it, and upload to Vercel Blob storage
   * @param imageUrl - External image URL to download
   * @param userId - User ID for organizing storage
   * @returns Blob storage URL or null if operation fails
   */
  async downloadAndUploadImage(imageUrl: string, userId: string): Promise<string | null> {
    try {
      // Validate URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(imageUrl);
      } catch {
        console.error("Invalid image URL:", imageUrl);
        return null;
      }

      // Fetch the image with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_DURATION);

      let response: Response;
      try {
        response = await fetch(imageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; WishlistBot/1.0)",
            Accept: "image/*",
          },
          signal: controller.signal,
        });
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === "AbortError") {
          console.error("Image download timeout:", imageUrl);
          return null;
        }
        console.error("Failed to fetch image:", error);
        return null;
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        return null;
      }

      // Verify content type is an image
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.startsWith("image/")) {
        console.error("URL does not point to an image:", contentType);
        return null;
      }

      // Get image buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Check file size before processing
      if (buffer.length > this.MAX_FILE_SIZE) {
        console.error("Image too large:", buffer.length);
        return null;
      }

      // Process image with Sharp
      const processedBuffer = await this.resizeImage(buffer);
      if (!processedBuffer) {
        console.error("Failed to process image");
        return null;
      }

      // Determine file extension from content type or URL
      const fileExtension = this.getFileExtension(contentType, parsedUrl.pathname);

      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const filename = `wishlist-items/${userId}/${timestamp}-${randomSuffix}.${fileExtension}`;

      // Upload to Vercel Blob Storage
      const blob = await put(filename, processedBuffer, {
        access: "public",
        addRandomSuffix: false,
        contentType: contentType,
      });

      return blob.url;
    } catch (error) {
      console.error("Error in downloadAndUploadImage:", error);
      return null;
    }
  }

  /**
   * Resize image to maximum dimensions while maintaining aspect ratio
   * @param buffer - Image buffer
   * @returns Processed image buffer or null on failure
   */
  private async resizeImage(buffer: Buffer): Promise<Buffer | null> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        console.error("Could not determine image dimensions");
        return null;
      }

      // Only resize if image exceeds maximum dimensions
      const needsResize =
        metadata.width > this.MAX_DIMENSION || metadata.height > this.MAX_DIMENSION;

      if (!needsResize) {
        // Return original buffer if no resize needed
        return buffer;
      }

      // Resize with aspect ratio maintained
      const resizedBuffer = await image
        .resize(this.MAX_DIMENSION, this.MAX_DIMENSION, {
          fit: "inside", // Maintain aspect ratio, fit within dimensions
          withoutEnlargement: true, // Don't upscale smaller images
        })
        .toBuffer();

      return resizedBuffer;
    } catch (error) {
      console.error("Error resizing image:", error);
      return null;
    }
  }

  /**
   * Get appropriate file extension from content type or URL
   * @param contentType - MIME type from response header
   * @param pathname - URL pathname
   * @returns File extension
   */
  private getFileExtension(contentType: string, pathname: string): string {
    // Try to get extension from content type
    const typeMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/svg+xml": "svg",
      "image/bmp": "bmp",
    };

    if (typeMap[contentType]) {
      return typeMap[contentType];
    }

    // Fallback to extracting from URL pathname
    const match = pathname.match(/\.([a-z0-9]+)(?:\?|$)/i);
    if (match) {
      return match[1].toLowerCase();
    }

    // Default to jpg
    return "jpg";
  }
}

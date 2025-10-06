import { encode } from "blurhash";
import sharp from "sharp";

export class BlurhashService {
  private static instance: BlurhashService;

  private constructor() {}

  public static getInstance(): BlurhashService {
    if (!BlurhashService.instance) {
      BlurhashService.instance = new BlurhashService();
    }
    return BlurhashService.instance;
  }

  /**
   * Generate a blurhash from an image URL
   * @param imageUrl - The URL of the image to process
   * @param componentX - Number of horizontal components (1-9, default 4)
   * @param componentY - Number of vertical components (1-9, default 3)
   * @returns The blurhash string or null if generation fails
   */
  async generateBlurhash(imageUrl: string, componentX = 4, componentY = 3): Promise<string | null> {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error(`Failed to fetch image: ${response.statusText}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Resize image to a smaller size for faster processing
      // Blurhash doesn't need high resolution
      const image = sharp(buffer)
        .resize(32, 32, {
          fit: "inside",
        })
        .ensureAlpha()
        .raw();

      const { data, info } = await image.toBuffer({ resolveWithObject: true });

      // Generate blurhash
      const blurhash = encode(
        new Uint8ClampedArray(data),
        info.width,
        info.height,
        componentX,
        componentY
      );

      return blurhash;
    } catch (error) {
      console.error("Error generating blurhash:", error);
      return null;
    }
  }
}

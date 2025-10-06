import { BlurhashService } from "../src/lib/services/BlurhashService";

// Extract all unique image URLs from seed data
const imageUrls = [
  "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop", // LEGO Millennium Falcon
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop", // Vinyl record
  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop", // Book
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", // Person/workshop
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop", // Code review
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop", // LEGO storage
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop", // Mountain cabin
  "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop", // Keyboard
  "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=400&fit=crop", // Open source
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=400&fit=crop", // Conference
  "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop", // 3D printer
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop", // Car
  "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=400&fit=crop", // Car detailing
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop", // Arduino/electronics
  "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=400&fit=crop", // Cricut machine
  "https://images.unsplash.com/photo-1586816001966-79b736744398?w=400&h=400&fit=crop", // Yarn
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", // Air Jordan sneakers
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop", // Lightsaber
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop", // Display case
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop", // Purple blanket
  "https://images.unsplash.com/photo-1489599732645-0e4a0815b9e3?w=400&h=400&fit=crop", // Movies
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop", // Kitchen appliances
];

async function generateBlurhashes() {
  console.log("Generating blurhashes for seed data images...\n");

  const blurhashService = BlurhashService.getInstance();
  const results: Record<string, string> = {};

  for (const url of imageUrls) {
    try {
      console.log(`Processing: ${url}`);
      const blurhash = await blurhashService.generateBlurhash(url);

      if (blurhash) {
        results[url] = blurhash;
        console.log(`  ✓ Blurhash: ${blurhash}\n`);
      } else {
        console.log(`  ✗ Failed to generate blurhash\n`);
      }
    } catch (error) {
      console.error(`  ✗ Error:`, error);
    }
  }

  console.log("\n=== RESULTS ===\n");
  console.log("Copy these blurhashes into seed.ts:\n");

  for (const [url, blurhash] of Object.entries(results)) {
    const comment = url.split("photo-")[1]?.split("?")[0] || "unknown";
    console.log(`"${url}": "${blurhash}", // ${comment}`);
  }

  console.log(`\nGenerated ${Object.keys(results).length} out of ${imageUrls.length} blurhashes`);
}

generateBlurhashes()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

import { prisma } from "../src/lib/db";
import { BlurhashService } from "../src/lib/services/BlurhashService";

async function updateBlurhash() {
  console.log("Starting blurhash update for existing items...");

  // Get all items with imageUrl but no blurhash
  const items = await prisma.wishlistItem.findMany({
    where: {
      imageUrl: {
        not: null,
      },
      blurhash: null,
    },
    select: {
      id: true,
      imageUrl: true,
      name: true,
    },
  });

  console.log(`Found ${items.length} items to process`);

  const blurhashService = BlurhashService.getInstance();
  let successCount = 0;
  let failCount = 0;

  for (const item of items) {
    try {
      console.log(`Processing: ${item.name}`);

      if (!item.imageUrl) {
        continue;
      }

      const blurhash = await blurhashService.generateBlurhash(item.imageUrl);

      if (blurhash) {
        await prisma.wishlistItem.update({
          where: { id: item.id },
          data: { blurhash },
        });
        successCount++;
        console.log(`  ✓ Generated blurhash for: ${item.name}`);
      } else {
        failCount++;
        console.log(`  ✗ Failed to generate blurhash for: ${item.name}`);
      }
    } catch (error) {
      failCount++;
      console.error(`  ✗ Error processing ${item.name}:`, error);
    }
  }

  console.log("\nBlurhash update complete!");
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

updateBlurhash()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Avatar data mapping
const userAvatars: Record<string, string> = {
  "matt@example.com": "https://api.dicebear.com/7.x/big-smile/svg?seed=Matt",
  "doug@example.com": "https://api.dicebear.com/7.x/big-smile/svg?seed=Doug",
  "helen@example.com": "https://api.dicebear.com/7.x/big-smile/svg?seed=Helen",
  "tim@example.com": "https://api.dicebear.com/7.x/big-smile/svg?seed=Tim",
  "angela@example.com": "https://api.dicebear.com/7.x/big-smile/svg?seed=Angela",
  "emma@example.com": "https://api.dicebear.com/7.x/big-smile/svg?seed=Emma",
};

async function updateUserAvatars() {
  console.log("🖼️  Starting one-off update of user avatars...");

  let updatedCount = 0;
  let notFoundCount = 0;

  for (const [email, avatarUrl] of Object.entries(userAvatars)) {
    try {
      // Find the user by email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Update the user with avatar
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            image: avatarUrl,
          },
        });

        console.log(`✅ Updated avatar for: ${existingUser.name || email}`);
        updatedCount++;
      } else {
        console.log(`❌ User not found: ${email}`);
        notFoundCount++;
      }
    } catch (error) {
      console.error(`❌ Error updating avatar for ${email}:`, error);
    }
  }

  console.log(`\n📊 Avatar Update Summary:`);
  console.log(`✅ Updated: ${updatedCount} users`);
  console.log(`❌ Not found: ${notFoundCount} users`);
  console.log(`🎉 Avatar update completed!`);
}

async function main() {
  try {
    await updateUserAvatars();
  } catch (error) {
    console.error("❌ Avatar update failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

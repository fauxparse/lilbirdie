import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

type WishlistItem = {
  name: string;
  url?: string;
  price: number;
  priority: number;
};

// People data from PEOPLE.md
const people = [
  {
    name: "Matt Powell",
    email: "matt@example.com",
    birthday: new Date("1980-07-27"),
    interests: ["code", "improv theatre", "lego", "movies with explosions", "Radiohead"],
  },
  {
    name: "Doug Powell",
    email: "doug@example.com",
    birthday: new Date("1952-06-25"),
    interests: ["cars", "gadgets", "3d printing"],
  },
  {
    name: "Helen Powell",
    email: "helen@example.com",
    birthday: new Date("1954-11-02"),
    interests: ["crafting", "gluten free cooking"],
  },
  {
    name: "Tim Powell",
    email: "tim@example.com",
    birthday: new Date("1983-02-28"), // Fixed invalid date (Feb 30)
    interests: ["sneakers", "star wars", "lego"],
  },
  {
    name: "Angela Smith-Williams",
    email: "angela@example.com",
    birthday: new Date("1986-05-02"),
    interests: ["cooking", "Pinterest", "family activities"],
  },
  {
    name: "Emma Cullen",
    email: "emma@example.com",
    birthday: new Date("1989-11-06"),
    interests: ["Minions", "purple things"],
  },
] as const;

// Sample wishlist items for each person
const wishlistItems = {
  matt: {
    general: [
      {
        name: "LEGO Creator Expert Millennium Falcon",
        url: "https://www.lego.com",
        price: 849.99,
        priority: 3,
      },
      {
        name: "Radiohead - OK Computer OKNOTOK Vinyl",
        url: "https://radiohead.com",
        price: 45.0,
        priority: 2,
      },
      {
        name: "JavaScript: The Good Parts",
        url: "https://shop.oreilly.com",
        price: 29.99,
        priority: 1,
      },
      { name: "Improv Comedy Workshop Ticket", price: 85.0, priority: 2 },
    ],
    birthday: [
      { name: "Professional Code Review Session", price: 200.0, priority: 3 },
      {
        name: "Premium Lego Storage System",
        url: "https://www.lego.com",
        price: 125.0,
        priority: 2,
      },
      { name: "Improv Theatre Season Pass", price: 300.0, priority: 3 },
    ],
    private: [
      { name: "Surprise Weekend Getaway", price: 500.0, priority: 3 },
      {
        name: "Custom Mechanical Keyboard",
        url: "https://mechanicalkeyboards.com",
        price: 350.0,
        priority: 2,
      },
    ],
    public: [
      { name: "Open Source Contribution Sponsorship", price: 50.0, priority: 1 },
      { name: "Tech Conference Ticket", price: 400.0, priority: 2 },
      { name: "Programming Books Bundle", price: 150.0, priority: 1 },
    ],
  },
  doug: [
    {
      name: "Creality Ender 3 V3 SE 3D Printer",
      url: "https://www.creality.com",
      price: 199.0,
      priority: 3,
    },
    { name: "OBD2 Scanner Tool", price: 89.99, priority: 2 },
    { name: "Car Detailing Kit", price: 45.0, priority: 1 },
    { name: "Arduino Starter Kit", url: "https://www.arduino.cc", price: 75.0, priority: 2 },
  ],
  helen: [
    { name: "Cricut Explore Air 2", url: "https://cricut.com", price: 249.99, priority: 3 },
    { name: "Gluten Free Cookbook", price: 24.95, priority: 1 },
    { name: "Yarn Storage Organizer", price: 35.0, priority: 1 },
    { name: "Embroidery Floss Set", price: 28.5, priority: 2 },
  ],
  tim: [
    { name: "Air Jordan 1 Retro High OG", url: "https://nike.com", price: 170.0, priority: 3 },
    {
      name: "LEGO Star Wars Millennium Falcon",
      url: "https://lego.com",
      price: 169.99,
      priority: 2,
    },
    { name: "Star Wars Black Series Lightsaber", price: 249.99, priority: 2 },
    { name: "Sneaker Display Case", price: 89.0, priority: 1 },
  ],
  angela: {
    personal: [
      { name: "KitchenAid Stand Mixer", url: "https://kitchenaid.com", price: 379.99, priority: 3 },
      { name: "Family Photo Session", price: 350.0, priority: 2 },
      { name: "Pinterest Premium Subscription", price: 4.99, priority: 1 },
      { name: "Kids Baking Set", price: 45.0, priority: 2 },
    ],
    ihaia: [
      { name: "LEGO Ninjago Dragon Set", url: "https://lego.com", price: 89.99, priority: 3 },
      { name: "Kids Art Supplies Kit", price: 35.0, priority: 2 },
      { name: "Children's Book Series", price: 45.0, priority: 1 },
      { name: "Junior Soccer Ball", price: 25.0, priority: 1 },
    ],
    tawera: [
      { name: "Remote Control Car", price: 75.0, priority: 3 },
      { name: "Science Experiment Kit", price: 55.0, priority: 2 },
      { name: "Kids Tablet Case", price: 30.0, priority: 1 },
      { name: "Building Blocks Set", price: 40.0, priority: 2 },
    ],
    atawhai: [
      { name: "Dollhouse Furniture Set", price: 65.0, priority: 3 },
      { name: "Craft Making Kit", price: 42.0, priority: 2 },
      { name: "Kids Dress-up Costumes", price: 50.0, priority: 2 },
      { name: "Storybook Collection", price: 35.0, priority: 1 },
    ],
    mana: [
      { name: "Baby Sensory Toys", price: 45.0, priority: 3 },
      { name: "Wooden Teething Rings", price: 25.0, priority: 2 },
      { name: "Soft Play Mat", price: 75.0, priority: 2 },
      { name: "Baby Monitor", price: 120.0, priority: 1 },
    ],
  },
  emma: [
    { name: "Minions Collectible Figure Set", price: 89.99, priority: 3 },
    { name: "Purple Throw Blanket", price: 35.0, priority: 1 },
    {
      name: "Despicable Me Movie Collection",
      url: "https://movies.disney.com",
      price: 39.99,
      priority: 2,
    },
    { name: "Purple Kitchen Appliance Set", price: 125.0, priority: 2 },
  ],
} as const;

const mattWishlists = [
  {
    key: "general",
    title: "Matt's General Wishlist",
    description: "Everyday things I'd love to have",
    privacy: "FRIENDS_ONLY" as const,
    isDefault: true,
  },
  {
    key: "birthday",
    title: "Birthday Wishlist 2024",
    description: "Special items for my birthday celebration",
    privacy: "FRIENDS_ONLY" as const,
    isDefault: false,
  },
  {
    key: "private",
    title: "Private Wishlist",
    description: "Personal items - for close family only",
    privacy: "PRIVATE" as const,
    isDefault: false,
  },
  {
    key: "public",
    title: "Public Tech Wishlist",
    description: "Professional development and tech items",
    privacy: "PUBLIC" as const,
    isDefault: false,
  },
] as const;

const angelaWishlists = [
  {
    key: "personal",
    title: "Angela's Wishlist",
    description: "Things for Angela",
    privacy: "FRIENDS_ONLY" as const,
    isDefault: true,
  },
  {
    key: "ihaia",
    title: "Ihaia's Wishlist",
    description: "Gift ideas for Ihaia",
    privacy: "FRIENDS_ONLY" as const,
    isDefault: false,
  },
  {
    key: "tawera",
    title: "Tāwera's Wishlist",
    description: "Gift ideas for Tāwera",
    privacy: "FRIENDS_ONLY" as const,
    isDefault: false,
  },
  {
    key: "atawhai",
    title: "Atawhai's Wishlist",
    description: "Gift ideas for Atawhai",
    privacy: "FRIENDS_ONLY" as const,
    isDefault: false,
  },
  {
    key: "mana",
    title: "Mana's Wishlist",
    description: "Gift ideas for baby Mana",
    privacy: "FRIENDS_ONLY" as const,
    isDefault: false,
  },
] as const;

async function createUserWithPassword(userData: (typeof people)[number]): Promise<string> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`User ${userData.name} already exists, skipping user creation...`);
      return existingUser.id;
    }

    // Create user with password using Better Auth
    console.log(`Creating user with password: ${userData.name}`);
    const result = await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: "P4$$w0rd!",
        name: userData.name,
      },
    });

    // Handle auth result - success returns user/session object
    if (!result || !result.user) {
      console.error(`Failed to create user ${userData.name}`);
      throw new Error("User creation failed");
    }

    // Update the user with email verification
    const user = await prisma.user.update({
      where: { email: userData.email },
      data: {
        emailVerified: true,
      },
    });

    // Create profile with additional fields
    await prisma.profile.create({
      data: {
        userId: user.id,
        birthday: userData.birthday,
        preferredCurrency: "USD",
        theme: "system",
      },
    });

    console.log(`Created user with password: ${userData.name}`);
    return user.id;
  } catch (error) {
    console.error(`Error creating user ${userData.name}:`, error);
    throw error;
  }
}

type Wishlists = Record<string, readonly WishlistItem[]> | readonly WishlistItem[];

async function createWishlists(userId: string, userName: string, wishlists: Wishlists) {
  const firstName = userName.split(" ")[0].toLowerCase();

  try {
    // Handle Matt's multiple wishlists
    if (firstName === "matt") {
      for (const wl of mattWishlists) {
        const existingWishlist = await prisma.wishlist.findFirst({
          where: {
            ownerId: userId,
            title: wl.title,
          },
        });

        if (existingWishlist) {
          console.log(`Wishlist "${wl.title}" already exists, skipping...`);
          continue;
        }

        const wishlist = await prisma.wishlist.create({
          data: {
            title: wl.title,
            description: wl.description,
            permalink: `${firstName}-${wl.key}`,
            privacy: wl.privacy,
            isDefault: wl.isDefault,
            ownerId: userId,
          },
        });

        // Add items to wishlist
        const items = wishlists[wl.key as keyof typeof wishlists] as WishlistItem[];
        for (const item of items) {
          await prisma.wishlistItem.create({
            data: {
              name: item.name,
              url: item.url || null,
              price: item.price,
              currency: "USD",
              priority: item.priority,
              wishlistId: wishlist.id,
            },
          });
        }

        console.log(`Created ${wl.title} with ${items.length} items`);
      }
    }
    // Handle Angela's children's wishlists
    else if (firstName === "angela") {
      for (const wl of angelaWishlists) {
        const existingWishlist = await prisma.wishlist.findFirst({
          where: {
            ownerId: userId,
            title: wl.title,
          },
        });

        if (existingWishlist) {
          console.log(`Wishlist "${wl.title}" already exists, skipping...`);
          continue;
        }

        const wishlist = await prisma.wishlist.create({
          data: {
            title: wl.title,
            description: wl.description,
            permalink: `angela-${wl.key}`,
            privacy: wl.privacy,
            isDefault: wl.isDefault,
            ownerId: userId,
          },
        });

        // Add items to wishlist
        const items = wishlists[wl.key as keyof typeof wishlists] as WishlistItem[];
        for (const item of items) {
          await prisma.wishlistItem.create({
            data: {
              name: item.name,
              url: item.url || null,
              price: item.price,
              currency: "USD",
              priority: item.priority,
              wishlistId: wishlist.id,
            },
          });
        }

        console.log(`Created ${wl.title} with ${items.length} items`);
      }
    }
    // Handle everyone else's single wishlist
    else {
      const existingWishlist = await prisma.wishlist.findFirst({
        where: {
          ownerId: userId,
          isDefault: true,
        },
      });

      if (existingWishlist) {
        console.log(`Default wishlist for ${userName} already exists, skipping...`);
        return;
      }

      const wishlist = await prisma.wishlist.create({
        data: {
          title: `${userName}'s Wishlist`,
          description: `Things ${firstName} would love to receive`,
          permalink: `${firstName}-wishlist`,
          privacy: "FRIENDS_ONLY",
          isDefault: true,
          ownerId: userId,
        },
      });

      if (Array.isArray(wishlists)) {
        // Add items to wishlist (wishlists is an array for other people)
        for (const item of wishlists) {
          await prisma.wishlistItem.create({
            data: {
              name: item.name,
              url: item.url || null,
              price: item.price,
              currency: "USD",
              priority: item.priority,
              wishlistId: wishlist.id,
            },
          });
        }
      }

      console.log(`Created wishlist for ${userName} with ${wishlists.length} items`);
    }
  } catch (error) {
    console.error(`Error creating wishlists for ${userName}:`, error);
    throw error;
  }
}

async function createFriendships(userIds: { [key: string]: string }) {
  // Create family friendships (everyone is friends with everyone)
  const friendshipPairs = [
    ["matt", "doug"],
    ["matt", "helen"],
    ["matt", "tim"],
    ["matt", "angela"],
    ["matt", "emma"],
    ["doug", "helen"],
    ["doug", "tim"],
    ["doug", "angela"],
    ["doug", "emma"],
    ["helen", "tim"],
    ["helen", "angela"],
    ["helen", "emma"],
    ["tim", "angela"],
    ["tim", "emma"],
    ["angela", "emma"],
  ];

  for (const [person1, person2] of friendshipPairs) {
    try {
      // Check if friendship already exists
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: userIds[person1], friendId: userIds[person2] },
            { userId: userIds[person2], friendId: userIds[person1] },
          ],
        },
      });

      if (existingFriendship) {
        continue; // Skip if friendship already exists
      }

      // Create mutual friendship
      await prisma.friendship.createMany({
        data: [
          { userId: userIds[person1], friendId: userIds[person2] },
          { userId: userIds[person2], friendId: userIds[person1] },
        ],
      });

      console.log(`Created friendship between ${person1} and ${person2}`);
    } catch (error) {
      console.error(`Error creating friendship between ${person1} and ${person2}:`, error);
    }
  }
}

async function createPendingFriendRequests(userIds: { [key: string]: string }) {
  // Create a pending friend request from Matt to a fictional user
  try {
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        requesterId: userIds.matt,
        email: "sarah@example.com",
      },
    });

    if (!existingRequest) {
      await prisma.friendRequest.create({
        data: {
          email: "sarah@example.com",
          requesterId: userIds.matt,
          status: "PENDING",
        },
      });

      console.log("Created pending friend request from Matt to sarah@example.com");
    }
  } catch (error) {
    console.error("Error creating pending friend request:", error);
  }
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create all users
  const userIds: { [key: string]: string } = {};

  for (const person of people) {
    const firstName = person.name.split(" ")[0].toLowerCase();
    userIds[firstName] = await createUserWithPassword(person);
  }

  // Create wishlists for each user
  for (const [firstName, userId] of Object.entries(userIds)) {
    const person = people.find((p) => p.name.split(" ")[0].toLowerCase() === firstName);
    if (person && wishlistItems[firstName as keyof typeof wishlistItems]) {
      await createWishlists(
        userId,
        person.name,
        wishlistItems[firstName as keyof typeof wishlistItems] as readonly WishlistItem[]
      );
    }
  }

  // Create friendships
  await createFriendships(userIds);

  // Create pending friend requests
  await createPendingFriendRequests(userIds);

  // Create profiles for existing users who don't have them
  console.log("Creating profiles for existing users...");
  const usersWithoutProfiles = await prisma.user.findMany({
    where: {
      profile: null,
    },
  });

  for (const user of usersWithoutProfiles) {
    await prisma.profile.create({
      data: {
        userId: user.id,
        preferredCurrency: "USD",
        theme: "system",
      },
    });
    console.log(`Created profile for user: ${user.name}`);
  }

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

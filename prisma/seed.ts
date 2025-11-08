import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

type WishlistItem = {
  name: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  blurhash?: string;
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
    avatar: "https://api.dicebear.com/7.x/big-smile/svg?seed=Matt",
  },
  {
    name: "Doug Powell",
    email: "doug@example.com",
    birthday: new Date("1952-06-25"),
    interests: ["cars", "gadgets", "3d printing"],
    avatar: "https://api.dicebear.com/7.x/big-smile/svg?seed=Doug",
  },
  {
    name: "Helen Powell",
    email: "helen@example.com",
    birthday: new Date("1954-11-02"),
    interests: ["crafting", "gluten free cooking"],
    avatar: "https://api.dicebear.com/7.x/big-smile/svg?seed=Helen",
  },
  {
    name: "Tim Powell",
    email: "tim@example.com",
    birthday: new Date("1983-02-28"), // Fixed invalid date (Feb 30)
    interests: ["sneakers", "star wars", "lego"],
    avatar: "https://api.dicebear.com/7.x/big-smile/svg?seed=Tim",
  },
  {
    name: "Angela Smith-Williams",
    email: "angela@example.com",
    birthday: new Date("1986-05-02"),
    interests: ["cooking", "Pinterest", "family activities"],
    avatar: "https://api.dicebear.com/7.x/big-smile/svg?seed=Angela",
  },
  {
    name: "Emma Cullen",
    email: "emma@example.com",
    birthday: new Date("1989-11-06"),
    interests: ["Minions", "purple things"],
    avatar: "https://api.dicebear.com/7.x/big-smile/svg?seed=Emma",
  },
] as const;

// Sample wishlist items for each person
const wishlistItems = {
  matt: {
    general: [
      {
        name: "LEGO Creator Expert Millennium Falcon",
        description:
          "Ultimate collector's version of the iconic Star Wars ship with over 7,500 pieces",
        url: "https://www.lego.com",
        imageUrl:
          "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop",
        blurhash: "L8GR3f}@JA?Gwg$+Rh,,-7abIV#p",
        price: 849.99,
        priority: 3,
      },
      {
        name: "Radiohead - OK Computer OKNOTOK Vinyl",
        description: "20th anniversary edition vinyl with rare B-sides and unreleased tracks",
        url: "https://radiohead.com",
        imageUrl:
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
        blurhash: "LOHoj?9]%2%g?]4TM{j]E1DiRjs:",
        price: 45.0,
        priority: 2,
      },
      {
        name: "JavaScript: The Good Parts",
        description: "Douglas Crockford's essential guide to JavaScript's best features",
        url: "https://shop.oreilly.com",
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
        blurhash: "LCO3-0I9t8_Ns:M_RPWB%i%gV?RP",
        price: 29.99,
        priority: 1,
      },
      {
        name: "Improv Comedy Workshop Ticket",
        description: "6-week beginner's improv class at the local comedy theater",
        imageUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        blurhash: "LHI5DB^k3EKj00DiOZM|?wxuMxt7",
        price: 85.0,
        priority: 2,
      },
    ],
    birthday: [
      {
        name: "Professional Code Review Session",
        description:
          "One-on-one session with a senior developer to review my code and provide feedback",
        imageUrl:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop",
        blurhash: "L9GR-u0N9YV=?^%NbvsS00_3?Gxu",
        price: 200.0,
        priority: 3,
      },
      {
        name: "Premium Lego Storage System",
        description: "Modular storage solution with sorting trays and building surface",
        url: "https://www.lego.com",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
        blurhash: "LfHxvi?bxut7~q-;%MV[E1ofaeR+",
        price: 125.0,
        priority: 2,
      },
      {
        name: "Improv Theatre Season Pass",
        description: "Full season pass to attend all improv shows and workshops",
        imageUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        blurhash: "LHI5DB^k3EKj00DiOZM|?wxuMxt7",
        price: 300.0,
        priority: 3,
      },
    ],
    private: [
      {
        name: "Surprise Weekend Getaway",
        description: "Romantic weekend trip to a cozy cabin in the mountains",
        imageUrl:
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop",
        blurhash: "LBCY~q~TE4oe.5~9-UNJw5R-NHWB",
        price: 500.0,
        priority: 3,
      },
      {
        name: "Custom Mechanical Keyboard",
        description: "Cherry MX Brown switches with custom keycaps and RGB lighting",
        url: "https://mechanicalkeyboards.com",
        imageUrl:
          "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop",
        blurhash: "LDQcn|%MWC?b~qt7t7WBt6%Mj[Ri",
        price: 350.0,
        priority: 2,
      },
    ],
    public: [
      {
        name: "Open Source Contribution Sponsorship",
        description: "Monthly sponsorship to support open source projects I use",
        imageUrl: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=400&fit=crop",
        blurhash: "L068N]XC00xL^-%ONIE09FtTyCkk",
        price: 50.0,
        priority: 1,
      },
      {
        name: "Tech Conference Ticket",
        description: "Admission to a major web development or JavaScript conference",
        imageUrl:
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=400&fit=crop",
        blurhash: "L03[rSR@9W4,o-WRs[-@00xvDz-?",
        price: 400.0,
        priority: 2,
      },
      {
        name: "Programming Books Bundle",
        description: "Collection of the latest books on React, Node.js, and system design",
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
        blurhash: "LCO3-0I9t8_Ns:M_RPWB%i%gV?RP",
        price: 150.0,
        priority: 1,
      },
    ],
  },
  doug: [
    {
      name: "Creality Ender 3 V3 SE 3D Printer",
      description: "Entry-level 3D printer perfect for hobbyists with auto bed leveling",
      url: "https://www.creality.com",
      imageUrl: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop",
      blurhash: "LDD96kuib;t0RNVqxtTI1PxIrXMx",
      price: 199.0,
      priority: 3,
    },
    {
      name: "OBD2 Scanner Tool",
      description: "Bluetooth diagnostic scanner for reading car error codes and performance data",
      imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop",
      blurhash: "L65#w_9Eaet6V?adaeog00?wkCM{",
      price: 89.99,
      priority: 2,
    },
    {
      name: "Car Detailing Kit",
      description: "Complete set with microfiber cloths, waxes, and cleaning solutions",
      imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=400&fit=crop",
      blurhash: "LLEyA5~W~qxtr=ROt6xt~X-p-;WU",
      price: 45.0,
      priority: 1,
    },
    {
      name: "Arduino Starter Kit",
      description: "Complete electronics learning kit with sensors, LEDs, and project guide",
      url: "https://www.arduino.cc",
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop",
      blurhash: "L2A0%k9E9YtR00og^+?H}[W=9sNG",
      price: 75.0,
      priority: 2,
    },
  ],
  helen: [
    {
      name: "Cricut Explore Air 2",
      description: "Precision cutting machine for crafting projects with various materials",
      url: "https://cricut.com",
      imageUrl: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=400&fit=crop",
      blurhash: "LADv=u~D^kyE-o~q-Bi^-Ox]GI$x",
      price: 249.99,
      priority: 3,
    },
    {
      name: "Gluten Free Cookbook",
      description: "150+ delicious gluten-free recipes for everyday meals",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
      blurhash: "LCO3-0I9t8_Ns:M_RPWB%i%gV?RP",
      price: 24.95,
      priority: 1,
    },
    {
      name: "Yarn Storage Organizer",
      description: "Multi-compartment storage system for organizing yarn by color and weight",
      imageUrl: "https://images.unsplash.com/photo-1586816001966-79b736744398?w=400&h=400&fit=crop",
      blurhash: "LHHwb*^%0NIW~nx@D+V@D;RQD+WC",
      price: 35.0,
      priority: 1,
    },
    {
      name: "Embroidery Floss Set",
      description: "Complete set of 100 colors of premium embroidery thread",
      imageUrl: "https://images.unsplash.com/photo-1586816001966-79b736744398?w=400&h=400&fit=crop",
      blurhash: "LHHwb*^%0NIW~nx@D+V@D;RQD+WC",
      price: 28.5,
      priority: 2,
    },
  ],
  tim: [
    {
      name: "Air Jordan 1 Retro High OG",
      description: "Classic basketball sneakers in the iconic Chicago Bulls colorway",
      url: "https://nike.com",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
      blurhash: "LPLIfdnN{}xb=0wdspNt+bXTFaRj",
      price: 170.0,
      priority: 3,
    },
    {
      name: "LEGO Star Wars Millennium Falcon",
      description: "Detailed replica of Han Solo's ship with mini figures included",
      url: "https://lego.com",
      imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop",
      blurhash: "L8GR3f}@JA?Gwg$+Rh,,-7abIV#p",
      price: 169.99,
      priority: 2,
    },
    {
      name: "Star Wars Black Series Lightsaber",
      description: "Force FX Elite lightsaber with authentic movie sounds and lighting",
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
      blurhash: "L02rs+j[Rjt7t7ayj[of00j[WBWB",
      price: 249.99,
      priority: 2,
    },
    {
      name: "Sneaker Display Case",
      description: "Premium acrylic display case for showcasing favorite sneakers",
      imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop",
      blurhash: "LHLXrd?^M+%M0eJ7RnRj^ia0NEWB",
      price: 89.0,
      priority: 1,
    },
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
    {
      name: "Minions Collectible Figure Set",
      description: "Complete set of 12 Minions figures from the Despicable Me movies",
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
      blurhash: "LfHxvi?bxut7~q-;%MV[E1ofaeR+",
      price: 89.99,
      priority: 3,
    },
    {
      name: "Purple Throw Blanket",
      description: "Soft fleece throw blanket in Emma's favorite color",
      imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
      blurhash: "LbJ86A00E4bH?wRiaJNGa~bIoIae",
      price: 35.0,
      priority: 1,
    },
    {
      name: "Despicable Me Movie Collection",
      description: "Complete collection of all Despicable Me and Minions movies on Blu-ray",
      url: "https://movies.disney.com",
      imageUrl: "https://images.unsplash.com/photo-1489599732645-0e4a0815b9e3?w=400&h=400&fit=crop",
      blurhash: "L9A^~j~q9FM{00IU-;M{-;ofRjt7",
      price: 39.99,
      priority: 2,
    },
    {
      name: "Purple Kitchen Appliance Set",
      description: "Matching purple toaster, kettle, and blender set for the kitchen",
      imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
      blurhash: "LbK-Re%h.8?b_Nt7V@WX-;RPNGM{",
      price: 125.0,
      priority: 2,
    },
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

    // Update the user with email verification and avatar
    const user = await prisma.user.update({
      where: { email: userData.email },
      data: {
        emailVerified: true,
        image: userData.avatar,
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
              description: item.description || null,
              url: item.url || null,
              imageUrl: item.imageUrl || null,
              blurhash: item.blurhash || null,
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
              description: item.description || null,
              url: item.url || null,
              imageUrl: item.imageUrl || null,
              blurhash: item.blurhash || null,
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
              description: item.description || null,
              url: item.url || null,
              imageUrl: item.imageUrl || null,
              blurhash: item.blurhash || null,
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

async function createBirthdayOccasions(userIds: { [key: string]: string }) {
  console.log("Creating birthday occasions...");

  for (const [firstName, userId] of Object.entries(userIds)) {
    const person = people.find((p) => p.name.split(" ")[0].toLowerCase() === firstName);

    if (!person?.birthday) {
      continue;
    }

    // Check if birthday occasion already exists
    const existingOccasion = await prisma.occasion.findFirst({
      where: {
        ownerId: userId,
        type: "BIRTHDAY",
      },
    });

    if (existingOccasion) {
      console.log(`Birthday occasion for ${person.name} already exists, skipping...`);
      continue;
    }

    // Get the user's default wishlist
    const defaultWishlist = await prisma.wishlist.findFirst({
      where: {
        ownerId: userId,
        isDefault: true,
      },
    });

    if (!defaultWishlist) {
      console.log(`No default wishlist found for ${person.name}, skipping birthday occasion...`);
      continue;
    }

    // Create birthday occasion
    await prisma.occasion.create({
      data: {
        title: `${person.name.split(" ")[0]}'s Birthday`,
        date: person.birthday,
        type: "BIRTHDAY",
        isRecurring: true,
        ownerId: userId,
        entityType: "WISHLIST",
        entityId: defaultWishlist.id,
      },
    });

    console.log(`Created birthday occasion for ${person.name} linked to default wishlist`);
  }
}

async function createCurrencyRates() {
  console.log("Creating currency conversion rates...");

  // Current exchange rates as of October 2025
  // Base currency: USD = 1.0
  const rates = [
    // USD conversions
    { from: "USD", to: "EUR", rate: 0.9105 }, // 1 USD = 0.9105 EUR
    { from: "USD", to: "GBP", rate: 0.7651 }, // 1 USD = 0.7651 GBP
    { from: "USD", to: "AUD", rate: 1.4823 }, // 1 USD = 1.4823 AUD
    { from: "USD", to: "NZD", rate: 1.6234 }, // 1 USD = 1.6234 NZD
    { from: "USD", to: "CAD", rate: 1.3567 }, // 1 USD = 1.3567 CAD
    { from: "USD", to: "JPY", rate: 149.23 }, // 1 USD = 149.23 JPY

    // EUR conversions
    { from: "EUR", to: "USD", rate: 1.0983 }, // 1 EUR = 1.0983 USD
    { from: "EUR", to: "GBP", rate: 0.8402 }, // 1 EUR = 0.8402 GBP
    { from: "EUR", to: "AUD", rate: 1.6281 }, // 1 EUR = 1.6281 AUD
    { from: "EUR", to: "NZD", rate: 1.7829 }, // 1 EUR = 1.7829 NZD
    { from: "EUR", to: "CAD", rate: 1.4901 }, // 1 EUR = 1.4901 CAD
    { from: "EUR", to: "JPY", rate: 163.87 }, // 1 EUR = 163.87 JPY

    // GBP conversions
    { from: "GBP", to: "USD", rate: 1.3071 }, // 1 GBP = 1.3071 USD
    { from: "GBP", to: "EUR", rate: 1.1901 }, // 1 GBP = 1.1901 EUR
    { from: "GBP", to: "AUD", rate: 1.9377 }, // 1 GBP = 1.9377 AUD
    { from: "GBP", to: "NZD", rate: 2.1218 }, // 1 GBP = 2.1218 NZD
    { from: "GBP", to: "CAD", rate: 1.7738 }, // 1 GBP = 1.7738 CAD
    { from: "GBP", to: "JPY", rate: 195.04 }, // 1 GBP = 195.04 JPY

    // AUD conversions
    { from: "AUD", to: "USD", rate: 0.6747 }, // 1 AUD = 0.6747 USD
    { from: "AUD", to: "EUR", rate: 0.6142 }, // 1 AUD = 0.6142 EUR
    { from: "AUD", to: "GBP", rate: 0.5161 }, // 1 AUD = 0.5161 GBP
    { from: "AUD", to: "NZD", rate: 1.0952 }, // 1 AUD = 1.0952 NZD
    { from: "AUD", to: "CAD", rate: 0.9153 }, // 1 AUD = 0.9153 CAD
    { from: "AUD", to: "JPY", rate: 100.65 }, // 1 AUD = 100.65 JPY

    // NZD conversions
    { from: "NZD", to: "USD", rate: 0.616 }, // 1 NZD = 0.6160 USD
    { from: "NZD", to: "EUR", rate: 0.561 }, // 1 NZD = 0.5610 EUR
    { from: "NZD", to: "GBP", rate: 0.4713 }, // 1 NZD = 0.4713 GBP
    { from: "NZD", to: "AUD", rate: 0.9131 }, // 1 NZD = 0.9131 AUD
    { from: "NZD", to: "CAD", rate: 0.8358 }, // 1 NZD = 0.8358 CAD
    { from: "NZD", to: "JPY", rate: 91.93 }, // 1 NZD = 91.93 JPY

    // CAD conversions
    { from: "CAD", to: "USD", rate: 0.7371 }, // 1 CAD = 0.7371 USD
    { from: "CAD", to: "EUR", rate: 0.6711 }, // 1 CAD = 0.6711 EUR
    { from: "CAD", to: "GBP", rate: 0.5638 }, // 1 CAD = 0.5638 GBP
    { from: "CAD", to: "AUD", rate: 1.0925 }, // 1 CAD = 1.0925 AUD
    { from: "CAD", to: "NZD", rate: 1.1964 }, // 1 CAD = 1.1964 NZD
    { from: "CAD", to: "JPY", rate: 110.0 }, // 1 CAD = 110.00 JPY

    // JPY conversions
    { from: "JPY", to: "USD", rate: 0.0067 }, // 1 JPY = 0.0067 USD
    { from: "JPY", to: "EUR", rate: 0.0061 }, // 1 JPY = 0.0061 EUR
    { from: "JPY", to: "GBP", rate: 0.0051 }, // 1 JPY = 0.0051 GBP
    { from: "JPY", to: "AUD", rate: 0.0099 }, // 1 JPY = 0.0099 AUD
    { from: "JPY", to: "NZD", rate: 0.0109 }, // 1 JPY = 0.0109 NZD
    { from: "JPY", to: "CAD", rate: 0.0091 }, // 1 JPY = 0.0091 CAD
  ];

  for (const rate of rates) {
    try {
      // Check if rate already exists
      const existing = await prisma.currencyRate.findUnique({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency: rate.from,
            toCurrency: rate.to,
          },
        },
      });

      if (existing) {
        // Update existing rate
        await prisma.currencyRate.update({
          where: {
            fromCurrency_toCurrency: {
              fromCurrency: rate.from,
              toCurrency: rate.to,
            },
          },
          data: {
            rate: rate.rate,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new rate
        await prisma.currencyRate.create({
          data: {
            fromCurrency: rate.from,
            toCurrency: rate.to,
            rate: rate.rate,
          },
        });
      }
    } catch (error) {
      console.error(`Error creating rate ${rate.from} -> ${rate.to}:`, error);
    }
  }

  console.log(`Created/updated ${rates.length} currency conversion rates`);
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

  // Create birthday occasions linked to default wishlists
  await createBirthdayOccasions(userIds);

  // Create friendships
  await createFriendships(userIds);

  // Create pending friend requests
  await createPendingFriendRequests(userIds);

  // Create currency conversion rates
  await createCurrencyRates();

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
        preferredCurrency: "NZD",
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

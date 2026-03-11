import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MejaHub database...\n");

  // ========================================
  // 1. Create Branch
  // ========================================
  const branch = await prisma.branch.upsert({
    where: { id: "branch-main" },
    update: {},
    create: {
      id: "branch-main",
      name: "MejaHub - Cabang Utama",
      address: "Jl. Contoh No. 123, Jakarta Selatan",
      phone: "021-12345678",
      taxRate: 10.0,
      serviceRate: 5.0,
    },
  });
  console.log(`✅ Branch: ${branch.name}`);

  // ========================================
  // 2. Create Users (all roles)
  // ========================================
  const hashedPassword = await bcryptjs.hash("password123", 12);

  const users = [
    {
      id: "user-admin",
      email: "admin@mejahub.com",
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN" as const,
      branchId: branch.id,
      pin: "1234",
    },
    {
      id: "user-manager",
      email: "manager@mejahub.com",
      name: "Branch Manager",
      password: hashedPassword,
      role: "BRANCH_MANAGER" as const,
      branchId: branch.id,
      pin: "1234",
    },
    {
      id: "user-cashier",
      email: "kasir@mejahub.com",
      name: "Kasir 1",
      password: hashedPassword,
      role: "CASHIER" as const,
      branchId: branch.id,
      pin: "1234",
    },
    {
      id: "user-waiter",
      email: "waiter@mejahub.com",
      name: "Pelayan 1",
      password: hashedPassword,
      role: "WAITER" as const,
      branchId: branch.id,
      pin: "1234",
    },
    {
      id: "user-kitchen",
      email: "kitchen@mejahub.com",
      name: "Koki Dapur",
      password: hashedPassword,
      role: "KITCHEN_STAFF" as const,
      branchId: branch.id,
    },
    {
      id: "user-bar",
      email: "bar@mejahub.com",
      name: "Barista",
      password: hashedPassword,
      role: "BAR_STAFF" as const,
      branchId: branch.id,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { id: userData.id },
      update: {},
      create: userData,
    });
    console.log(`✅ User: ${user.name} (${user.role})`);
  }

  // ========================================
  // 3. Create Tables (10 meja)
  // ========================================
  for (let i = 1; i <= 10; i++) {
    const table = await prisma.table.upsert({
      where: { id: `table-${i}` },
      update: {},
      create: {
        id: `table-${i}`,
        number: i,
        name: i <= 2 ? `Meja VIP ${i}` : `Meja ${i}`,
        capacity: i <= 2 ? 6 : 4,
        positionX: ((i - 1) % 5) * 2,
        positionY: Math.floor((i - 1) / 5) * 2,
        branchId: branch.id,
        qrCode: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/order/${branch.id}/table-${i}`,
      },
    });
    console.log(`✅ Table: ${table.name} (Kapasitas: ${table.capacity})`);
  }

  // ========================================
  // 4. Create Categories
  // ========================================
  const categoriesData = [
    { id: "cat-coffee", name: "Kopi", sortOrder: 1 },
    { id: "cat-non-coffee", name: "Non-Kopi", sortOrder: 2 },
    { id: "cat-food", name: "Makanan", sortOrder: 3 },
    { id: "cat-snack", name: "Snack", sortOrder: 4 },
    { id: "cat-dessert", name: "Dessert", sortOrder: 5 },
  ];

  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { id: catData.id },
      update: {},
      create: {
        ...catData,
        branchId: branch.id,
      },
    });
    console.log(`✅ Category: ${category.name}`);
  }

  // ========================================
  // 5. Create Modifier Groups + Modifiers
  // ========================================
  const sugarLevel = await prisma.modifierGroup.upsert({
    where: { id: "mod-group-sugar" },
    update: {},
    create: {
      id: "mod-group-sugar",
      name: "Level Gula",
      type: "SINGLE",
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
    },
  });

  const sugarModifiers = [
    { id: "mod-no-sugar", name: "Tanpa Gula", price: 0 },
    { id: "mod-less-sugar", name: "Sedikit Gula", price: 0 },
    { id: "mod-normal-sugar", name: "Normal", price: 0 },
    { id: "mod-extra-sugar", name: "Ekstra Gula", price: 0 },
  ];

  for (const mod of sugarModifiers) {
    await prisma.modifier.upsert({
      where: { id: mod.id },
      update: {},
      create: { ...mod, modifierGroupId: sugarLevel.id },
    });
  }
  console.log(`✅ ModifierGroup: ${sugarLevel.name} (${sugarModifiers.length} options)`);

  const toppingGroup = await prisma.modifierGroup.upsert({
    where: { id: "mod-group-topping" },
    update: {},
    create: {
      id: "mod-group-topping",
      name: "Topping",
      type: "MULTIPLE",
      isRequired: false,
      minSelect: 0,
      maxSelect: 5,
    },
  });

  const toppingModifiers = [
    { id: "mod-boba", name: "Boba", price: 5000 },
    { id: "mod-jelly", name: "Jelly", price: 3000 },
    { id: "mod-cream", name: "Whipped Cream", price: 5000 },
    { id: "mod-cheese", name: "Cheese Foam", price: 7000 },
  ];

  for (const mod of toppingModifiers) {
    await prisma.modifier.upsert({
      where: { id: mod.id },
      update: {},
      create: { ...mod, modifierGroupId: toppingGroup.id },
    });
  }
  console.log(`✅ ModifierGroup: ${toppingGroup.name} (${toppingModifiers.length} options)`);

  const spiceLevel = await prisma.modifierGroup.upsert({
    where: { id: "mod-group-spice" },
    update: {},
    create: {
      id: "mod-group-spice",
      name: "Level Pedas",
      type: "SINGLE",
      isRequired: false,
      minSelect: 0,
      maxSelect: 1,
    },
  });

  const spiceModifiers = [
    { id: "mod-no-spice", name: "Tidak Pedas", price: 0 },
    { id: "mod-mild", name: "Pedas Level 1", price: 0 },
    { id: "mod-medium", name: "Pedas Level 2", price: 0 },
    { id: "mod-hot", name: "Pedas Level 3", price: 0 },
    { id: "mod-extra-hot", name: "Pedas Level 5", price: 2000 },
  ];

  for (const mod of spiceModifiers) {
    await prisma.modifier.upsert({
      where: { id: mod.id },
      update: {},
      create: { ...mod, modifierGroupId: spiceLevel.id },
    });
  }
  console.log(`✅ ModifierGroup: ${spiceLevel.name} (${spiceModifiers.length} options)`);

  // ========================================
  // 6. Create Products
  // ========================================
  const productsData = [
    {
      id: "prod-kopi-susu",
      name: "Kopi Susu Gula Aren",
      price: 25000,
      station: "BAR" as const,
      categoryId: "cat-coffee",
      modifierGroups: ["mod-group-sugar", "mod-group-topping"],
    },
    {
      id: "prod-espresso",
      name: "Espresso",
      price: 18000,
      station: "BAR" as const,
      categoryId: "cat-coffee",
      modifierGroups: ["mod-group-sugar"],
    },
    {
      id: "prod-americano",
      name: "Americano",
      price: 22000,
      station: "BAR" as const,
      categoryId: "cat-coffee",
      modifierGroups: ["mod-group-sugar", "mod-group-topping"],
    },
    {
      id: "prod-matcha-latte",
      name: "Matcha Latte",
      price: 28000,
      station: "BAR" as const,
      categoryId: "cat-non-coffee",
      modifierGroups: ["mod-group-sugar", "mod-group-topping"],
    },
    {
      id: "prod-thai-tea",
      name: "Thai Tea",
      price: 22000,
      station: "BAR" as const,
      categoryId: "cat-non-coffee",
      modifierGroups: ["mod-group-sugar", "mod-group-topping"],
    },
    {
      id: "prod-nasi-goreng",
      name: "Nasi Goreng Spesial",
      price: 35000,
      station: "KITCHEN" as const,
      categoryId: "cat-food",
      modifierGroups: ["mod-group-spice"],
    },
    {
      id: "prod-mie-goreng",
      name: "Mie Goreng",
      price: 30000,
      station: "KITCHEN" as const,
      categoryId: "cat-food",
      modifierGroups: ["mod-group-spice"],
    },
    {
      id: "prod-chicken-wings",
      name: "Chicken Wings (6 pcs)",
      price: 38000,
      station: "KITCHEN" as const,
      categoryId: "cat-snack",
      modifierGroups: ["mod-group-spice"],
    },
    {
      id: "prod-french-fries",
      name: "French Fries",
      price: 20000,
      station: "KITCHEN" as const,
      categoryId: "cat-snack",
      modifierGroups: [],
    },
    {
      id: "prod-pancake",
      name: "Pancake Stack",
      price: 32000,
      station: "KITCHEN" as const,
      categoryId: "cat-dessert",
      modifierGroups: ["mod-group-topping"],
    },
  ];

  for (const prodData of productsData) {
    const { modifierGroups, ...productFields } = prodData;
    const product = await prisma.product.upsert({
      where: { id: productFields.id },
      update: {},
      create: {
        ...productFields,
        branchId: branch.id,
      },
    });

    // Link modifier groups
    for (const mgId of modifierGroups) {
      await prisma.productModifierGroup.upsert({
        where: {
          productId_modifierGroupId: {
            productId: product.id,
            modifierGroupId: mgId,
          },
        },
        update: {},
        create: {
          productId: product.id,
          modifierGroupId: mgId,
        },
      });
    }

    console.log(`✅ Product: ${product.name} (${product.station})`);
  }

  // ========================================
  // 7. Create Ingredients + Recipes (BoM)
  // ========================================
  const ingredientsData = [
    { id: "ing-coffee", name: "Biji Kopi", unit: "GRAM" as const, currentStock: 5000, minStock: 500, costPerUnit: 0.5 },
    { id: "ing-milk", name: "Susu Segar", unit: "MILILITER" as const, currentStock: 10000, minStock: 2000, costPerUnit: 0.025 },
    { id: "ing-palm-sugar", name: "Gula Aren", unit: "MILILITER" as const, currentStock: 3000, minStock: 500, costPerUnit: 0.04 },
    { id: "ing-cup-plastic", name: "Cup Plastik", unit: "PIECE" as const, currentStock: 500, minStock: 100, costPerUnit: 500 },
    { id: "ing-rice", name: "Beras", unit: "GRAM" as const, currentStock: 20000, minStock: 5000, costPerUnit: 0.015 },
    { id: "ing-noodle", name: "Mie", unit: "GRAM" as const, currentStock: 10000, minStock: 2000, costPerUnit: 0.02 },
    { id: "ing-egg", name: "Telur", unit: "PIECE" as const, currentStock: 200, minStock: 50, costPerUnit: 2500 },
    { id: "ing-matcha", name: "Bubuk Matcha", unit: "GRAM" as const, currentStock: 1000, minStock: 200, costPerUnit: 1.5 },
  ];

  for (const ingData of ingredientsData) {
    await prisma.ingredient.upsert({
      where: { id: ingData.id },
      update: {},
      create: { ...ingData, branchId: branch.id },
    });
    console.log(`✅ Ingredient: ${ingData.name} (${ingData.currentStock} ${ingData.unit})`);
  }

  // Recipes: Kopi Susu Gula Aren
  const recipesData = [
    { productId: "prod-kopi-susu", ingredientId: "ing-coffee", quantity: 15 },
    { productId: "prod-kopi-susu", ingredientId: "ing-milk", quantity: 100 },
    { productId: "prod-kopi-susu", ingredientId: "ing-palm-sugar", quantity: 20 },
    { productId: "prod-kopi-susu", ingredientId: "ing-cup-plastic", quantity: 1 },
    { productId: "prod-espresso", ingredientId: "ing-coffee", quantity: 18 },
    { productId: "prod-americano", ingredientId: "ing-coffee", quantity: 18 },
    { productId: "prod-americano", ingredientId: "ing-cup-plastic", quantity: 1 },
    { productId: "prod-matcha-latte", ingredientId: "ing-matcha", quantity: 10 },
    { productId: "prod-matcha-latte", ingredientId: "ing-milk", quantity: 150 },
    { productId: "prod-matcha-latte", ingredientId: "ing-cup-plastic", quantity: 1 },
    { productId: "prod-nasi-goreng", ingredientId: "ing-rice", quantity: 200 },
    { productId: "prod-nasi-goreng", ingredientId: "ing-egg", quantity: 1 },
    { productId: "prod-mie-goreng", ingredientId: "ing-noodle", quantity: 200 },
    { productId: "prod-mie-goreng", ingredientId: "ing-egg", quantity: 1 },
  ];

  for (const recipe of recipesData) {
    await prisma.recipe.upsert({
      where: {
        productId_ingredientId: {
          productId: recipe.productId,
          ingredientId: recipe.ingredientId,
        },
      },
      update: {},
      create: recipe,
    });
  }
  console.log(`✅ Recipes: ${recipesData.length} BoM entries created`);

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin:   admin@mejahub.com / password123");
  console.log("   Manager: manager@mejahub.com / password123");
  console.log("   Kasir:   kasir@mejahub.com / password123");
  console.log("   Waiter:  waiter@mejahub.com / password123");
  console.log("   Kitchen: kitchen@mejahub.com / password123");
  console.log("   Bar:     bar@mejahub.com / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

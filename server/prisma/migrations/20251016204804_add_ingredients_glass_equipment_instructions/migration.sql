/*
  Warnings:

  - Added the required column `type` to the `ingredients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "drinks" ADD COLUMN     "glassTypeId" TEXT;

-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN     "bottlePrice" DOUBLE PRECISION,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Ingredient';

-- CreateTable
CREATE TABLE "ingredient_purchases" (
    "id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplier" TEXT,
    "notes" TEXT,
    "ingredientId" TEXT NOT NULL,

    CONSTRAINT "ingredient_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glass_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "capacity" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glass_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drink_equipment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "drinkId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "drink_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drink_instructions" (
    "id" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "drinkId" TEXT NOT NULL,

    CONSTRAINT "drink_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "glass_types_name_key" ON "glass_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_name_key" ON "equipment"("name");

-- CreateIndex
CREATE UNIQUE INDEX "drink_equipment_drinkId_equipmentId_key" ON "drink_equipment"("drinkId", "equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "drink_instructions_drinkId_stepNumber_key" ON "drink_instructions"("drinkId", "stepNumber");

-- AddForeignKey
ALTER TABLE "drinks" ADD CONSTRAINT "drinks_glassTypeId_fkey" FOREIGN KEY ("glassTypeId") REFERENCES "glass_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_purchases" ADD CONSTRAINT "ingredient_purchases_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drink_equipment" ADD CONSTRAINT "drink_equipment_drinkId_fkey" FOREIGN KEY ("drinkId") REFERENCES "drinks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drink_equipment" ADD CONSTRAINT "drink_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drink_instructions" ADD CONSTRAINT "drink_instructions_drinkId_fkey" FOREIGN KEY ("drinkId") REFERENCES "drinks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

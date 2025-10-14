/*
  Warnings:

  - You are about to drop the column `category` on the `drinks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `drinks` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "drinks" DROP COLUMN "category";

-- DropEnum
DROP TYPE "public"."DrinkCategory";

-- CreateTable
CREATE TABLE "drink_category_enums" (
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🍹',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drink_category_enums_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "drink_categories" (
    "id" TEXT NOT NULL,
    "drinkId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drink_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drink_categories_drinkId_categoryName_key" ON "drink_categories"("drinkId", "categoryName");

-- CreateIndex
CREATE UNIQUE INDEX "drinks_name_key" ON "drinks"("name");

-- AddForeignKey
ALTER TABLE "drink_categories" ADD CONSTRAINT "drink_categories_drinkId_fkey" FOREIGN KEY ("drinkId") REFERENCES "drinks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drink_categories" ADD CONSTRAINT "drink_categories_categoryName_fkey" FOREIGN KEY ("categoryName") REFERENCES "drink_category_enums"("name") ON DELETE CASCADE ON UPDATE CASCADE;

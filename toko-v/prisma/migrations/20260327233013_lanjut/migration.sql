/*
  Warnings:

  - The primary key for the `inventoryitem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `productId` on the `inventoryitem` table. All the data in the column will be lost.
  - Made the column `variantId` on table `inventoryitem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `inventoryitem` DROP FOREIGN KEY `InventoryItem_variantId_fkey`;

-- DropIndex
DROP INDEX `InventoryItem_variantId_idx` ON `inventoryitem`;

-- AlterTable
ALTER TABLE `inventoryitem` DROP PRIMARY KEY,
    DROP COLUMN `productId`,
    MODIFY `variantId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`variantId`);

-- AddForeignKey
ALTER TABLE `InventoryItem` ADD CONSTRAINT `InventoryItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

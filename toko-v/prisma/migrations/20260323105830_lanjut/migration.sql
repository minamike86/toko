-- AlterTable
ALTER TABLE `inventoryitem` ADD COLUMN `variantId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `orderitem` ADD COLUMN `variantId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `stockmovement` ADD COLUMN `variantId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `variantName` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `sizeLabel` VARCHAR(191) NULL,
    `colorLabel` VARCHAR(191) NULL,
    `basePrice` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductVariant_sku_key`(`sku`),
    INDEX `ProductVariant_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `InventoryItem_variantId_idx` ON `InventoryItem`(`variantId`);

-- CreateIndex
CREATE INDEX `OrderItem_variantId_idx` ON `OrderItem`(`variantId`);

-- CreateIndex
CREATE INDEX `StockMovement_variantId_idx` ON `StockMovement`(`variantId`);

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryItem` ADD CONSTRAINT `InventoryItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

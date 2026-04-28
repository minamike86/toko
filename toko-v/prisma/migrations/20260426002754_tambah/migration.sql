/*
  Warnings:

  - Made the column `variantId` on table `orderitem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `OrderItem_variantId_fkey`;

-- AlterTable
ALTER TABLE `orderitem` MODIFY `variantId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `supplier_payments` (
    `id` VARCHAR(36) NOT NULL,
    `purchase_order_id` VARCHAR(36) NOT NULL,
    `supplier_id` VARCHAR(36) NOT NULL,
    `amount` INTEGER NOT NULL,
    `paid_at` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `created_by` VARCHAR(36) NOT NULL,

    INDEX `supplier_payments_purchase_order_id_idx`(`purchase_order_id`),
    INDEX `supplier_payments_supplier_id_idx`(`supplier_id`),
    INDEX `supplier_payments_paid_at_idx`(`paid_at`),
    INDEX `supplier_payments_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_return_reductions` (
    `id` VARCHAR(36) NOT NULL,
    `purchase_order_id` VARCHAR(36) NOT NULL,
    `supplier_id` VARCHAR(36) NOT NULL,
    `returned_at` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `created_by` VARCHAR(36) NOT NULL,

    INDEX `purchase_return_reductions_purchase_order_id_idx`(`purchase_order_id`),
    INDEX `purchase_return_reductions_supplier_id_idx`(`supplier_id`),
    INDEX `purchase_return_reductions_returned_at_idx`(`returned_at`),
    INDEX `purchase_return_reductions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_return_reduction_items` (
    `id` VARCHAR(36) NOT NULL,
    `purchase_return_id` VARCHAR(36) NOT NULL,
    `purchase_item_id` VARCHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `reduced_amount` INTEGER NOT NULL,
    `reason` TEXT NULL,

    INDEX `purchase_return_reduction_items_purchase_return_id_idx`(`purchase_return_id`),
    INDEX `purchase_return_reduction_items_purchase_item_id_idx`(`purchase_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `purchase_orders_canceled_at_idx` ON `purchase_orders`(`canceled_at`);

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_return_reductions` ADD CONSTRAINT `purchase_return_reductions_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_return_reductions` ADD CONSTRAINT `purchase_return_reductions_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_return_reduction_items` ADD CONSTRAINT `purchase_return_reduction_items_purchase_return_id_fkey` FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_return_reductions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_return_reduction_items` ADD CONSTRAINT `purchase_return_reduction_items_purchase_item_id_fkey` FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

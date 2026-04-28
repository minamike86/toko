-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(36) NOT NULL,
    `store_name` VARCHAR(200) NOT NULL,
    `sales_name` VARCHAR(200) NULL,
    `phone` VARCHAR(50) NULL,
    `notes` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL,

    INDEX `suppliers_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_orders` (
    `id` VARCHAR(36) NOT NULL,
    `supplier_id` VARCHAR(36) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `created_by` VARCHAR(36) NOT NULL,
    `received_at` DATETIME(3) NULL,
    `received_by` VARCHAR(36) NULL,
    `canceled_at` DATETIME(3) NULL,
    `canceled_by` VARCHAR(36) NULL,

    INDEX `purchase_orders_supplier_id_idx`(`supplier_id`),
    INDEX `purchase_orders_status_idx`(`status`),
    INDEX `purchase_orders_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_items` (
    `id` VARCHAR(36) NOT NULL,
    `purchase_order_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `variant_id` VARCHAR(36) NOT NULL,
    `product_name_snapshot` VARCHAR(200) NOT NULL,
    `variant_name_snapshot` VARCHAR(200) NOT NULL,
    `unit_snapshot` VARCHAR(50) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_cost` INTEGER NOT NULL,
    `subtotal_cost` INTEGER NOT NULL,

    INDEX `purchase_items_purchase_order_id_idx`(`purchase_order_id`),
    INDEX `purchase_items_variant_id_idx`(`variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

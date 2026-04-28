-- CreateTable
CREATE TABLE `ReceivingInspection` (
    `id` VARCHAR(191) NOT NULL,
    `purchaseOrderId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `arrivedAt` DATETIME(3) NOT NULL,
    `arrivedBy` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NULL,
    `startedBy` VARCHAR(191) NULL,
    `completedAt` DATETIME(3) NULL,
    `completedBy` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ReceivingInspection_purchaseOrderId_key`(`purchaseOrderId`),
    INDEX `ReceivingInspection_purchaseOrderId_idx`(`purchaseOrderId`),
    INDEX `ReceivingInspection_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReceivingInspectionItem` (
    `id` VARCHAR(191) NOT NULL,
    `receivingInspectionId` VARCHAR(191) NOT NULL,
    `purchaseItemId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `expectedQuantity` INTEGER NOT NULL,
    `acceptedQuantity` INTEGER NOT NULL,
    `quarantinedQuantity` INTEGER NOT NULL,
    `rejectedQuantity` INTEGER NOT NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `ReceivingInspectionItem_receivingInspectionId_idx`(`receivingInspectionId`),
    INDEX `ReceivingInspectionItem_purchaseItemId_idx`(`purchaseItemId`),
    INDEX `ReceivingInspectionItem_variantId_idx`(`variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReceivingInspection` ADD CONSTRAINT `ReceivingInspection_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReceivingInspectionItem` ADD CONSTRAINT `ReceivingInspectionItem_receivingInspectionId_fkey` FOREIGN KEY (`receivingInspectionId`) REFERENCES `ReceivingInspection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReceivingInspectionItem` ADD CONSTRAINT `ReceivingInspectionItem_purchaseItemId_fkey` FOREIGN KEY (`purchaseItemId`) REFERENCES `purchase_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

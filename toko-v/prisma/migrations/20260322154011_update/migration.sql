/*
  Warnings:

  - You are about to drop the column `occurredAt` on the `payment` table. All the data in the column will be lost.
  - Added the required column `method` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paidAt` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Payment_occurredAt_idx` ON `payment`;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `version` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `payment` DROP COLUMN `occurredAt`,
    ADD COLUMN `method` VARCHAR(191) NOT NULL,
    ADD COLUMN `paidAt` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `Payment_paidAt_idx` ON `Payment`(`paidAt`);

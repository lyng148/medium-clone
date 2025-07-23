/*
  Warnings:

  - You are about to drop the column `commentCount` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `favoriteCount` on the `Article` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Article` DROP COLUMN `commentCount`,
    DROP COLUMN `favoriteCount`;

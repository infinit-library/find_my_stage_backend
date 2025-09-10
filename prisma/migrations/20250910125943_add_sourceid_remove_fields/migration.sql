/*
  Warnings:

  - You are about to drop the column `category` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `events` table. All the data in the column will be lost.
  - The `sourceId` column on the `events` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "category",
DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "sourceId",
ADD COLUMN     "sourceId" INTEGER;

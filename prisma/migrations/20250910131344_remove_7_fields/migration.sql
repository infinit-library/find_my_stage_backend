/*
  Warnings:

  - You are about to drop the column `currentParticipants` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `dateTime` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `maxParticipants` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `priceDisplay` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `venue` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "currentParticipants",
DROP COLUMN "dateTime",
DROP COLUMN "maxParticipants",
DROP COLUMN "price",
DROP COLUMN "priceDisplay",
DROP COLUMN "venue";

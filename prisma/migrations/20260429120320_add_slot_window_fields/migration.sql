/*
  Warnings:

  - You are about to drop the column `scheduledAt` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `slotEnd` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slotStart` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "scheduledAt",
ADD COLUMN     "slotEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "slotStart" TIMESTAMP(3) NOT NULL;

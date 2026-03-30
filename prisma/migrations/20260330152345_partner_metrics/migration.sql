-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "activeBookings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "todayCompletedBookings" INTEGER NOT NULL DEFAULT 0;

/*
  Warnings:

  - The `wifiaccesspoints` column on the `PxLocationEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PxLocationEvent" DROP COLUMN "wifiaccesspoints",
ADD COLUMN     "wifiaccesspoints" INTEGER;

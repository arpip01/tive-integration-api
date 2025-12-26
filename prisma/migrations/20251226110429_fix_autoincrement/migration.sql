/*
  Warnings:

  - The primary key for the `PxLocationEvent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PxLocationEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `cellulardbm` on the `PxLocationEvent` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - The `wifiaccesspoints` column on the `PxLocationEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PxSensorEvent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PxSensorEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `RawWebhookEvent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `RawWebhookEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `timestamp` on the `PxLocationEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `timestamp` on the `PxSensorEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `deviceImei` on table `RawWebhookEvent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `entryTimeEpoch` on table `RawWebhookEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PxLocationEvent" DROP CONSTRAINT "PxLocationEvent_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "deviceid" DROP NOT NULL,
DROP COLUMN "timestamp",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL,
ALTER COLUMN "locationaccuracy" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "batterylevel" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "cellulardbm" SET DATA TYPE INTEGER,
DROP COLUMN "wifiaccesspoints",
ADD COLUMN     "wifiaccesspoints" JSONB,
ADD CONSTRAINT "PxLocationEvent_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PxSensorEvent" DROP CONSTRAINT "PxSensorEvent_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "deviceid" DROP NOT NULL,
DROP COLUMN "timestamp",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "type" DROP NOT NULL,
ADD CONSTRAINT "PxSensorEvent_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "RawWebhookEvent" DROP CONSTRAINT "RawWebhookEvent_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "deviceImei" SET NOT NULL,
ALTER COLUMN "entryTimeEpoch" SET NOT NULL,
ALTER COLUMN "warnings" SET DATA TYPE TEXT,
ADD CONSTRAINT "RawWebhookEvent_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "PxLocationEvent_deviceimei_timestamp_provider_key" ON "PxLocationEvent"("deviceimei", "timestamp", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "PxSensorEvent_deviceimei_timestamp_provider_key" ON "PxSensorEvent"("deviceimei", "timestamp", "provider");

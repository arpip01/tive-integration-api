-- CreateTable
CREATE TABLE "RawWebhookEvent" (
    "id" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "deviceImei" TEXT,
    "deviceName" TEXT,
    "entryTimeEpoch" BIGINT,
    "payload" JSONB NOT NULL,
    "warnings" JSONB,

    CONSTRAINT "RawWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PxSensorEvent" (
    "id" TEXT NOT NULL,
    "deviceid" TEXT NOT NULL,
    "deviceimei" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "lightlevel" DOUBLE PRECISION,
    "payload" JSONB NOT NULL,

    CONSTRAINT "PxSensorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PxLocationEvent" (
    "id" TEXT NOT NULL,
    "deviceid" TEXT NOT NULL,
    "deviceimei" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationaccuracy" INTEGER,
    "locationsource" TEXT,
    "batterylevel" INTEGER,
    "cellulardbm" DOUBLE PRECISION,
    "wifiaccesspoints" INTEGER,
    "payload" JSONB NOT NULL,

    CONSTRAINT "PxLocationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PxSensorEvent_deviceimei_timestamp_provider_key" ON "PxSensorEvent"("deviceimei", "timestamp", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "PxLocationEvent_deviceimei_timestamp_provider_key" ON "PxLocationEvent"("deviceimei", "timestamp", "provider");

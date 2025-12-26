import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  TiveSchema,
  validateLatLng,
  timestampWarnings,
  toPxLocation,
  toPxSensor,
} from "@/lib/tive";

export const runtime = "nodejs";

// Add CORS headers so localhost:3001 can call this endpoint
function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "http://localhost:3001");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  return res;
}

// CORS preflight handler – must always succeed (no auth here)
export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// Main webhook handler
export async function POST(req: Request) {
  // 1) API key auth
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
    return withCors(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  // 2) Parse JSON body
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return withCors(
      NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    );
  }

  // 3) Validate payload against Tive schema
  const parsed = TiveSchema.safeParse(json);
  if (!parsed.success) {
    return withCors(
      NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const tive = parsed.data;

  // 4) Latitude / longitude validation
  const latErr = validateLatLng(
    tive.Location.Latitude,
    tive.Location.Longitude
  );
  if (latErr) {
    return withCors(
      NextResponse.json({ error: latErr }, { status: 400 })
    );
  }

  // 5) Transform into internal shapes
  const sensor = toPxSensor(tive);
  const location = toPxLocation(tive);
  const warnings = timestampWarnings(tive.EntryTimeEpoch);

  // 6) Store raw webhook event
  await prisma.rawWebhookEvent.create({
    data: {
      provider: "Tive",
      deviceImei: tive.DeviceId,
      deviceName: tive.DeviceName,
      entryTimeEpoch: BigInt(tive.EntryTimeEpoch),
      payload: tive,
      warnings: warnings && warnings.length > 0 ? warnings.join('; ') : null,
    },
  });

  // 7) Upsert sensor event
  const sensorRow = await prisma.pxSensorEvent.upsert({
    where: {
      deviceimei_timestamp_provider: {
        deviceimei: sensor.deviceimei,
        timestamp: sensor.timestamp,
        provider: sensor.provider,
      },
    },
    create: sensor,
    update: sensor,
  });

  // 8) Upsert location event
  const locationRow = await prisma.pxLocationEvent.upsert({
    where: {
      deviceimei_timestamp_provider: {
        deviceimei: location.deviceimei,
        timestamp: location.timestamp,
        provider: location.provider,
      },
    },
    create: location,
    update: location,
  });

  // 9) Success response
  return withCors(
    NextResponse.json({
      status: "ok",
      sensorEventId: sensorRow.id,
      locationEventId: locationRow.id,
      warnings,
    })
  );
}

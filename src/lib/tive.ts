import { z } from "zod";

export const TiveSchema = z.object({
  DeviceId: z.string().min(1),
  DeviceName: z.string().min(1),
  EntryTimeEpoch: z.number().int().nonnegative(),
  Temperature: z.object({
    Celsius: z.number(),
  }),
  Location: z.object({
    Latitude: z.number(),
    Longitude: z.number(),
    FormattedAddress: z.string().nullable().optional(),
    LocationMethod: z.string().nullable().optional(),
    Accuracy: z
      .object({
        Meters: z.number().nullable().optional(),
      })
      .nullable()
      .optional(),
    WifiAccessPointUsedCount: z.number().int().nullable().optional(),
  }),
  Humidity: z
    .object({
      Percentage: z.number(),
    })
    .nullable()
    .optional(),
  Light: z
    .object({
      Lux: z.number(),
    })
    .nullable()
    .optional(),
  Battery: z
    .object({
      Percentage: z.number().int().min(0).max(100),
    })
    .nullable()
    .optional(),
  Cellular: z
    .object({
      Dbm: z.number(),
    })
    .nullable()
    .optional(),
});

export type TivePayload = z.infer<typeof TiveSchema>;

export function validateLatLng(lat: number, lng: number): string | null {
  if (lat < -90 || lat > 90) return "Invalid latitude (must be -90..90)";
  if (lng < -180 || lng > 180) return "Invalid longitude (must be -180..180)";
  return null;
}

export function timestampWarnings(epochMs: number): string[] {
  const now = Date.now();
  const warnings: string[] = [];
  if (epochMs > now + 24 * 60 * 60 * 1000) warnings.push("Timestamp far in the future");
  if (epochMs < now - 5 * 365 * 24 * 60 * 60 * 1000) warnings.push("Timestamp very old");
  return warnings;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

export function toPxSensor(t: TivePayload) {
  return {
    deviceimei: t.DeviceId,
    deviceid: t.DeviceName,  // ✅ Extract to top level
    timestamp: new Date(t.EntryTimeEpoch),
    provider: "Tive",
    type: "Active",  // ✅ Extract to top level
    temperature: r2(t.Temperature.Celsius),  // ✅ Extract to top level
    humidity: t.Humidity?.Percentage != null ? r1(t.Humidity.Percentage) : null,  // ✅ Extract to top level
    lightlevel: t.Light?.Lux != null ? r1(t.Light.Lux) : null,  // ✅ Extract to top level
    payload: {
      device_id: t.DeviceName,
      device_imei: t.DeviceId,
      timestamp: t.EntryTimeEpoch,
      provider: "Tive",
      type: "Active",
      temperature: r2(t.Temperature.Celsius),
      humidity: t.Humidity?.Percentage != null ? r1(t.Humidity.Percentage) : null,
      light_level: t.Light?.Lux != null ? r1(t.Light.Lux) : null,
    },
  };
}

export function toPxLocation(t: TivePayload) {
  return {
    deviceimei: t.DeviceId,
    deviceid: t.DeviceName,  // ✅ Extract to top level
    timestamp: new Date(t.EntryTimeEpoch),
    provider: "Tive",
    type: "Active",  // ✅ Extract to top level
    latitude: t.Location.Latitude,  // ✅ Extract to top level
    longitude: t.Location.Longitude,  // ✅ Extract to top level
    locationaccuracy: t.Location.Accuracy?.Meters ?? null,  // ✅ Extract to top level
    locationsource: t.Location.LocationMethod ?? null,  // ✅ Extract to top level
    batterylevel: t.Battery?.Percentage ?? null,  // ✅ Extract to top level
    cellulardbm: t.Cellular?.Dbm ?? null,  // ✅ Extract to top level
    wifiaccesspoints: t.Location.WifiAccessPointUsedCount ?? null,  // ✅ Extract to top level
    payload: {
      device_id: t.DeviceName,
      device_imei: t.DeviceId,
      timestamp: t.EntryTimeEpoch,
      provider: "Tive",
      type: "Active",
      latitude: t.Location.Latitude,
      longitude: t.Location.Longitude,
      location_accuracy: t.Location.Accuracy?.Meters ?? null,
      location_source: t.Location.LocationMethod ?? null,
      battery_level: t.Battery?.Percentage ?? null,
      cellular_dbm: t.Cellular?.Dbm ?? null,
      wifi_access_points: t.Location.WifiAccessPointUsedCount ?? null,
    },
  };
}

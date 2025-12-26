import { describe, it, expect } from '@jest/globals';
import {
  TiveSchema,
  validateLatLng,
  timestampWarnings,
  toPxSensor,
  toPxLocation,
  type TivePayload,
} from '../src/lib/tive';

describe('TiveSchema Validation', () => {
  const validPayload = {
    DeviceId: '863257063350583',
    DeviceName: 'A571992',
    EntryTimeEpoch: 1739215646000,
    Temperature: { Celsius: 10.078125 },
    Location: {
      Latitude: 40.810562,
      Longitude: -73.879285,
      FormattedAddress: '114 Hunts Point Market, Bronx, NY 10474, USA',
      LocationMethod: 'wifi',
      Accuracy: { Meters: 23 },
      WifiAccessPointUsedCount: 5,
    },
    Humidity: { Percentage: 38.70000076293945 },
    Light: { Lux: 0 },
    Battery: { Percentage: 65 },
    Cellular: { Dbm: -100 },
  };

  it('should validate a complete valid payload', () => {
    const result = TiveSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('should reject payload with missing DeviceId', () => {
    const invalid = { ...validPayload, DeviceId: '' };
    const result = TiveSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject payload with missing DeviceName', () => {
    const { DeviceName, ...invalid } = validPayload;
    const result = TiveSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject negative EntryTimeEpoch', () => {
    const invalid = { ...validPayload, EntryTimeEpoch: -1 };
    const result = TiveSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject non-integer EntryTimeEpoch', () => {
    const invalid = { ...validPayload, EntryTimeEpoch: 123.456 };
    const result = TiveSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid Battery percentage > 100', () => {
    const invalid = {
      ...validPayload,
      Battery: { Percentage: 101 },
    };
    const result = TiveSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid Battery percentage < 0', () => {
    const invalid = {
      ...validPayload,
      Battery: { Percentage: -1 },
    };
    const result = TiveSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should accept payload with optional fields missing', () => {
    const minimal = {
      DeviceId: '863257063350583',
      DeviceName: 'A571992',
      EntryTimeEpoch: 1739215646000,
      Temperature: { Celsius: 10.0 },
      Location: {
        Latitude: 40.810562,
        Longitude: -73.879285,
      },
    };
    const result = TiveSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('should accept null optional nested objects', () => {
    const withNulls = {
      ...validPayload,
      Humidity: null,
      Light: null,
      Battery: null,
      Cellular: null,
    };
    const result = TiveSchema.safeParse(withNulls);
    expect(result.success).toBe(true);
  });
});

describe('validateLatLng', () => {
  it('should return null for valid coordinates', () => {
    expect(validateLatLng(40.810562, -73.879285)).toBeNull();
    expect(validateLatLng(0, 0)).toBeNull();
    expect(validateLatLng(90, 180)).toBeNull();
    expect(validateLatLng(-90, -180)).toBeNull();
  });

  it('should reject latitude > 90', () => {
    const error = validateLatLng(91, 0);
    expect(error).toContain('latitude');
  });

  it('should reject latitude < -90', () => {
    const error = validateLatLng(-91, 0);
    expect(error).toContain('latitude');
  });

  it('should reject longitude > 180', () => {
    const error = validateLatLng(0, 181);
    expect(error).toContain('longitude');
  });

  it('should reject longitude < -180', () => {
    const error = validateLatLng(0, -181);
    expect(error).toContain('longitude');
  });

  it('should handle edge cases at boundaries', () => {
    expect(validateLatLng(90.0, 180.0)).toBeNull();
    expect(validateLatLng(-90.0, -180.0)).toBeNull();
  });
});

describe('timestampWarnings', () => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneYear = 365 * oneDay;

  it('should return no warnings for recent timestamps', () => {
    const warnings = timestampWarnings(now);
    expect(warnings).toHaveLength(0);
  });

  it('should warn about far future timestamps', () => {
    const farFuture = now + 2 * oneDay;
    const warnings = timestampWarnings(farFuture);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('future');
  });

  it('should warn about very old timestamps', () => {
    const veryOld = now - 6 * oneYear;
    const warnings = timestampWarnings(veryOld);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('old');
  });

  it('should not warn about timestamps within acceptable range', () => {
    const yesterday = now - oneDay;
    const warnings = timestampWarnings(yesterday);
    expect(warnings).toHaveLength(0);
  });
});

describe('toPxSensor', () => {
  const sampleTive: TivePayload = {
    DeviceId: '863257063350583',
    DeviceName: 'A571992',
    EntryTimeEpoch: 1739215646000,
    Temperature: { Celsius: 10.078125 },
    Location: {
      Latitude: 40.810562,
      Longitude: -73.879285,
    },
    Humidity: { Percentage: 38.70000076293945 },
    Light: { Lux: 0 },
    Battery: { Percentage: 65 },
    Cellular: { Dbm: -100 },
  };

  it('should transform complete payload correctly', () => {
    const result = toPxSensor(sampleTive);
    
    expect(result.deviceimei).toBe('863257063350583');
    expect(result.provider).toBe('Tive');
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.timestamp.getTime()).toBe(1739215646000);
    
    expect(result.payload.device_id).toBe('A571992');
    expect(result.payload.device_imei).toBe('863257063350583');
    expect(result.payload.provider).toBe('Tive');
    expect(result.payload.type).toBe('Active');
  });

  it('should round temperature to 2 decimal places', () => {
    const result = toPxSensor(sampleTive);
    expect(result.payload.temperature).toBe(10.08);
  });

  it('should round humidity to 1 decimal place', () => {
    const result = toPxSensor(sampleTive);
    expect(result.payload.humidity).toBe(38.7);
  });

  it('should round light level to 1 decimal place', () => {
    const result = toPxSensor(sampleTive);
    expect(result.payload.light_level).toBe(0);
  });

  it('should handle missing optional fields', () => {
    const minimal: TivePayload = {
      DeviceId: '863257063350583',
      DeviceName: 'A571992',
      EntryTimeEpoch: 1739215646000,
      Temperature: { Celsius: 10.0 },
      Location: {
        Latitude: 40.810562,
        Longitude: -73.879285,
      },
    };
    
    const result = toPxSensor(minimal);
    expect(result.payload.humidity).toBeNull();
    expect(result.payload.light_level).toBeNull();
  });

  it('should handle null Humidity gracefully', () => {
    const withNull = { ...sampleTive, Humidity: null };
    const result = toPxSensor(withNull);
    expect(result.payload.humidity).toBeNull();
  });

  it('should handle null Light gracefully', () => {
    const withNull = { ...sampleTive, Light: null };
    const result = toPxSensor(withNull);
    expect(result.payload.light_level).toBeNull();
  });

it('should preserve timestamp correctly', () => {
  const result = toPxLocation(sampleTive);
  const timestamp = new Date(result.payload.timestamp);
  expect(timestamp.toISOString()).toBe('2025-02-10T19:27:26.000Z');
});
});

describe('toPxLocation', () => {
  const sampleTive: TivePayload = {
    DeviceId: '863257063350583',
    DeviceName: 'A571992',
    EntryTimeEpoch: 1739215646000,
    Temperature: { Celsius: 10.078125 },
    Location: {
      Latitude: 40.810562,
      Longitude: -73.879285,
      FormattedAddress: '114 Hunts Point Market, Bronx, NY 10474, USA',
      LocationMethod: 'wifi',
      Accuracy: { Meters: 23 },
      WifiAccessPointUsedCount: 5,
    },
    Humidity: { Percentage: 38.7 },
    Light: { Lux: 0 },
    Battery: { Percentage: 65 },
    Cellular: { Dbm: -100 },
  };

  it('should transform complete payload correctly', () => {
    const result = toPxLocation(sampleTive);
    
    expect(result.deviceimei).toBe('863257063350583');
    expect(result.provider).toBe('Tive');
    expect(result.timestamp).toBeInstanceOf(Date);
    
    expect(result.payload.device_id).toBe('A571992');
    expect(result.payload.device_imei).toBe('863257063350583');
    expect(result.payload.provider).toBe('Tive');
    expect(result.payload.type).toBe('Active');
  });

  it('should preserve exact latitude and longitude', () => {
    const result = toPxLocation(sampleTive);
    expect(result.payload.latitude).toBe(40.810562);
    expect(result.payload.longitude).toBe(-73.879285);
  });

  it('should extract location metadata correctly', () => {
    const result = toPxLocation(sampleTive);
    expect(result.payload.location_accuracy).toBe(23);
    expect(result.payload.location_source).toBe('wifi');
    expect(result.payload.wifi_access_points).toBe(5);
  });

  it('should extract battery and cellular data', () => {
    const result = toPxLocation(sampleTive);
    expect(result.payload.battery_level).toBe(65);
    expect(result.payload.cellular_dbm).toBe(-100);
  });

  it('should handle missing optional location fields', () => {
    const minimal: TivePayload = {
      DeviceId: '863257063350583',
      DeviceName: 'A571992',
      EntryTimeEpoch: 1739215646000,
      Temperature: { Celsius: 10.0 },
      Location: {
        Latitude: 40.810562,
        Longitude: -73.879285,
      },
    };
    
    const result = toPxLocation(minimal);
    expect(result.payload.location_accuracy).toBeNull();
    expect(result.payload.location_source).toBeNull();
    expect(result.payload.battery_level).toBeNull();
    expect(result.payload.cellular_dbm).toBeNull();
    expect(result.payload.wifi_access_points).toBeNull();
  });

  it('should handle null Battery gracefully', () => {
    const withNull = { ...sampleTive, Battery: null };
    const result = toPxLocation(withNull);
    expect(result.payload.battery_level).toBeNull();
  });

  it('should handle null Cellular gracefully', () => {
    const withNull = { ...sampleTive, Cellular: null };
    const result = toPxLocation(withNull);
    expect(result.payload.cellular_dbm).toBeNull();
  });

  it('should handle missing Accuracy object', () => {
    const noAccuracy = {
      ...sampleTive,
      Location: {
        ...sampleTive.Location,
        Accuracy: null,
      },
    };
    const result = toPxLocation(noAccuracy);
    expect(result.payload.location_accuracy).toBeNull();
  });

it('should preserve timestamp correctly', () => {
  const result = toPxLocation(sampleTive);
  const timestamp = new Date(result.payload.timestamp);
  expect(timestamp.toISOString()).toBe('2025-02-10T19:27:26.000Z');
});
});

describe('Edge Cases & Error Handling', () => {
  it('should handle extreme temperature values', () => {
    const extreme: TivePayload = {
      DeviceId: '123',
      DeviceName: 'Test',
      EntryTimeEpoch: 1700000000000,
      Temperature: { Celsius: -273.15 },
      Location: { Latitude: 0, Longitude: 0 },
    };
    
    const result = toPxSensor(extreme);
    expect(result.payload.temperature).toBe(-273.15);
  });

  it('should handle very precise decimal rounding', () => {
    const precise: TivePayload = {
      DeviceId: '123',
      DeviceName: 'Test',
      EntryTimeEpoch: 1700000000000,
      Temperature: { Celsius: 25.6789123 },
      Location: { Latitude: 0, Longitude: 0 },
      Humidity: { Percentage: 67.8912 },
    };
    
    const result = toPxSensor(precise);
    expect(result.payload.temperature).toBe(25.68);
    expect(result.payload.humidity).toBe(67.9);
  });

  it('should handle zero values correctly', () => {
    const zeros: TivePayload = {
      DeviceId: '123',
      DeviceName: 'Test',
      EntryTimeEpoch: 1700000000000,
      Temperature: { Celsius: 0 },
      Location: { Latitude: 0, Longitude: 0 },
      Humidity: { Percentage: 0 },
      Light: { Lux: 0 },
      Battery: { Percentage: 0 },
      Cellular: { Dbm: 0 },
    };
    
    const sensor = toPxSensor(zeros);
    const location = toPxLocation(zeros);
    
    expect(sensor.payload.temperature).toBe(0);
    expect(sensor.payload.humidity).toBe(0);
    expect(location.payload.battery_level).toBe(0);
  });
});

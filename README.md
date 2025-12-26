# Tive Integration API

A production-ready webhook receiver that transforms Tive IoT sensor data into PAXAFE format and persists to PostgreSQL.

##  Live Demo

**API Endpoint:** `https://tive-integration-api.vercel.app/api/webhook/tive`

##  Features

- Receives and validates Tive webhook payloads
- Transforms to PAXAFE sensor and location formats
- Stores raw events + normalized data in PostgreSQL
- API key authentication
- Comprehensive test suite (39 tests)
- Schema validation with Zod
- Duplicate detection via unique constraints
- CORS support for development

##  Architecture

### Data Flow
Tive Webhook → Validation → Transformation → PostgreSQL
↓
[Raw, Sensor, Location Tables]



### Database Schema

**3-Table Design:**

1. **RawWebhookEvent** - Stores complete incoming payloads
2. **PxSensorEvent** - Normalized sensor data (temperature, humidity, light)
3. **PxLocationEvent** - Normalized location data (GPS, battery, cellular)

**Why this design?**
- Raw events enable debugging and reprocessing
- Normalized tables enable efficient querying
- Unique constraints prevent duplicates
- Full payload preserved in JSON columns

## ️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Validation:** Zod
- **Testing:** Jest + ts-jest
- **Deployment:** Vercel

##  Installation

Clone repository
git clone https://github.com/arpip01/tive-integration-api.git
cd tive-integration-api

Install dependencies
npm install

Setup environment variables
cp .env.example .env

Edit .env with your credentials


##  Environment Variables

Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

API Security
WEBHOOK_API_KEY="your-secret-key-here"



##  Local Development

Run database migrations
npx prisma migrate dev

Start development server
npm run dev

Run tests
npm test

Run tests in watch mode
npm run test:watch



## 📡 API Usage

### Endpoint
POST /api/webhook/tive



### Headers
Content-Type: application/json
x-api-key: your-secret-key



### Request Body
{
"DeviceId": "863257063350583",
"DeviceName": "A571992",
"EntryTimeEpoch": 1739215646000,
"Temperature": {
"Celsius": 10.078125
},
"Location": {
"Latitude": 40.810562,
"Longitude": -73.879285,
"LocationMethod": "wifi",
"Accuracy": { "Meters": 23 },
"WifiAccessPointUsedCount": 5
},
"Humidity": { "Percentage": 38.7 },
"Light": { "Lux": 0 },
"Battery": { "Percentage": 65 },
"Cellular": { "Dbm": -100 }
}



### Success Response
{
"status": "ok",
"sensorEventId": 1,
"locationEventId": 1,
"warnings": []
}



## 🧪 Testing

Run all tests
npm test

Run with coverage
npm test -- --coverage



**Test Coverage:**
- Schema validation (9 tests)
- Coordinate validation (6 tests)
- Timestamp warnings (4 tests)
- Sensor transformation (9 tests)
- Location transformation (10 tests)
- Edge cases (4 tests)

## 🎯 Design Decisions

### 1. **Synchronous Processing**
Chose synchronous response for simplicity and immediate feedback. For production scale:
- Consider async processing with message queues
- Implement retry mechanisms
- Add rate limiting

### 2. **Upsert Strategy**
Uses `deviceimei + timestamp + provider` as compound unique key:
- Prevents duplicate events
- Allows reprocessing with same data
- Idempotent by design

### 3. **Data Precision**
- Temperature: 2 decimal places (per PAXAFE schema)
- Humidity/Light: 1 decimal place
- Coordinates: Full precision preserved

### 4. **Error Handling**
- Validates schema before processing
- Checks coordinate bounds (-90/90, -180/180)
- Warns on suspicious timestamps
- Returns detailed error messages

### 5. **Timestamp Warnings**
Flags potentially incorrect data:
- Future timestamps (>24h ahead)
- Very old timestamps (>5 years)

## 📊 Database Queries

-- Get latest sensor readings
SELECT * FROM "PxSensorEvent"
ORDER BY timestamp DESC LIMIT 10;

-- Find devices with high temperature
SELECT deviceid, temperature
FROM "PxSensorEvent"
WHERE temperature > 25;

-- Location history for device
SELECT * FROM "PxLocationEvent"
WHERE deviceimei = '863257063350583'
ORDER BY timestamp DESC;



## 🚢 Deployment

Deploy to Vercel
vercel --prod

Run migrations on production
npx prisma migrate deploy


## 📝 Schema Files

- `tive-incoming-schema.json` - Tive webhook format
- `px-sensor-schema.json` - PAXAFE sensor format
- `px-location-schema.json` - PAXAFE location format

## 🐛 Known Limitations

1. No retry mechanism for failed database writes
2. No rate limiting on webhook endpoint
3. CORS currently allows localhost only
4. No monitoring/alerting integration

## 🔮 Future Enhancements

- [ ] Add webhook signature verification
- [ ] Implement async processing with Bull/BullMQ
- [ ] Add Prometheus metrics
- [ ] Implement circuit breaker pattern
- [ ] Add comprehensive logging (Winston/Pino)
- [ ] Real-time dashboard with WebSockets
- [ ] Multi-provider support (beyond Tive)

## 📄 License

MIT

## 👤 Author

Arpit Patel -  Phase 2 Take-Home Exercise

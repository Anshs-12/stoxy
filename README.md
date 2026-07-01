<div align="center">

# Stoxy Finance

A backend REST API and WebSocket server for live stock tracking, portfolio management, and watchlists — built with Spring Boot and Java.
Handles live market feeds, OAuth2 user authentication, rate limiting, and investment portfolios.

![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=java&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.8-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-OAUTH2-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Stateless-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![WebSockets](https://img.shields.io/badge/WebSockets-Live_Data-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-3.8+-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-UI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

### Live Demo
**[https://stoxy-finance.vercel.app](https://stoxy-finance.vercel.app)**

### API Documentation
**[https://stoxy-finance.onrender.com/api/v2/swagger-ui/index.html](https://stoxy-finance.onrender.com/api/v2/swagger-ui/index.html)**
</div>

---

## How the Code is Organized

```text
live-stock-checker/
├── src/main/java/com/stockChecker/live_stock_checker/
│   ├── config/             — Rate limiting, Redis, and Auth configs
│   ├── controller/         — REST Endpoints (Auth, Portfolio, Ticker, Chart, Market, etc.)
│   ├── exceptions/         — Custom global exception handling
│   ├── mapper/             — MapStruct DTO mappings
│   ├── model/               — Database Entities (User, Stock, Portfolio, etc.)
│   ├── payload/             — DTOs for requests and responses
│   ├── repository/         — Spring Data JPA Repositories
│   ├── security/            — JWT, Google OAuth2 & WebSecurityConfig
│   ├── service/              — Core business logic layer
│   ├── startup/              — App initialization (StockDataSeeder)
│   └── websocket/            — Live Upstox WSS market data handlers + browser broadcast layer
├── src/main/resources/
│   └── application.yaml    — Environment variables & app properties
├── pom.xml                         — Maven dependencies
└── README.md
```

---

## Architecture

Every request goes through these layers in order:

```text
┌───────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                           │
│                  Cookie: JWT (HttpOnly)                           │
└───────────────────────────────────────────────────────────────────┘
                             │ HTTPS / WSS
                             │
┌───────────────────────────────────────────────────────────────────┐
│                     SECURITY & ROUTING                            │
│     RateLimitFilter → AuthTokenFilter → WebSecurityConfig         │
│     (Bucket4j/Redis)        (JWT)              (OAuth2/CORS)      │
└───────────────────────────────────────────────────────────────────┘
                             │
                             │
┌───────────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                               │
│     Auth    │    Stock    │  Portfolio  │   Ticker                │
│    Index    │  Watchlist  │    Chart    │   Market Status         │
└───────────────────────────────────────────────────────────────────┘
                             │
                             │
┌───────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                                 │
│      Where all the core business logic and caching lives          │
└───────────────────────────────────────────────────────────────────┘
                             │                        │
                             │                        │
┌────────────────────────────────────────┐    ┌───────────────────────┐
│          REPOSITORY LAYER              │    │   EXTERNAL APIS       │
│             (Spring Data JPA)          │    │    Upstox API         │
└────────────────────────────────────────┘    └───────────────────────┘
                             │                        │
             ┌─────────────────────────────────┐      │
             │                                 │      │
┌──────────────────────────┐       ┌──────────────────────────┐
│      PostgreSQL          │       │         Redis            │
│   (Persistent Data)      │       │ (Caching/Rate Limiting)  │
└──────────────────────────┘       └──────────────────────────┘
```

---

## How Login Works (Google OAuth2 + JWT)

When you log in, Spring handles the Google OAuth2 flow and returns a JWT stored in an HTTP-only cookie. Your browser sends that cookie automatically on every request.

```text
You                             Server                                Google
 │                                │                                      │
 ├── GET /oauth2/authorization ────                                      │
 │                                ├── Redirects to Google Login ──────────
 │                                │                                      │
 │                                ├─── Returns Auth Code ─────────────────
 │                                │                                      │
 │                                ├── Exchanges Code for User Info       │
 │                                ├── Saves User to Database             │
 │                                ├── Generates JWT Token                │
 ├─── Redirect to Dashboard ───── │                                      │
 │    Set-Cookie: jwtCookie       │                                      │
 │                                │                                      │
 ├── GET /api/v2/portfolio ────────                                      │
 │   (cookie sent automatically)  ├── Validates JWT & Rate Limit         │
 ├─── 200 OK ──────────────────── ├── Sends back portfolio data          │
```

---

## Who Can Access What

```text
                    ┌─────────────┐
                    │   PUBLIC    │──── Search Stocks & Indices
                    │ (No Login)  │──── View Live Market Data (LTPC/Full Feed)
                    │             │──── View Chart Data & Market Status
                    │             │──── Access Swagger UI
                    └─────────────┘
                           │
                    ┌─────────────┐
                    │    USER     │──── Create/Manage Watchlists
                    │ (Logged in) │──── Buy/Sell Stocks in Portfolio
                    │             │──── View Transaction History & Export PDF
                    └─────────────┘
```

---

## Database Structure

```text
┌─────────────────┐       ┌─────────────────┐       ┌────────────────────┐
│      users      │       │     stocks      │       │  stock_financials  │
├─────────────────┤       ├─────────────────┤       ├────────────────────┤
│ userId       PK │       │ serialNumber PK │───────── stock_id      FK  │
│ name            │       │ stockSymbol     │       │ (financial data)   │
│ userMailId      │       │ stockName       │       └────────────────────┘
│ authProvider    │       │ exchange        │
└─────────────────┘       │ segment         │       ┌────────────────────┐
         │                │ isin            │       │     company        │
         │                │ upstoxInstrmKey │       └────────────────────┘
         │                └────────────────────────── companyInfo_id PK  │
         │                         │                │ (company details)  │
         │                         │                └────────────────────┘
┌─────────────────┐       ┌─────────────────┐
│  portfolio      │       │ portfolio_stock │
├─────────────────┤       ├─────────────────┤
│ id           PK │────────── id         PK │
│ user_id      FK │       │ portfolio_id FK │
│ createdAt       │       │ stock_id     FK │
└─────────────────┘       │ quantity        │
                          │ avgPrice        │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│ watchlist_table │       │ watchlist_stock │
├─────────────────┤       ├─────────────────┤
│ id           PK │────────── id         PK │
│ name            │       │ watchlist_id FK │
│ createdAt       │       │ stock_id     FK │
│ user_id      FK │       └─────────────────┘
└─────────────────┘
```

*(Note: Additional tables exist for tracking indices and individual portfolio transactions)*

---

## API Endpoints

**Base Path:** `/api/v2`

### Auth
| Method | Endpoint | Who | Description |
|---|---|---|---|
| `GET` | `/oauth2/authorization/google` | Public | Trigger Google Login |
| `GET` | `/auth/userInfo` | User | Get current logged-in user profile |
| `GET` | `/auth/logout` | User | Log out & clear JWT cookie |

### Stocks & Indices
| Method | Endpoint | Who | Description |
|---|---|---|---|
| `GET` | `/stocks/search?query=...` | Public | Search stock by name (Paginated) |
| `POST` | `/stocks/details` | Public | Get detailed stock object |
| `GET` | `/stocks/search/screen` | Public | Screen stocks (PE ratio, sector, etc.) |
| `GET` | `/index/search/{instrumentKey}` | Public | Get Index details by instrument key |
| `GET` | `/index/search?query=...` | Public | Search indices by query |
| `GET` | `/ticker/live/ltpc` | Public | Get live LTPC data |
| `GET` | `/ticker/live/fullFeed` | Public | Get live Full Feed data |

### Charts
| Method | Endpoint | Who | Description |
|---|---|---|---|
| `GET` | `/charts/{instrumentKey}/intraday` | Public | Get intraday candle data for a stock/index |
| `GET` | `/charts/{instrumentKey}/history` | Public | Get historical candle data for a stock/index |

> The 1D chart view tries the intraday endpoint first and falls back to the historical endpoint when intraday data is empty (e.g. right after market rollover at midnight IST).

### Market
| Method | Endpoint | Who | Description |
|---|---|---|---|
| `GET` | `/market/status` | Public | Get current market open/closed status, last closing date, and next opening date |

### Portfolio
| Method | Endpoint | Who | Description |
|---|---|---|---|
| `GET` | `/portfolio/` | User | Get user's current portfolio |
| `POST` | `/portfolio/buyStock` | User | Buy a specific stock |
| `POST` | `/portfolio/sellStock` | User | Sell a specific stock |
| `GET` | `/portfolio/transaction/{stockSymbol}` | User | View transaction history for a specific stock |
| `GET` | `/portfolio/transactions` | User | View all portfolio transactions |
| `GET` | `/portfolio/transactions/export` | User | Export transaction history as PDF |

### Watchlist
| Method | Endpoint | Who | Description |
|---|---|---|---|
| `POST` | `/watchlist/create` | User | Create a new watchlist |
| `GET` | `/watchlist/` | User | List all watchlists for user |
| `GET` | `/watchlist/{watchlistId}` | User | View details of a specific watchlist |
| `DELETE` | `/watchlist/{watchlistId}` | User | Delete a watchlist |
| `POST` | `/watchlist/{watchlistId}/stocks` | User | Add a stock to a watchlist |
| `DELETE` | `/watchlist/{watchlistId}/stocks` | User | Remove a stock from a watchlist |

### WebSocket Streams
Live market data is pushed directly to browser clients over a dedicated WebSocket layer (`BroadcastHandler`), replacing REST polling on the frontend. Clients subscribe to specific instrument keys and only receive ticks for instruments they've subscribed to (with marquee indices always broadcast regardless of subscription state). The market must be open for a connection to be accepted.

**Endpoint:** `ws://localhost:8080/api/v2/wss/market`

**Subscribe message (client → server):**
```json
{
  "guid": "some-client-guid",
  "method": "sub",
  "data": {
    "mode": "ltpc",
    "instrumentKeys": ["NSE_EQ|INE002A01018"]
  }
}
```
* **`mode`**: `"ltpc"` for last-traded-price data, or `"fullFeed"` for the full market depth feed
* **`instrumentKeys`**: list of instrument keys to subscribe to

**Unsubscribe message (client → server):** same shape with `"method": "unsub"`. Marquee indices can't be unsubscribed from.

**Live Tick Payload Example (`LtpcDataDTO`, server → client):**
```json
{
  "instrumentKey": "NSE_EQ|INE002A01018",
  "ltp": 48500.50,
  "ltt": 1709289600000,
  "cp": 48100.00
}
```
* **`ltp`**: Last Traded Price
* **`ltt`**: Last Traded Time (Unix Timestamp)
* **`cp`**: Close Price

> Interactive Swagger UI available at **[http://localhost:8080/api/v2/swagger-ui/index.html](http://localhost:8080/api/v2/swagger-ui/index.html)**

---

## Running Locally

You need Java 21, Maven 3.8+, PostgreSQL, and Redis installed.

```bash
# 1. Clone the repo
git clone https://github.com/your-username/live-stock-checker.git
cd live-stock-checker

# 2. Start your Redis server (ensure it runs on port 6379)
redis-server

# 3. Create the database in PostgreSQL
psql -U postgres -c "CREATE DATABASE stoxy_db;"

# 4. Set up environment variables (see below)
# Note: You can create an application-dev.yaml or pass these in your IDE

# 5. Build and Run the application
mvn clean install
mvn spring-boot:run
```
* **Note:** On the first startup, the `StockDataSeeder` automatically populates the database with initial indices and core stocks so you can begin testing without manual data entry.

App will be running at `http://localhost:8080/api/v2`

---

## Docker Deployment

To spin up the entire application along with its dependencies (PostgreSQL and Redis) simultaneously, you can use Docker Compose. The backend service runs on the `eclipse-temurin:21.0.10_7-jdk` base image.

```bash
# Make sure your Docker daemon is running, then execute:
docker-compose up -d
```
This command automatically provisions the database, launches the Redis cache, and starts the Spring Boot application container in the background. Check logs with `docker-compose logs -f`.

---

## Environment Variables

These values are required by `application.yaml` to run the server:

```properties
# Database
database_url=jdbc:postgresql://localhost:5432/stoxy_db
database_username=postgres
database_password=your_password

# Redis for Caching and Rate Limiting
redis_host=localhost
redis_port=6379
redis_username=
redis_password=

# JWT Authentication
jwtSecretKey=your_base64_secret_here
jwtCookieName=stoxy_jwt_cookie

# Google OAuth2 Credentials
google_auth_clientId=your_google_client_id
google_auth_clientSecret=your_google_client_secret

# Upstox API Credentials (Market Data Feeds)
upstox_api_key=your_upstox_api_key
upstox_api_secret=your_upstox_api_secret
upstox_redirect_uri=https://your-redirect-domain.com/callback
```

---

## Tests

To run the test suite, simply use Maven. You may need to specify an active profile if you use an in-memory database like H2 for testing.

```bash
mvn test                              # run all unit and integration tests
```

---

## Contributing

1. Fork this repo and clone it locally
2. Create a branch → `git checkout -b feature/awesome-new-feature`
3. Ensure you follow the existing MVC structure and formatting
4. Commit with a clear descriptive message → `git commit -m "feat: added live ticker tracking"`
5. Push and open a Pull Request against `main`

Feel free to open an issue first if you're unsure about a structural change.
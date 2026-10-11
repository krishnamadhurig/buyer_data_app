# Buyer Ledger

A responsive web app where users register and sign in with JWT authentication, upload buyer data from CSV or Excel files, and view it in a searchable, paginated table.

**Live demo:** https://buyer-data-app-krishna.onrender.com

## Features

- Sign up with name, email, mobile and password, with client-side and server-side validation, unique email and mobile, and bcrypt-hashed passwords
- Sign in with email or mobile number plus password
- JWT sessions: 10-minute access token, 10-minute idle timeout, logout invalidates the session, and active sessions refresh automatically (refresh token with rotation)
- Protected routes on both the server and the React app
- Upload `.csv`, `.xls` and `.xlsx` files (max 5 MB) with server-side type, size and content validation. Valid rows are stored in MySQL, and invalid rows are reported with row numbers and reasons.
- View buyers in a table with pagination and search by name, email or mobile. On small screens the table becomes cards.
- Role-based access (`user`, `admin`) with an admin-only overview endpoint

## Tech stack

- **Frontend:** React (Vite), React Router
- **Backend:** Node.js, Express (MVC structure)
- **Database:** MySQL 8, accessed with raw SQL through `mysql2`
- **Auth and security:** jsonwebtoken, bcryptjs, helmet, express-rate-limit, cors, cookie-parser
- **Uploads:** multer, csv-parse, SheetJS (xlsx)
- **Tests:** Node's built-in test runner (`node:test`)

## Project structure

```
Buyer-data-app/
├── backend/
│   ├── src/
│   │   ├── config/        database pool and table creation
│   │   ├── controllers/   request handling logic
│   │   ├── middleware/    auth, roles, upload, rate limit, errors
│   │   ├── models/        SQL queries
│   │   ├── routes/        URL to controller mapping
│   │   ├── services/      file parsing
│   │   ├── utils/         validators, tokens
│   │   └── server.js
│   ├── tests/             unit tests
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/           API client (token handling and silent refresh)
│   │   ├── components/
│   │   ├── context/       auth state
│   │   ├── pages/
│   │   └── utils/
│   └── .env.example
├── database/
│   └── schema.sql
└── sample-data/           example CSV files
```

## Prerequisites

- Node.js 18 or newer
- MySQL 8 running locally
- Git

## Getting started

### 1. Clone the repository

```
git clone https://github.com/krishnamadhurig/buyer_data_app.git
cd buyer_data_app
```

### 2. Database setup

The backend creates all tables automatically on startup, so only need an empty database. Either run the schema file or create the database by hand.

```
mysql -u root -p < database/schema.sql
```

or, in MySQL Workbench or a MySQL shell:

```sql
CREATE DATABASE buyer_data_app;
```

`database/schema.sql` contains the full schema (users, sessions, upload_batches, buyers). It can be run at any time because every statement uses `IF NOT EXISTS`.

### 3. Backend setup

```
cd backend
npm install
```

Create environment file from the example and fill the values (table below):

```
copy .env.example .env      
```

Start the server:

```
npm run dev
```

The API runs on `http://localhost:5000`. Check it with `GET http://localhost:5000/api/health`.

### 4. Frontend setup

In a second terminal:

```
cd frontend
npm install
copy .env.example .env      
npm run dev
```

Open `http://localhost:5173`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | API port | `5000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | |
| `DB_NAME` | Database name | `buyer_data_app` |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens. Used a long random string. | |
| `ACCESS_TOKEN_TTL_MIN` | Access token lifetime in minutes | `10` |
| `SESSION_IDLE_TTL_MIN` | Idle timeout of a session in minutes | `10` |
| `COOKIE_SAMESITE` | SameSite attribute of the refresh cookie (`lax`, `strict`, `none`) | `lax` |
| `COOKIE_SECURE` | `true` when served over HTTPS | `false` |
| `CLIENT_ORIGIN` | Exact URL of the frontend, used for CORS | `http://localhost:5173` |
| `AUTH_RATE_LIMIT` | Maximum login and register requests per IP per 15 minutes | `20` |
| `TRUST_PROXY` | Number of reverse proxies in front of the API (0 locally) | `0` |
| `DB_SSL_CA` | CA certificate for a hosted MySQL that requires SSL | |

Generate a secret with:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the API | `http://localhost:5000/api` |

Restart `npm run dev` after changing the frontend `.env`.

## Using the app

1. Open `http://localhost:5173`. The sign-in page opens first. Choose **Sign Up** and create an account.
2. Sign in, then open the **Upload** tab and upload a file. The files in `sample-data/` are ready to try.
3. Open **View buyers** to search and page through the data.

`sample-data/buyers-valid.csv` has 24 valid rows. `sample-data/buyers.csv` includes invalid rows to show validation.

### Upload file format

Required columns: `Name`, `Email`, `Mobile`, `Total Invoice Amount`, `Total Amount Paid`.
Optional columns: `Address`, `Total Amount Due`.

- Mobile numbers must be 10 digits starting with 6 to 9.
- `Total Amount Due` is calculated as invoice minus paid when blank. If it is given and does not match, the row is skipped.
- Paid cannot be more than invoice.
- Uploading the same email again updates that buyer.
- Rows with problems are skipped and listed with their row number and reason. Valid rows in the same file are still saved.

### Making an admin

New accounts have the `user` role. To make an admin, run this in MySQL and sign in again:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## API overview

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | none | Create an account |
| POST | `/api/auth/login` | none | Sign in, returns an access token and sets the refresh cookie |
| POST | `/api/auth/refresh` | refresh cookie | Rotate the refresh token and return a new access token |
| POST | `/api/auth/logout` | refresh cookie | Revoke the session |
| GET | `/api/auth/me` | Bearer token | Current user |
| POST | `/api/buyers/upload` | Bearer token | Upload a CSV or Excel file (form field `file`) |
| GET | `/api/buyers?search=&page=&limit=` | Bearer token | List buyers with search and pagination |
| GET | `/api/admin/overview` | Bearer token, admin | Counts and totals |
| GET | `/api/health` | none | Health check |

## How authentication works

- Login creates a row in `sessions` and returns a 10-minute JWT access token (kept in memory in the browser) and a random refresh token (stored in an httpOnly cookie; only its SHA-256 hash is stored in the database).
- Every protected request verifies the JWT and also checks that its session is still active, so logout and the idle timeout take effect immediately.
- While the user is active, the frontend refreshes about every 7 minutes. Each refresh rotates the refresh token and moves the idle deadline forward. After 10 idle minutes the session is no longer valid.

## Security notes

- Passwords are hashed with bcrypt (cost 12). Login errors are generic, so they do not reveal which emails exist.
- All SQL uses parameterised queries, and search wildcards are escaped.
- Uploads are validated by extension, size and file signature, and are parsed in memory.
- helmet headers, rate limiting on login and register, and a request body size limit.


## Deployment

The live demo runs as a single Render web service (Node) that serves both the API and the built React app, with a free Aiven MySQL database.

- Build command: `cd frontend && npm install && npm run build && cd ../backend && npm install`
- Start command: `cd backend && npm start`
- Set `VITE_API_URL=/api` and the backend variables above, with `COOKIE_SECURE=true`, `TRUST_PROXY=1`, `DB_SSL_CA` set to the Aiven CA certificate, and `CLIENT_ORIGIN` set to the app URL.

The free instance sleeps when idle, so the first request after a pause can take up to a minute.

## Running the tests

```
cd backend
npm test
```

The unit tests use Node's built-in test runner and cover validation, tokens, file checks, file parsing and role checks. They do not need a database.

## Database schema

The full schema is in [`database/schema.sql`](database/schema.sql).

- `users`: accounts, with unique email and mobile and a role
- `sessions`: one row per sign-in, with the hashed refresh token, the idle deadline and a revoked time
- `upload_batches`: one row per uploaded file
- `buyers`: buyer records owned by a user, unique per user by email

Deleting a user also deletes their sessions, uploads and buyers (`ON DELETE CASCADE`).
# PostgreSQL Authentication System

This is a complete authentication system using PostgreSQL for user management and JWT for authentication.

## Features

- User registration with phone number and password
- Login with phone number and password
- JWT-based authentication
- User roles (user, admin, delivery)
- Secure password storage with bcrypt
- Token-based session management

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Database Setup

1. Install PostgreSQL if you haven't already:
   ```
   # For Ubuntu
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # For macOS with Homebrew
   brew install postgresql
   ```

2. Create a new PostgreSQL database:
   ```
   sudo -u postgres psql
   CREATE DATABASE auth_db;
   CREATE USER myuser WITH ENCRYPTED PASSWORD 'mypassword';
   GRANT ALL PRIVILEGES ON DATABASE auth_db TO myuser;
   \q
   ```

### 2. Server Setup

1. Install dependencies:
   ```
   cd server
   npm install
   ```

2. Create a `.env` file in the server directory with the following content:
   ```
   PORT=3000
   DB_USER=myuser
   DB_PASSWORD=mypassword
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=auth_db
   JWT_SECRET=your-secret-key-change-this
   ```

3. Start the server:
   ```
   npm run dev
   ```

### 3. Client Setup

1. Update the API_URL in the AuthContext.tsx file to point to your server:
   ```typescript
   const API_URL = 'http://localhost:3000/api';
   ```

2. Install the required client dependencies:
   ```
   npm install @react-native-async-storage/async-storage expo-secure-store axios
   ```

## API Endpoints

### Authentication

- **POST /api/auth/register** - Register a new user
  ```json
  {
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }
  ```

- **POST /api/auth/login-phone** - Login with phone number
  ```json
  {
    "phoneNumber": "+1234567890",
    "password": "password123"
  }
  ```

- **POST /api/auth/login** - Login with email
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- **GET /api/auth/me** - Get current user info (requires authentication)

- **POST /api/auth/logout** - Logout (requires authentication)

## Security Considerations

- All passwords are hashed using bcrypt before storage
- JWT tokens are used for authentication
- Tokens are stored securely using SecureStore on mobile and localStorage on web
- Input validation is performed on all API endpoints
- Error messages are generic to prevent information leakage

## Database Schema

The users table has the following structure:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Troubleshooting

- **Database connection issues**: Check your PostgreSQL service is running and the credentials in the .env file are correct.
- **JWT errors**: Make sure your JWT_SECRET is set correctly in the .env file.
- **CORS errors**: If you're getting CORS errors, make sure your client is allowed in the CORS configuration.

## License

This project is licensed under the MIT License. 
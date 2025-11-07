# International Payment System

A secure and scalable international payment processing system with a React frontend and Node.js/Express backend.

## Features

- User authentication (JWT)
- Secure payment processing
- Transaction history
- Admin dashboard
- Responsive design
- API documentation

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher) or yarn
- SQLite (for development)

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` directory and configure the environment variables (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `frontend` directory and configure the environment variables (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Development

### Backend

- Run tests: `npm test`
- Lint code: `npm run lint`
- Format code: `npm run format`

### Frontend

- Run tests: `npm test`
- Lint code: `npm run lint`
- Format code: `npm run format`
- Build for production: `npm run build`

## Environment Variables

### Backend

- `PORT` - Port to run the server on (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRES_IN` - JWT expiration time
- `DB_STORAGE` - SQLite database file path
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window in milliseconds
- `RATE_LIMIT_MAX` - Maximum requests per window

### Frontend

- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_DEBUG` - Enable/disable debug mode
- `NODE_ENV` - Environment (development/production)

## Security

- All API routes are rate-limited
- JWT authentication with secure, HTTP-only cookies
- Input validation and sanitization
- Helmet.js for securing HTTP headers
- XSS protection
- CSRF protection

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

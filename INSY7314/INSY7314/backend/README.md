# Secure Payment System Backend

This is the backend for the Secure Payment System, built with Node.js, Express, and Sequelize.

## Features

- **User Authentication**
  - JWT-based authentication
  - Role-based access control (Admin/User)
  - Secure password hashing with bcrypt
  - Account lockout after multiple failed attempts

- **Security**
  - Helmet.js for security headers
  - Rate limiting
  - CORS protection
  - Input validation and sanitization
  - SQL injection prevention
  - XSS protection
  - CSRF protection
  - Content Security Policy (CSP)

- **API Documentation**
  - RESTful API design
  - Error handling and logging
  - Request validation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQLite (for development)
- MySQL/PostgreSQL (for production)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd INSY7314/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and update the values:
   ```bash
   cp .env.example .env
   ```

4. Initialize the database and create admin user:
   ```bash
   node scripts/init-db.js
   ```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user (Admin only)
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/auth/logout` - Logout user

### Users
- `GET /api/v1/users` - Get all users (Admin only)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (Admin only)
- `POST /api/v1/users/:id/change-password` - Change password

## Environment Variables

See `.env.example` for all available environment variables.

## Testing

```bash
npm test
```

## Linting

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

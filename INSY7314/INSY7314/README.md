# International Payment System

A secure web application for international payments with React frontend and Node.js/Express backend.

## Features

### Customer Portal (React Frontend)
- User registration and login with JWT authentication
- Dashboard with payment overview
- Create new international payments with validation
- Payment history with filtering
- Protected routes and input validation

### Backend API (Node.js/Express)
- JWT-based authentication with bcrypt password hashing
- SQLite database with encrypted sensitive data
- Input validation using Joi
- Rate limiting and CORS protection
- RESTful API endpoints

### Security Features
- Password hashing with bcrypt (12 rounds)
- JWT tokens with 24-hour expiration
- Input whitelisting with regex patterns
- Encryption of sensitive data at rest (AES-256-GCM)
- Rate limiting and CORS protection
- Helmet.js for security headers

## Project Structure

```
INSY7314/
├── frontend/           # React application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── ...
│   └── package.json
├── backend/            # Node.js API
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation and Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Environment Configuration

**Backend:**
- Copy `.env` file and update the values:
```bash
cd backend
# Edit .env file with your configurations
```

Key environment variables:
- `JWT_SECRET`: Strong secret for JWT signing
- `ENCRYPTION_KEY`: 32-character key for data encryption
- `FRONTEND_URL`: Frontend URL for CORS (e.g., http://localhost:3000)

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
The API will run on http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
The React app will run on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Payments
- `GET /api/payments` - Get user's payments
- `POST /api/payments` - Create new payment
- `GET /api/payments/:id` - Get specific payment

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `fullName` (Encrypted)
- `idNumber` (Encrypted)
- `accountNumber` (Encrypted)
- `username` (Unique)
- `passwordHash` (Hashed & Salted)
- `salt`
- `createdAt`

### Payments Table
- `id` (UUID, Primary Key)
- `userId` (Foreign Key)
- `amount` (Decimal)
- `currency` (String)
- `paymentProvider` (String)
- `beneficiaryAccountNumber` (Encrypted)
- `beneficiarySwiftCode` (Encrypted)
- `beneficiaryName` (Encrypted)
- `status` (Enum: PENDING, VERIFIED, SUBMITTED, FAILED)
- `createdAt`

## Security Implementation

### Password Security
- bcrypt with 12 salt rounds
- Unique salt per user

### Input Validation
- Joi schema validation on all endpoints
- Regex patterns for whitelisted input
- Frontend validation for UX (not trusted)

### Data Protection
- AES-256-GCM encryption for sensitive fields
- JWT tokens with short expiration
- HTTPS enforcement (configure reverse proxy)

### Attack Prevention
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet.js security headers
- SQL injection prevention (parameterized queries)
- XSS protection (React escaping)

## Development

### Available Scripts

**Backend:**
```bash
npm start      # Start production server
npm run dev    # Start with nodemon
npm test       # Run tests
```

**Frontend:**
```bash
npm start      # Start development server
npm run build  # Build for production
npm test       # Run tests
npm run eject  # Eject from Create React App
```

## Deployment

1. **Frontend:** Build the React app for production
   ```bash
   cd frontend
   npm run build
   ```

2. **Backend:** Set production environment variables
   ```bash
   NODE_ENV=production
   ```

3. **Configure HTTPS:** Set up reverse proxy (nginx) with SSL certificate

4. **Database:** Configure production database connection

## Testing

The application includes:
- Input validation testing
- Authentication flow testing
- Payment creation testing
- Security measures verification

## Contributing

1. Follow the existing code structure
2. Implement proper input validation
3. Add appropriate error handling
4. Update documentation for new features
5. Test thoroughly before deployment

## License

Internal Bank Development Team - Proprietary Software

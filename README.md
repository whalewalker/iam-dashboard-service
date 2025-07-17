# IAM Dashboard Backend Service

A comprehensive RESTful service for Identity and Access Management (IAM) built with NestJS, TypeScript, and PostgreSQL.

## 🚀 Features

- **User Management**: Full CRUD operations for users with IAM fields
- **Authentication**: JWT-based authentication with login and profile endpoints
- **Role-Based Access Control (RBAC)**: Admin-only operations protection
- **Swagger Documentation**: Interactive API documentation
- **Security**: Password hashing, JWT expiration, input validation
- **Testing**: Unit and integration tests
- **Logging**: Request and error logging
- **Database**: PostgreSQL with TypeORM migrations

## 📋 Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Security**: bcrypt for password hashing

## 📁 Project Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── auth-response.dto.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   └── appointments/ (bonus)
│       ├── appointments.controller.ts
│       ├── appointments.service.ts
│       ├── appointments.module.ts
│       ├── dto/
│       │   └── create-appointment.dto.ts
│       └── entities/
│           └── appointment.entity.ts
├── common/
│   ├── decorators/
│   │   └── roles.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   └── logging.interceptor.ts
│   └── enums/
│       └── roles.enum.ts
├── config/
│   └── database.config.ts
├── migrations/
│   └── [timestamp]-create-users.ts
├── app.module.ts
└── main.ts
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  roles TEXT[] DEFAULT ARRAY['user'],
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Appointments Table (Bonus)
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date_time TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iam-dashboard-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=iam_dashboard
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=24h
   
   # App
   PORT=3000
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb iam_dashboard
   
   # Run migrations
   npm run migration:run
   
   # (Optional) Seed data
   npm run seed
   ```

5. **Start the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📖 API Documentation

Once the application is running, access Swagger documentation at:
- **Local**: http://localhost:3000/api
- **Interactive docs**: Swagger UI with all endpoints and schemas

## 🔐 API Endpoints

### Authentication
- `POST /auth/login` - User login (returns JWT)
- `GET /auth/profile` - Get current user profile (protected)

### Users
- `GET /users` - Get all users (protected)
- `GET /users/:id` - Get user by ID (protected)
- `POST /users` - Create new user (protected)
- `PUT /users/:id` - Update user (protected)
- `DELETE /users/:id` - Delete user (admin only)

### Appointments (Bonus)
- `GET /appointments` - Get appointments with optional userId filter
- `POST /appointments` - Create new appointment (protected)

## 🔒 Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Input Validation**: class-validator for request validation
4. **RBAC**: Role-based access control
5. **Request Logging**: Comprehensive logging system
6. **CORS**: Cross-origin resource sharing configured

## 🔍 Example Usage

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

### Create User
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword",
    "roles": ["user"]
  }'
```

### Get Users
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Production Considerations

### Monitoring
- **Health Checks**: `/health` endpoint
- **Metrics**: Prometheus integration
- **Logging**: Structured logging with Winston
- **APM**: Application Performance Monitoring

### Deployment
- **Docker**: Containerized deployment
- **CI/CD**: GitHub Actions pipeline
- **Environment**: Production environment variables
- **SSL**: HTTPS configuration

### Security Enhancements
- **Rate Limiting**: API rate limiting
- **SAST**: Static Application Security Testing
- **Dependency Scanning**: Automated vulnerability scanning
- **Secrets Management**: AWS Secrets Manager/HashiCorp Vault

### Database
- **Connection Pooling**: PostgreSQL connection pooling
- **Read Replicas**: Database scaling
- **Backups**: Automated backup strategy
- **Migrations**: Zero-downtime migrations

## 🧪 Testing Strategy

### Unit Tests (5+ tests)
- User service methods
- Authentication logic
- Password hashing
- JWT token generation
- Role validation

### Integration Tests (2+ tests)
- Full authentication flow
- CRUD operations with database
- RBAC enforcement
- API endpoint testing

## 📝 Package.json Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "bcrypt": "^5.1.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "pg": "^8.11.0",
    "typeorm": "^0.3.17",
    "winston": "^3.10.0"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "@types/passport-jwt": "^3.0.9",
    "jest": "^29.0.0",
    "sqlite3": "^5.1.6",
    "supertest": "^6.3.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 🚀 Getting Started Quickly

1. **Quick Setup**:
   ```bash
   npm install
   cp .env.example .env
   npm run migration:run
   npm run start:dev
   ```

2. **Access Swagger**: http://localhost:3000/api

3. **Default Admin User**:
    - Username: `admin`
    - Password: `admin123`

## 📋 Postman Collection

Import the provided Postman collection for testing:
- File: `iam-dashboard.postman_collection.json`
- Environment: `iam-dashboard.postman_environment.json`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.# IAM-Dashboard-Service

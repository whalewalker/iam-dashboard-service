# IAM Dashboard Backend Service

A comprehensive RESTful service for Identity and Access Management (IAM) built with NestJS, TypeScript, and PostgreSQL.

## Features

- **User Management**: Full CRUD operations for users with IAM fields
- **Authentication**: JWT-based authentication with login and profile endpoints
- **Role-Based Access Control (RBAC)**: Admin-only operations protection
- **Swagger Documentation**: Interactive API documentation
- **Security**: Password hashing, JWT expiration, input validation
- **Testing**: Unit and integration tests
- **Logging**: Request and error logging
- **Database**: PostgreSQL with TypeORM migrations

## Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Security**: bcrypt for password hashing

## Project Structure

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


## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/whalewalker/iam-dashboard-service.git
   cd iam-dashboard-service
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
   ```

5. **Start the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Documentation

Once the application is running, access Swagger documentation at:
- **Local**: http://localhost:3000/docs
- **Interactive docs**: Swagger UI with all endpoints and schemas

## API Endpoints

### Authentication
- `POST /auth/login` - User login (returns JWT)
- `GET /auth/profile` - Get current user profile (protected)

### Users
- `GET /users` - Get all users (protected)
- `GET /users/:id` - Get user by ID (protected)
- `POST /users` - Create new user (protected)
- `PUT /users/:id` - Update user (protected)
- `DELETE /users/:id` - Delete user (admin only)

### Appointments
- `GET /appointments` - Get appointments with optional userId filter
- `POST /appointments` - Create new appointment (protected)

## Example Usage

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

## Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Input Validation**: class-validator for request validation
4. **RBAC**: Role-based access control
5. **Request Logging**: Comprehensive logging system
6. **CORS**: Cross-origin resource sharing configured

### Monitoring
- **Health Checks**: `/health` endpoint

## Advanced Features

### Monitoring
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
- **Secrets Management**: AWS Secrets Manager / HashiCorp Vault

### Database
- **Connection Pooling**: PostgreSQL connection pooling
- **Read Replicas**: Database scaling
- **Backups**: Automated backup strategy
- **Migrations**: Zero-downtime migrations

## Testing Strategy

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

## Getting Started Quickly

1. **Quick Setup**:
   ```bash
   npm install
   cp .env.example .env
   npm run migration:run
   npm run start:dev
   ```

2. **Access Swagger**: http://localhost:3000/docs

3. **Default Admin User**:
   - Username: `admin`
   - Password: `admin123`

## Postman Collection

Import the provided Postman collection for testing:
- File: `iam-dashboard.postman_collection.json`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

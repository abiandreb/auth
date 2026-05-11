# JWT + OAuth Authentication Demo Project

A complete authentication system demonstrating modern authentication patterns using ASP.NET Core, React, and Docker.

## Features

- **Email/Password Authentication**: Traditional authentication with secure password hashing (BCrypt)
- **GitHub OAuth Integration**: Social login via GitHub
- **JWT Token Management**: Stateless authentication with access and refresh tokens
- **Token Refresh**: Automatic token refresh for seamless user experience
- **Protected Routes**: Frontend route protection with authentication checks
- **Microservices Architecture**: Dockerized backend, frontend, and database

## Tech Stack

### Backend
- ASP.NET Core 10.0 (Minimal API)
- Entity Framework Core 10.0 + SQL Server
- JWT Bearer Authentication
- BCrypt.Net for password hashing

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- React Router + Axios

### Infrastructure
- Docker + docker-compose
- SQL Server 2022
- Nginx (static file serving + reverse proxy)

## Project Structure

```
Auth/
├── Auth.API/                  # ASP.NET Core backend
│   ├── Configuration/         # JWT and OAuth settings
│   ├── Controllers/           # API endpoints
│   ├── Data/                  # EF Core DbContext
│   ├── Models/                # Entity and DTO models
│   ├── Services/              # Business logic services
│   └── Dockerfile
├── Auth.Frontend/             # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── context/           # Auth context
│   │   ├── services/          # API services
│   │   └── types/             # TypeScript types
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Docker Desktop
- Git
- (Optional) .NET 10 SDK for local development
- (Optional) Node.js 20+ for local development

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Auth
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**

   Edit `.env` and set the following:

   ```env
   # Database password (min 8 chars, include uppercase, lowercase, numbers, special chars)
   DB_SA_PASSWORD=YourStrongPassword123!

   # JWT secret (min 32 characters - CHANGE THIS!)
   JWT_SECRET=your-secret-key-min-32-chars-long-change-in-production-please
   JWT_ISSUER=AuthAPI
   JWT_AUDIENCE=AuthClient

   # GitHub OAuth (see instructions below)
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret

   # Frontend API URL
   VITE_API_URL=http://localhost:5000
   ```

4. **Set up GitHub OAuth App**

   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Set **Homepage URL**: `http://localhost:3000`
   - Set **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
   - Click "Register application"
   - Copy the **Client ID** and **Client Secret** to your `.env` file

5. **Build and run with Docker**
   ```bash
   docker-compose up --build
   ```

   This will start three services:
   - SQL Server (port 1433)
   - Backend API (port 5000)
   - Frontend (port 3000)

6. **Wait for services to start**

   The API will automatically run database migrations on startup. Watch the logs:
   ```bash
   docker-compose logs -f api
   ```

7. **Access the application**

   Open your browser and navigate to: http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Revoke refresh token
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - GitHub OAuth callback

### Protected Endpoints
- `GET /api/user/me` - Get current user info (requires authentication)
- `GET /api/user/data` - Get protected data (requires authentication)

## Testing

### Manual Testing

1. **Sign Up**
   - Navigate to http://localhost:3000
   - Click "Sign up"
   - Fill in the registration form
   - You should be redirected to the dashboard

2. **Login**
   - Click "Logout"
   - Navigate to http://localhost:3000/login
   - Enter your credentials
   - You should be logged in and redirected to the dashboard

3. **GitHub OAuth**
   - On the login page, click "Sign in with GitHub"
   - Authorize the application
   - You should be redirected to the dashboard

4. **Token Refresh**
   - Stay logged in for 15+ minutes (access token expires)
   - Make a request (navigate to dashboard if not already there)
   - The token should refresh automatically without requiring login

### Using curl

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Access Protected Endpoint:**
```bash
curl -X GET http://localhost:5000/api/user/me \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

## Development

### Backend Development

```bash
cd Auth.API
dotnet restore
dotnet run
```

The API will be available at http://localhost:5000

### Frontend Development

```bash
cd Auth.Frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173 (Vite dev server)

Don't forget to create a `.env` file in `Auth.Frontend/`:
```env
VITE_API_URL=http://localhost:5000
```

### Database Migrations

Create a new migration:
```bash
cd Auth.API
dotnet ef migrations add MigrationName
```

Apply migrations:
```bash
dotnet ef database update
```

## Troubleshooting

### SQL Server connection issues
- Ensure SQL Server container is healthy: `docker-compose ps`
- Check SQL Server logs: `docker-compose logs sqlserver`
- Verify the password meets SQL Server complexity requirements

### Frontend can't connect to API
- Check that CORS is configured correctly in `appsettings.json`
- Verify the API URL in frontend `.env` file
- Check API logs: `docker-compose logs api`

### GitHub OAuth not working
- Verify the callback URL matches exactly: `http://localhost:5000/api/auth/github/callback`
- Check that the GitHub OAuth app is configured correctly
- Ensure the Client ID and Secret are correct in `.env`

## Security Features

- **Password Hashing**: BCrypt with cost factor 12
- **Token Security**: Short-lived access tokens (15 min), refresh token rotation
- **OAuth Security**: Secure authorization code flow
- **CORS Protection**: Configured allowed origins
- **SQL Injection Protection**: Parameterized queries via EF Core

## Architecture Highlights

- **Token Strategy**: Access tokens (JWT) for stateless auth, refresh tokens for long-lived sessions
- **Token Rotation**: Old refresh tokens are revoked when new ones are issued
- **Auto Refresh**: Frontend automatically refreshes expired access tokens
- **Protected Routes**: Frontend route guards check authentication status

## License

This is an educational demo project. Feel free to use it as a reference for your own projects.

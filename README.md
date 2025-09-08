# Find My Stage Backend

A comprehensive backend API for the Find My Stage application, built with Node.js, Express, and Prisma.

## Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **Google OAuth**: Integration with Google OAuth 2.0
- **User Management**: Complete user profile management
- **Event Management**: Create, update, and manage speaking events
- **Topic Management**: Organize and categorize speaking topics
- **Payment Integration**: Stripe payment processing
- **File Uploads**: Profile picture and document uploads
- **Database**: PostgreSQL with Prisma ORM
- **Security**: Helmet, CORS, rate limiting, input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT, Passport.js
- **File Upload**: Multer
- **Validation**: Validator.js
- **Security**: Helmet, bcryptjs
- **Testing**: Jest, Supertest

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FIndMyStage-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/findmystage_db"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Server
   PORT=5000
   NODE_ENV="development"
   FRONTEND_URL="http://localhost:8080"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Seed database (optional)
   npm run db:seed
   ```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema changes
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database
- `npm run db:reset` - Reset the database
- `npm run db:studio` - Open Prisma Studio

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/profile/picture` - Upload profile picture
- `PUT /api/user/change-password` - Change password
- `DELETE /api/user/account` - Delete account

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event by ID
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/upcoming` - Get upcoming events

### Topics
- `GET /api/topics` - Get all topics
- `POST /api/topics` - Create topic
- `GET /api/topics/:id` - Get topic by ID
- `PUT /api/topics/:id` - Update topic
- `DELETE /api/topics/:id` - Delete topic
- `GET /api/topics/popular` - Get popular topics

### Payments
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/stats` - Get payment statistics
- `POST /api/payments` - Create payment record

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook endpoint

## Database Schema

The application uses the following main entities:

- **User**: User accounts and profiles
- **Event**: Speaking events and conferences
- **Topic**: Speaking topics and categories
- **PaymentHistory**: Payment records and transactions
- **EventSpeaker**: Many-to-many relationship between events and speakers
- **TopicUser**: Many-to-many relationship between topics and users

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **File Upload Security**: File type and size validation

## Development

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Database operations**
   ```bash
   # View database in Prisma Studio
   npm run db:studio
   
   # Reset database
   npm run db:reset
   ```

## Deployment

1. **Environment Variables**: Set all required environment variables in production
2. **Database**: Ensure PostgreSQL is properly configured
3. **Build**: No build step required for Node.js
4. **Process Manager**: Use PM2 or similar for production
5. **Reverse Proxy**: Use Nginx for SSL termination and load balancing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

# 🚀 Deploying Find My Stage Backend to Vercel

This guide will help you deploy your Node.js backend to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
4. **Database**: You'll need a production database (recommend PostgreSQL on Vercel, PlanetScale, or Railway)

## 🗄️ Database Setup

### Option 1: Vercel Postgres (Recommended)
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Create a Postgres database
vercel postgres create findmystage-db

# This will give you a DATABASE_URL
```

### Option 2: External Database
- **Railway**: [railway.app](https://railway.app) - Great for PostgreSQL
- **PlanetScale**: [planetscale.com](https://planetscale.com) - MySQL
- **Supabase**: [supabase.com](https://supabase.com) - PostgreSQL with extras

## 🔧 Environment Variables Setup

### Required Environment Variables

Copy these to your Vercel project settings:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# API Keys
OPENAI_API_KEY="sk-your-openai-key"
OPENWEBNINJA_API_KEY="your-openwebninja-key"
SERPAPI_API_KEY="your-serpapi-key"

# Stripe (if using payments)
STRIPE_SECRET_KEY="sk_live_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Google OAuth (if using)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Server
NODE_ENV="production"
FRONTEND_URL="https://your-frontend-domain.vercel.app"
PORT=5000
```

## 🚀 Deployment Steps

### Method 1: Vercel CLI (Recommended)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy from your project directory**
   ```bash
   cd /path/to/your/find_my_stage_backend
   vercel
   ```

3. **Follow the prompts**:
   - Set up and deploy? `Y`
   - Which scope? `Your account`
   - Link to existing project? `N` (first time)
   - Project name: `findmystage-backend` (or your preference)
   - Directory: `./` (current directory)
   - Override settings? `N`

4. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add OPENAI_API_KEY
   vercel env add OPENWEBNINJA_API_KEY
   # ... add all your environment variables
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Method 2: GitHub Integration

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure settings:
     - Framework Preset: `Other`
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `./` (leave empty)

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables from the list above

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy on every push to main

## 🗃️ Database Migration

After deployment, run database migrations:

```bash
# Install Prisma CLI globally
npm i -g prisma

# Run migrations on production
prisma migrate deploy --schema=./prisma/schema.prisma
```

Or add this to your deployment process:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "postdeploy": "prisma migrate deploy"
  }
}
```

## 🔍 Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Check your `DATABASE_URL` format
   - Ensure database is accessible from Vercel's IP ranges
   - Verify SSL settings for production databases

2. **Environment Variables Not Loading**
   - Double-check variable names (case-sensitive)
   - Redeploy after adding new variables
   - Check Vercel function logs

3. **Build Failures**
   - Check Node.js version compatibility (18+ required)
   - Verify all dependencies are in `package.json`
   - Check for missing files in `.vercelignore`

4. **API Timeouts**
   - Vercel has a 30-second timeout for serverless functions
   - Consider optimizing long-running operations
   - Use background jobs for heavy processing

### Useful Commands:

```bash
# Check deployment logs
vercel logs

# View function logs
vercel logs --follow

# Check environment variables
vercel env ls

# Redeploy
vercel --prod
```

## 📊 Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Function Logs**: Monitor in Vercel dashboard
3. **Database Monitoring**: Use your database provider's tools
4. **Error Tracking**: Consider adding Sentry or similar

## 🔄 Continuous Deployment

Once set up, your backend will automatically deploy when you:
- Push to the main branch (if using GitHub integration)
- Run `vercel --prod` (if using CLI)

## 📝 Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] API endpoints responding
- [ ] CORS configured for frontend
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Monitoring set up
- [ ] Error handling working
- [ ] Rate limiting configured
- [ ] Security headers active

## 🆘 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Prisma Deployment**: [prisma.io/docs/guides/deployment](https://prisma.io/docs/guides/deployment)
- **Node.js on Vercel**: [vercel.com/docs/functions/serverless-functions/runtimes/node-js](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)

---

Your backend should now be live at `https://your-project-name.vercel.app`! 🎉

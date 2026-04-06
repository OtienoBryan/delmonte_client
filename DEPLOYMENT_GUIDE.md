# Woosh Finance Client - Vercel Deployment Guide

This guide covers deploying the React frontend application to Vercel's serverless environment.

## Architecture Overview

The client is a React SPA built with:
- **Vite** for build tooling
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Router** for client-side routing
- **Axios** for API communication

## Vercel Configuration (`vercel.json`)

The `vercel.json` file is configured for:

### Build Configuration
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ]
}
```

### API Proxying
- All `/api/*` requests are proxied to the backend server
- Backend URL: `https://woosh-server.vercel.app`

### SPA Routing
- All routes fallback to `index.html` for client-side routing
- Supports React Router navigation

### Security Headers
- Content-Type protection
- XSS protection
- Frame options
- Static asset caching

## Environment Variables

### Required Environment Variables

Set these in your Vercel project dashboard:

```env
# API Configuration
VITE_API_URL=https://woosh-server.vercel.app/api

# Application Configuration
VITE_APP_NAME=Woosh Finance System
VITE_APP_VERSION=1.0.0
```

### Setting Environment Variables

1. **Via Vercel Dashboard:**
   - Go to your project dashboard
   - Navigate to Settings → Environment Variables
   - Add each variable with appropriate values

2. **Via Vercel CLI:**
   ```bash
   vercel env add VITE_API_URL
   vercel env add VITE_APP_NAME
   vercel env add VITE_APP_VERSION
   ```

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
# From the client directory
vercel

# Or for production
vercel --prod
```

### 4. Set Environment Variables
```bash
vercel env add VITE_API_URL production https://woosh-server.vercel.app/api
vercel env add VITE_APP_NAME production "Woosh Finance System"
vercel env add VITE_APP_VERSION production "1.0.0"
```

## Build Process

The build process uses Vite and creates optimized static files:

1. **Development Build:**
   ```bash
   npm run dev
   ```

2. **Production Build:**
   ```bash
   npm run build
   ```

3. **Preview Build:**
   ```bash
   npm run preview
   ```

## Key Features

### Client Components

The application includes several key client components:

1. **PaymentModal** (`src/components/Clients/PaymentModal.tsx`)
   - Handles payment recording for invoices
   - Integrates with financial API endpoints
   - Form validation and error handling

2. **BranchModal** (`src/components/Clients/BranchModal.tsx`)
   - Manages client branch creation and editing
   - CRUD operations for branch data
   - Real-time form validation

3. **ServiceChargeModal** (`src/components/Clients/ServiceChargeModal.tsx`)
   - Service charge configuration
   - Dynamic service type loading
   - Price validation and management

### API Integration

The client communicates with the backend through:

- **RESTful APIs** for CRUD operations
- **Real-time updates** (when backend supports WebSockets)
- **File uploads** via Cloudinary integration
- **Authentication** via JWT tokens

## Troubleshooting

### Common Issues

1. **404 Errors on Refresh**
   - Ensure SPA routing is configured correctly
   - Check that all routes fallback to `index.html`

2. **API Connection Issues**
   - Verify `VITE_API_URL` is set correctly
   - Check CORS configuration on backend
   - Ensure backend is deployed and accessible

3. **Build Failures**
   - Check TypeScript compilation errors
   - Verify all dependencies are installed
   - Review Vite build configuration

4. **Environment Variables Not Loading**
   - Ensure variables are prefixed with `VITE_`
   - Check variable scope (production/preview/development)
   - Redeploy after adding new variables

### Debug Commands

```bash
# Check build locally
npm run build

# Preview production build
npm run preview

# Check environment variables
vercel env ls

# View deployment logs
vercel logs
```

## Performance Optimization

### Build Optimizations
- **Code splitting** via Vite
- **Tree shaking** for unused code removal
- **Asset optimization** and compression
- **Static asset caching** with long-term headers

### Runtime Optimizations
- **Lazy loading** of components
- **Memoization** for expensive operations
- **Debounced** API calls
- **Optimistic updates** for better UX

## Security Considerations

### Client-Side Security
- **Environment variables** are exposed to the client
- **API keys** should be kept server-side
- **Input validation** on both client and server
- **HTTPS enforcement** via Vercel

### Best Practices
- Use **Content Security Policy** headers
- Implement **rate limiting** on API calls
- **Sanitize user inputs** before API calls
- **Validate API responses** before rendering

## Monitoring and Analytics

### Vercel Analytics
- **Performance monitoring** via Vercel Analytics
- **Error tracking** and reporting
- **User behavior** insights
- **Core Web Vitals** tracking

### Custom Monitoring
- **API response times** tracking
- **Error boundary** implementation
- **User interaction** logging
- **Performance metrics** collection

## Development Workflow

### Local Development
```bash
# Start development server
npm run dev

# Run with backend proxy
npm run dev
```

### Staging Deployment
```bash
# Deploy to preview
vercel

# Test with staging environment
vercel --env VITE_API_URL=https://staging-backend.vercel.app/api
```

### Production Deployment
```bash
# Deploy to production
vercel --prod

# Verify deployment
curl https://your-app.vercel.app/api/health
```

## Support and Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vite Documentation**: https://vitejs.dev/guide/
- **React Documentation**: https://react.dev/
- **TypeScript Documentation**: https://www.typescriptlang.org/docs/ 
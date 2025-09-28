# Pre-Deployment Checklist - You Hungry? App

This document outlines all the critical steps that must be completed **before** deploying the You Hungry? app to Vercel. Complete these tasks to ensure a smooth deployment and avoid post-launch issues.

## 🎯 Overview

This checklist ensures your app is production-ready with proper configurations, optimized bundles, and all necessary credentials prepared before going live.

## 📦 Code Quality & Optimization

### Bundle Analysis & Cleanup

- [ ] **Run bundle analyzer to identify bloat**

  ```bash
  npm run analyze
  ```

  - Review bundle sizes in browser at `http://localhost:3000/_next/static/chunks/`
  - Identify and remove unused dependencies
  - Optimize large components or libraries

- [ ] **Audit dependencies for unused packages**

  ```bash
  npm audit
  npx depcheck
  ```

  - Remove any packages not actively used
  - Update outdated dependencies
  - Check for security vulnerabilities

- [ ] **Remove development-only code**
  - [ ] Remove `console.log` statements
  - [ ] Remove debug code and temporary fixes
  - [ ] Remove unused imports and variables
  - [ ] Remove test data or mock content

### Code Quality Checks

- [ ] **Run all quality checks**

  ```bash
  npm run pre-push
  ```

  - [ ] TypeScript compilation passes (`npm run type-check`)
  - [ ] ESLint passes with no errors (`npm run lint`)
  - [ ] All tests pass (`npm run test`)
  - [ ] Build completes successfully (`npm run build`)

- [ ] **Performance optimization**
  - [ ] Enable Next.js optimizations in production
  - [ ] Implement proper image optimization
  - [ ] Add proper loading states and error boundaries
  - [ ] Optimize database queries and API calls

## 🔧 Environment Variables Preparation

### Pre-Deployment Environment Setup

These can be prepared before deployment since they don't require the live URL:

- [ ] **MongoDB Configuration**

  ```bash
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/you-hungry?retryWrites=true&w=majority
  MONGODB_DATABASE=you-hungry
  ```

- [ ] **Google APIs Configuration**

  ```bash
  GOOGLE_PLACES_API_KEY=AIza...
  GOOGLE_ADDRESS_VALIDATION_API_KEY=AIza...
  ```

  - [ ] Ensure API keys have **"None"** application restrictions for server-side use
  - [ ] Verify APIs are enabled in Google Cloud Console
  - [ ] Test API keys work with your application logic

- [ ] **Twilio Configuration** (if using SMS)
  ```bash
  TWILIO_ACCOUNT_SID=AC...
  TWILIO_AUTH_TOKEN=...
  TWILIO_PHONE_NUMBER=+1...
  ```

### Post-Deployment Environment Variables

These require the live URL and must be set after deployment:

- [ ] **Clerk Production Keys** (requires live URL for webhook)
  ```bash
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
  CLERK_SECRET_KEY=sk_live_...
  CLERK_WEBHOOK_SECRET=whsec_...
  NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
  ```

## 🗄️ Database Preparation

### MongoDB Atlas Setup

- [ ] **Create production database cluster**
  - [ ] Set up MongoDB Atlas cluster for production
  - [ ] Configure network access (allow Vercel IP ranges or 0.0.0.0/0)
  - [ ] Create database user with read/write permissions
  - [ ] Test connection from your development environment

- [ ] **Database schema verification**
  - [ ] Ensure all required collections exist:
    - `users`
    - `restaurants`
    - `collections`
    - `groups`
    - `decisions`
    - `friendships`
  - [ ] Add proper indexes for common queries
  - [ ] Set up database monitoring and alerts

- [ ] **Data migration** (if applicable)
  - [ ] Plan migration strategy for any existing data
  - [ ] Test migration scripts in staging environment
  - [ ] Backup current data before migration

## 🔐 Security & Configuration

### Security Audit

- [ ] **Environment variable security**
  - [ ] Remove any hardcoded secrets from code
  - [ ] Ensure `.env` files are in `.gitignore`
  - [ ] Verify no sensitive data in commit history
  - [ ] Use environment-specific configurations

- [ ] **API security**
  - [ ] Implement proper CORS settings
  - [ ] Add rate limiting to API endpoints
  - [ ] Validate all input data
  - [ ] Implement proper error handling (don't expose sensitive info)

- [ ] **Authentication security**
  - [ ] Review Clerk configuration
  - [ ] Ensure proper session management
  - [ ] Test protected routes functionality
  - [ ] Verify sign-out functionality clears all data

### Configuration Files

- [ ] **Next.js configuration**
  - [ ] Review `next.config.ts` for production settings
  - [ ] Optimize image domains and remote patterns
  - [ ] Configure proper headers and security policies
  - [ ] Enable production optimizations

- [ ] **Middleware configuration**
  - [ ] Review `middleware.ts` for proper route protection
  - [ ] Ensure public routes are correctly configured
  - [ ] Test authentication flow

## 🧪 Pre-Deployment Testing

### Comprehensive Testing

- [ ] **Local production build test**

  ```bash
  npm run build
  npm run start
  ```

  - [ ] Test all functionality in production build
  - [ ] Verify all pages load correctly
  - [ ] Test API endpoints
  - [ ] Verify authentication flow

- [ ] **Integration testing**
  - [ ] Test MongoDB connection
  - [ ] Test Google Places API integration
  - [ ] Test Twilio SMS (if implemented)
  - [ ] Test Clerk authentication flow

- [ ] **Cross-browser testing**
  - [ ] Test in Chrome, Firefox, Safari, Edge
  - [ ] Test on mobile devices
  - [ ] Verify responsive design works
  - [ ] Test accessibility features

### Performance Testing

- [ ] **Load testing**
  - [ ] Test API endpoints under load
  - [ ] Verify database performance
  - [ ] Test concurrent user scenarios
  - [ ] Monitor memory usage and response times

- [ ] **Bundle size optimization**
  - [ ] Ensure bundle sizes are reasonable
  - [ ] Implement code splitting where beneficial
  - [ ] Optimize images and assets
  - [ ] Remove unused CSS and JavaScript

## 📋 Documentation & Monitoring

### Documentation Updates

- [ ] **Update README.md**
  - [ ] Add deployment instructions
  - [ ] Update environment variable documentation
  - [ ] Add troubleshooting section
  - [ ] Update API documentation

- [ ] **Update environment documentation**
  - [ ] Create production environment guide
  - [ ] Document all required environment variables
  - [ ] Add service configuration instructions

### Monitoring Setup

- [ ] **Error tracking preparation**
  - [ ] Set up error tracking service (Sentry, etc.)
  - [ ] Configure error reporting
  - [ ] Set up alert notifications
  - [ ] Test error reporting functionality

- [ ] **Analytics preparation**
  - [ ] Set up analytics tracking
  - [ ] Configure conversion tracking
  - [ ] Set up performance monitoring
  - [ ] Plan user behavior tracking

## 🚀 Deployment Preparation

### Vercel Configuration

- [ ] **Vercel project setup**
  - [ ] Create Vercel project
  - [ ] Configure build settings
  - [ ] Set up custom domain (if applicable)
  - [ ] Configure environment variables (pre-deployment ones)

- [ ] **Build configuration**
  - [ ] Verify build command: `npm run build`
  - [ ] Set output directory: `.next`
  - [ ] Configure Node.js version
  - [ ] Set up build environment variables

### Domain & DNS

- [ ] **Domain preparation**
  - [ ] Purchase domain (if using custom domain)
  - [ ] Configure DNS settings
  - [ ] Set up SSL certificate
  - [ ] Test domain resolution

## 📊 Service Provider Accounts

### Account Setup & Verification

- [ ] **Clerk account**
  - [ ] Set up production project
  - [ ] Configure production settings
  - [ ] Test authentication flow
  - [ ] Prepare webhook configuration (requires live URL)

- [ ] **MongoDB Atlas**
  - [ ] Set up production cluster
  - [ ] Configure network access
  - [ ] Create database user
  - [ ] Test connection

- [ ] **Google Cloud Console**
  - [ ] Set up production project
  - [ ] Configure API keys
  - [ ] Set up billing
  - [ ] Test API access

- [ ] **Twilio** (if using SMS)
  - [ ] Set up production account
  - [ ] Purchase phone number
  - [ ] Configure SMS settings
  - [ ] Test SMS functionality

## 🔍 Final Pre-Deployment Review

### Code Review Checklist

- [ ] **Security review**
  - [ ] No hardcoded secrets
  - [ ] Proper input validation
  - [ ] Secure API endpoints
  - [ ] Proper error handling

- [ ] **Performance review**
  - [ ] Optimized database queries
  - [ ] Efficient API calls
  - [ ] Proper caching strategies
  - [ ] Optimized bundle sizes

- [ ] **Functionality review**
  - [ ] All features work as expected
  - [ ] Error scenarios handled properly
  - [ ] User experience is smooth
  - [ ] Mobile responsiveness verified

### Deployment Readiness

- [ ] **Team coordination**
  - [ ] Notify team of deployment schedule
  - [ ] Assign deployment responsibilities
  - [ ] Set up communication channels for issues
  - [ ] Plan rollback strategy

- [ ] **Backup strategy**
  - [ ] Backup current database
  - [ ] Document current configuration
  - [ ] Plan rollback procedures
  - [ ] Set up monitoring alerts

## ✅ Pre-Deployment Sign-off

Before proceeding to deployment, ensure:

- [ ] All code quality checks pass
- [ ] Bundle is optimized and bloat-free
- [ ] All pre-deployment environment variables are ready
- [ ] Database is configured and tested
- [ ] All integrations work with production credentials
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Documentation is updated
- [ ] Monitoring is set up
- [ ] Team is ready for deployment

## 🚨 Critical Notes

### Must Complete Before Deployment

1. **Bundle Analysis**: Run `npm run analyze` and optimize
2. **Dependency Audit**: Remove unused packages with `npx depcheck`
3. **Environment Variables**: Prepare all non-URL-dependent variables
4. **Database Setup**: Configure MongoDB Atlas production cluster
5. **Security Review**: Ensure no secrets in code and proper security measures
6. **Testing**: Complete comprehensive testing of production build

### Post-Deployment Items

These items require the live URL and must be completed after deployment:

1. **Clerk Webhook**: Configure webhook with live URL
2. **Clerk Production Keys**: Switch from test to live keys
3. **App URL**: Set `NEXT_PUBLIC_APP_URL` with actual domain
4. **Google API Restrictions**: Update API key restrictions with live domain
5. **Final Testing**: Test all functionality with live URL

---

## 📞 Support Resources

### Documentation

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Clerk Production Setup](https://clerk.com/docs/deployments/overview)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/)

### Tools

- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Dependency Checker](https://www.npmjs.com/package/depcheck)
- [Security Audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)

---

**Remember**: Completing this pre-deployment checklist thoroughly will save hours of debugging and configuration after deployment. Take time to do it right!

# Scripts Directory

This directory contains utility scripts for the You Hungry? application.

## 🚀 Production Simulation

### `run-production.js`

Simulates running the app in production mode using `.env.prod` configuration.

**Usage:**

```bash
npm run prod          # Build and start
npm run prod:build    # Build only
npm run prod:start    # Start only (assumes built)
```

**What it does:**

- Loads environment variables from `.env.prod`
- Sets `NODE_ENV=production`
- Validates required environment variables
- Builds and/or starts the production server
- Masks sensitive values in console output

**Documentation:** See [PRODUCTION_SIMULATION.md](../docs/PRODUCTION_SIMULATION.md)

---

## 🛠️ Other Utility Scripts

### `check-server.js`

Checks if a port is available before starting the development server.

### `fix-server-actions.js`

Fixes common server action issues in development.

### `check-clerk-config.js`

Validates Clerk authentication configuration.

### `replace-console-logs.js`

Replaces console.log statements with the logger utility.

---

## 🎨 Accessibility & Design

### `comprehensive-contrast-audit.js`

Audits the application for color contrast accessibility issues.

### `comprehensive-fix-contrast-issues.js`

Automatically fixes color contrast issues found in the audit.

### `auto-fix-contrast-issues.js`

Alternative contrast issue fixing script.

---

## 📧 Email Testing

### `test-email-with-resend.js`

Tests email functionality using the Resend API.

---

## 🔧 Database & Migration

### `backfill-test-data.js`

Populates the database with test data.

### `migrate-restaurant-ids.js`

Migrates restaurant IDs in the database.

---

## 🔬 Testing & Validation

### `test-address-validation.js`

Tests the Google Address Validation API integration.

---

## 📝 Notes

- Most scripts can be run directly: `node scripts/script-name.js`
- Some scripts have corresponding npm commands in `package.json`
- Always check script comments for usage instructions
- Scripts that modify data should be run with caution in production

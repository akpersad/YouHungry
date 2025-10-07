# Development Server Management

## Available Commands

### Start Development Server

```bash
npm run dev
```

- Checks if port 3000 is available before starting
- Prevents multiple servers from running simultaneously
- Uses Turbopack for faster builds

### Force Start (Skip Port Check)

```bash
npm run dev:force
```

- Starts server even if port 3000 is in use
- Use when you know what you're doing

### Kill Running Server

```bash
npm run dev:kill
```

- Kills any process running on port 3000
- Useful when you have a stuck server

## Manual Port Management

### Check if port is in use

```bash
lsof -ti:3000
```

### Kill process on port

```bash
lsof -ti:3000 | xargs kill -9
```

### Check what's running on port

```bash
lsof -i:3000
```

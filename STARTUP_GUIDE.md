# TTRPG Character Builder - Startup Guide

## Quick Start

### Option 1: Using the Batch File (Recommended for Windows)
Simply double-click `start-dev.bat` in the project folder. This will automatically start both servers.

### Option 2: Using npm Command
Open a terminal in the project folder and run:
```bash
npm run dev:full
```

### Option 3: Manual (Advanced)
If you need to run servers separately, open two terminal windows:

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```

## What Gets Started

When you run `npm run dev:full` or use `start-dev.bat`, two servers start automatically:

1. **Backend Server** (http://localhost:3001)
   - Handles file uploads
   - Manages picture storage
   - Communicates with Supabase

2. **Frontend Dev Server** (http://localhost:5173)
   - React development server
   - Hot reload enabled
   - Proxies upload requests to backend

## Accessing the App

Once both servers are running, open your browser and go to:
```
http://localhost:5173
```

## Picture Upload

Picture uploads now work through the Vite proxy, which automatically routes requests to the backend server. This means:
- ✅ Works reliably every time
- ✅ Works after computer restart
- ✅ No manual server management needed (if using start-dev.bat)

## Troubleshooting

**If uploads fail:**
1. Make sure both servers are running (check terminal output)
2. Check that port 3001 and 5173 are not in use
3. Verify your `.env` file has correct Supabase credentials

**To stop the servers:**
- Press `Ctrl+C` in the terminal


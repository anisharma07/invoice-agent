# Frontend Setup Guide

This guide provides comprehensive instructions for setting up the Government Medical Billing Form frontend application - a Progressive Web Application (PWA) built with Ionic 8 and React.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Mobile Development](#mobile-development)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v16.x or higher (recommended: v18.x or v20.x)
- **npm**: v8.x or higher (comes with Node.js)
- **Git**: Latest version

### Optional Software (for Mobile Development)

- **Android Studio**: Latest version (for Android builds)
- **Xcode**: Latest version (for iOS builds, macOS only)
- **Capacitor CLI**: v6.0.0 or higher (installed automatically)

### Check Installation

```bash
# Check Node.js version
node --version  # Should show v16+ or higher

# Check npm version
npm --version  # Should show v8+ or higher

# Check git
git --version
```

### Install/Update Node.js

If Node.js is not installed or version is outdated:

#### Ubuntu/Debian

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### macOS

```bash
# Using Homebrew
brew install node

# Or download from https://nodejs.org/

# Verify installation
node --version
npm --version
```

#### Windows

Download and install from: https://nodejs.org/

---

## Quick Start

```bash
# 1. Navigate to frontend directory
cd /path/to/Langchain-Claude-Agent/frontend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Configure backend API URL in .env
# Edit .env and set: VITE_API_BASE_URL=http://localhost:8000

# 5. Start development server
npm run dev

# 6. Open browser to http://localhost:5173
```

---

## Detailed Setup

### Step 1: Navigate to Frontend Directory

```bash
cd /path/to/Langchain-Claude-Agent/frontend
```

### Step 2: Install Dependencies

```bash
# Clean install (recommended for first time)
npm ci

# Or regular install
npm install

# This will install all dependencies from package.json including:
# - React 18.3+
# - Ionic 8.0+
# - Capacitor 6.0+
# - TypeScript 5.1+
# - Vite 5.0+
# - And many more...
```

**Installation may take 2-5 minutes depending on your internet connection.**

### Step 3: Environment Configuration

#### Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

#### Configure Environment Variables

Edit the `.env` file with your configuration:

```bash
# Application Environment
NODE_ENV=development

# App Configuration
VITE_APP_NAME=Govt Invoice App
VITE_APP_VERSION=1.0.0

# Backend API URL (IMPORTANT: Update this to match your backend)
VITE_API_BASE_URL=http://localhost:8000

# JWT Configuration (Optional)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Important Notes:**
- `VITE_API_BASE_URL` must match your backend server URL
- For production, use your production backend URL (e.g., `https://api.yourapp.com`)
- All environment variables prefixed with `VITE_` are exposed to the client

### Step 4: Verify Setup

```bash
# Check if dependencies are installed correctly
npm list react ionic

# Should show installed versions
```

---

## Development

### Start Development Server

```bash
# Start Vite development server with hot reload
npm run dev
```

The application will start at: **http://localhost:5173**

**Features:**
- ⚡ Hot Module Replacement (HMR) - instant updates
- 🔥 Fast refresh - preserves component state
- 📱 Responsive design preview
- 🌐 Network access (accessible on local network)

### Access from Other Devices

```bash
# The dev server also runs on your local IP
# Check terminal output for network URL, e.g.:
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.1.100:5173/

# Access from mobile device on same network:
# Open http://192.168.1.100:5173 in mobile browser
```

### Development Commands

```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests (Cypress)
npm run test.e2e
```

### Project Structure

```
frontend/
├── public/              # Static assets
│   ├── manifest.json    # PWA manifest
│   └── invoices/        # Invoice templates
├── src/
│   ├── components/      # React components
│   │   ├── DynamicInvoiceForm.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── ChatSidebar/
│   │   ├── FileMenu/
│   │   ├── Files/
│   │   ├── Forms/
│   │   └── socialcalc/  # Spreadsheet engine
│   ├── contexts/        # React contexts
│   │   ├── InvoiceContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/           # Custom React hooks
│   │   └── usePWA.ts
│   ├── pages/           # Page components
│   │   ├── Home.tsx
│   │   ├── FilesPage.tsx
│   │   ├── InvoiceAIPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/        # API and service layer
│   │   ├── aiService.ts
│   │   ├── exportAllAsPdf.ts
│   │   └── ...
│   ├── utils/           # Utility functions
│   ├── theme/           # CSS themes
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── .env                 # Environment variables (create from .env.example)
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

---

## Building for Production

### Web Production Build

```bash
# Build optimized production bundle
npm run build

# Output will be in dist/ directory
# Build includes:
# - Minified JavaScript and CSS
# - Optimized assets
# - Service Worker for PWA
# - Source maps (optional)
```

### Preview Production Build

```bash
# Build and preview
npm run build
npm run preview

# Opens at http://localhost:4173
```

### Build Output

After running `npm run build`, you'll find:

```
dist/
├── assets/           # Compiled JS, CSS, and assets
├── index.html        # Main HTML file
├── manifest.json     # PWA manifest
├── sw.js            # Service Worker
└── ...
```

### Deploy Production Build

The `dist/` folder can be deployed to:
- **Static Hosting**: Vercel, Netlify, GitHub Pages
- **CDN**: Cloudflare, AWS CloudFront
- **Web Server**: Nginx, Apache

---

## Mobile Development

### Prerequisites for Mobile

#### Android Development

1. **Install Android Studio**: https://developer.android.com/studio
2. **Install Android SDK** (via Android Studio)
3. **Set up Java Development Kit (JDK)** 11 or higher
4. **Configure environment variables**:

```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### iOS Development (macOS only)

1. **Install Xcode** from App Store
2. **Install Xcode Command Line Tools**:
```bash
xcode-select --install
```
3. **Install CocoaPods**:
```bash
sudo gem install cocoapods
```

### Initialize Capacitor

```bash
# Capacitor is already configured in this project
# Project is already synced with Android and iOS

# If needed, sync again:
npx cap sync
```

### Build for Android

```bash
# 1. Build web assets
npm run build

# 2. Copy to Android platform
npx cap copy android

# 3. Sync (copy + update)
npx cap sync android

# 4. Open in Android Studio
npx cap open android

# In Android Studio:
# - Build → Generate Signed Bundle / APK
# - Or Run on connected device/emulator
```

### Build for iOS

```bash
# 1. Build web assets
npm run build

# 2. Copy to iOS platform
npx cap copy ios

# 3. Sync (copy + update)
npx cap sync ios

# 4. Open in Xcode
npx cap open ios

# In Xcode:
# - Select target device
# - Product → Archive (for App Store)
# - Or Product → Run (for testing)
```

### Testing on Device

#### Android

```bash
# Connect Android device via USB (with USB debugging enabled)
# Or start Android emulator from Android Studio

# Build and sync
npm run build
npx cap sync android

# Run on device
npx cap run android
```

#### iOS

```bash
# Connect iOS device via USB
# Or use iOS Simulator

# Build and sync
npm run build
npx cap sync ios

# Run on device (requires Mac)
npx cap run ios
```

### Update Native Projects

```bash
# After updating Capacitor or adding plugins
npx cap sync

# Update specific platform
npx cap sync android
npx cap sync ios
```

---

## PWA (Progressive Web App) Features

This app is a full PWA with:

- ✅ **Offline Support**: Works without internet connection
- ✅ **Install Prompt**: Can be installed on device home screen
- ✅ **Push Notifications**: Can receive notifications
- ✅ **Background Sync**: Syncs data in background
- ✅ **App-like Experience**: Full-screen, no browser UI

### Testing PWA Features

```bash
# 1. Build production version
npm run build

# 2. Preview with service worker
npm run preview

# 3. Test in Chrome DevTools:
# - Open Chrome DevTools (F12)
# - Go to "Application" tab
# - Check "Service Workers" and "Manifest"
# - Test "Offline" mode
```

### Generate PWA Assets

```bash
# Generate app icons and splash screens
npm run generate-pwa-assets

# This creates icons for all platforms in public/
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use

**Error**: `Port 5173 is already in use`

**Solution**:
```bash
# Kill process using port 5173
sudo lsof -i :5173
sudo kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

#### 2. Module Not Found

**Error**: `Cannot find module 'xxx'`

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or clear npm cache
npm cache clean --force
npm install
```

#### 3. TypeScript Errors

**Error**: Type errors during build

**Solution**:
```bash
# Check TypeScript configuration
cat tsconfig.json

# Verify dependencies
npm list typescript

# Rebuild
npm run build
```

#### 4. Capacitor Sync Fails

**Error**: `Capacitor sync failed`

**Solution**:
```bash
# Update Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest

# Clean and sync
npx cap sync --force

# Check capacitor.config.ts
cat capacitor.config.ts
```

#### 5. Android Build Issues

**Error**: Gradle build fails

**Solution**:
```bash
# Clean Android build
cd android
./gradlew clean

# Update Gradle wrapper
./gradlew wrapper --gradle-version=8.0

# Sync project
cd ..
npx cap sync android
```

#### 6. Environment Variables Not Working

**Error**: `process.env.VITE_XXX is undefined`

**Solution**:
```bash
# Ensure .env file exists
ls -la .env

# Verify variable prefix
# Must start with VITE_ to be exposed to client
# Wrong: API_URL=http://localhost:8000
# Right: VITE_API_BASE_URL=http://localhost:8000

# Restart dev server after changing .env
npm run dev
```

#### 7. Hot Reload Not Working

**Error**: Changes not reflecting

**Solution**:
```bash
# Restart dev server
# Stop with Ctrl+C, then:
npm run dev

# Clear browser cache
# Or use Incognito/Private mode

# Check file watchers (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### 8. CORS Errors

**Error**: `Access-Control-Allow-Origin error`

**Solution**:
- Ensure backend is running at configured URL
- Check `VITE_API_BASE_URL` in `.env`
- Verify backend CORS configuration allows frontend origin
- In development, backend should allow `http://localhost:5173`

```bash
# Verify backend URL
curl http://localhost:8000/api/health

# Check .env
cat .env | grep VITE_API_BASE_URL
```

#### 9. Service Worker Issues

**Error**: Service worker not updating

**Solution**:
```bash
# Clear service worker cache in browser:
# Chrome DevTools → Application → Service Workers → Unregister

# Hard refresh browser
# Ctrl+Shift+R (Linux/Windows)
# Cmd+Shift+R (Mac)

# Rebuild
npm run build
npm run preview
```

### Debug Mode

Enable detailed logging:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for errors and warnings
4. Use Network tab to monitor API calls

### Getting Help

- Check browser console for errors
- Review [README.md](./README.md) for feature documentation
- Check [docs/](./docs/) for specific feature guides
- Verify environment variables: `cat .env`
- Ensure backend is running: `curl http://localhost:8000/api/health`

---

## Additional Configuration

### VS Code Settings

Recommended VS Code extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ionic.ionic"
  ]
}
```

### Browser Compatibility

Tested and supported browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

### Performance Optimization

```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer

# Optimize images
# Use tools like imagemin or squoosh.app

# Enable compression in production server
# Configure gzip/brotli in nginx/apache
```

---

## Environment-Specific Builds

### Development

```bash
NODE_ENV=development npm run dev
```

### Staging

```bash
NODE_ENV=staging npm run build
```

### Production

```bash
NODE_ENV=production npm run build
```

---

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Production deployment
netlify deploy --prod
```

---

## Additional Resources

- **Main README**: [README.md](./README.md)
- **Backend Setup**: [../backend/SETUP.md](../backend/SETUP.md)
- **Ionic Documentation**: https://ionicframework.com/docs
- **React Documentation**: https://react.dev
- **Capacitor Documentation**: https://capacitorjs.com/docs
- **Vite Documentation**: https://vitejs.dev

---

## Summary

You now have the Government Medical Billing Form frontend running! 🎉

**Next Steps:**
1. ✅ Verify dev server: http://localhost:5173
2. ✅ Ensure backend is running: http://localhost:8000
3. ✅ Test basic functionality (create invoice, export, etc.)
4. ✅ Explore PWA features (install app, offline mode)
5. ✅ Review feature documentation in [README.md](./README.md)

**Default URLs:**
- Development: http://localhost:5173
- Preview: http://localhost:4173 (after `npm run build && npm run preview`)
- Backend API: http://localhost:8000

**Key Features to Try:**
- 📝 Create and edit invoices
- 🎨 Toggle dark/light theme
- 📤 Export as PDF/CSV
- 💾 Auto-save functionality
- 📱 Install as PWA (mobile-like experience)
- 🤖 AI Invoice Generator

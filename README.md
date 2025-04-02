# Cyber Tasks - Progressive Web App

A futuristic task management application with PWA capabilities.

## Features

- Task management with due dates and reminders
- PWA support for offline access
- Native notifications for reminders
- Installable on mobile and desktop devices
- Dark mode interface

## PWA Benefits

This application has been configured as a Progressive Web App (PWA), providing several advantages:

1. **Offline Usage**: The app will continue to work even without an internet connection
2. **Installation**: You can add the app to your home screen on mobile or desktop
3. **Enhanced Notifications**: Better notification handling, especially when installed
4. **Faster Loading**: After the first visit, the app loads much faster

## Installation Instructions

### On Desktop (Chrome, Edge, etc.)
1. Look for the install icon in your browser's address bar
2. Click "Install" when prompted
3. The app will open in its own window

### On iOS
1. Open the app in Safari
2. Tap the "Share" button
3. Select "Add to Home Screen"
4. The app will appear on your home screen

### On Android
1. When visiting the site, you'll see an "Add to Home Screen" prompt
2. Alternatively, use the three-dot menu and select "Install app"

## Development

### Prerequisites
- Node.js 14+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## PWA Configuration
The PWA features are configured using vite-plugin-pwa. The key files are:
- `vite.config.ts` - PWA configuration
- `src/main.tsx` - Service worker registration
- `public/` - Icons and assets
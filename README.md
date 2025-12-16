# Tabemap

A Firefox extension that displays [Tabelog](https://tabelog.com/) ratings directly on Google Maps, making it easier to discover highly-rated restaurants in Japan.

## Features

- **Automatic Rating Display**: Shows Tabelog ratings as a badge next to restaurant names on Google Maps
- **Japanese Name Detection**: Automatically detects and uses Japanese restaurant names for better search accuracy
- **Color-Coded Ratings**: Visual indicators for rating quality
  - High (≥3.4): Green
  - Mid (≥3.3): Yellow
  - Low (<3.3): Red
- **Direct Links**: Click on the rating badge to open the restaurant's Tabelog page
- **Smart Matching**: Uses restaurant phone numbers to improve match accuracy

## Installation

### For Users

1. Download the latest release from the releases page
2. Open Firefox and navigate to `about:addons`
3. Click the gear icon and select "Install Add-on From File..."
4. Select the downloaded `.xpi` file

### For Developers

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tabemap.git
   cd tabemap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Firefox:
   ```bash
   npm run start:firefox
   ```

## Development

### Available Scripts

- `npm run build` - Build the extension for production
- `npm run watch` - Build in watch mode for development
- `npm test` - Run tests with Vitest
- `npm run start:firefox` - Launch Firefox with the extension loaded

### Project Structure

```
tabemap/
├── src/
│   ├── background.ts      # Background script for API requests
│   ├── content.ts         # Content script injected into Google Maps
│   ├── utils/
│   │   └── parser.ts      # Tabelog data parsing utilities
│   └── styles.css         # Extension styles
├── public/
│   ├── manifest.json      # Extension manifest
│   ├── icon.png          # Extension icon
│   └── tabelog-logo.png  # Tabelog logo for badges
└── dist/                 # Built extension files
```

### How It Works

1. The content script monitors Google Maps for restaurant pages using MutationObserver
2. When a restaurant is detected, it extracts the name (preferring Japanese names) and phone number
3. A message is sent to the background script to fetch Tabelog data
4. The background script searches Tabelog and parses the rating
5. The rating is displayed as a badge next to the restaurant name on Google Maps

## Requirements

- Firefox 115.0 or higher

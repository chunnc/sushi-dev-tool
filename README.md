# Sushi Dev Tool

A Chrome extension development tool built with React and TypeScript.

## Project Structure

```
sushi-dev-tool/
├── src/
│   ├── App.tsx          # Main React component
│   ├── App.css          # Styles for the component
│   ├── popup.tsx        # Entry point for React
│   └── popup.html       # HTML template
├── dist/                # Build output (generated)
├── manifest.json        # Chrome extension manifest
├── package.json         # NPM dependencies
├── tsconfig.json        # TypeScript configuration
└── webpack.config.js    # Webpack bundler configuration
```

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Webpack 5** - Module bundler
- **Chrome Extension APIs** - Browser extension framework

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Chrome browser

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

This will create a `dist/` folder with the compiled extension.

### Loading the Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `dist/` folder from this project
6. The extension icon should appear in your Chrome toolbar

### Testing the Extension

Click the extension icon in the Chrome toolbar to see the "Hello World" popup!

## Development

### Build Commands

- **Production build**: `npm run build`
- **Development build with watch mode**: `npm run watch`

### Making Changes

1. Edit the React components in the `src/` directory
2. Run `npm run build` to rebuild
3. Click the refresh icon in `chrome://extensions/` to reload the extension
4. Click the extension icon to see your changes

## File Descriptions

- **manifest.json** - Defines extension metadata, permissions, and popup configuration
- **src/popup.tsx** - React entry point that renders the App component
- **src/App.tsx** - Main React component displaying "Hello World"
- **src/App.css** - Styling for the App component
- **webpack.config.js** - Bundles React code for the browser
- **tsconfig.json** - TypeScript compiler settings

## Customization

### Changing the Popup Content

Edit [src/App.tsx](src/App.tsx) to modify what's displayed in the extension popup.

### Styling

Edit [src/App.css](src/App.css) to change the appearance of the extension.

### Extension Name and Description

Edit [manifest.json](manifest.json) to update the extension's name, description, and other metadata.

## Troubleshooting

- **Extension not loading**: Make sure you selected the `dist/` folder, not the project root
- **Changes not visible**: Refresh the extension in `chrome://extensions/`
- **Build errors**: Delete `node_modules/` and `dist/`, then run `npm install` and `npm run build`

## License

MIT

# Sushi Dev Tool

A Chrome extension for developers built with React and TypeScript.

## Technologies

- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Chrome Extension APIs** - Browser extension framework

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in the top-right corner)
   - Click **Load unpacked**
   - Select the `dist/` folder from this project

After loading, the Sushi Dev Tool icon will appear in your Chrome toolbar. Click it to open the popup, where you can toggle features on/off and configure settings.

## Features

Features can be enabled or disabled individually from the **Features** tab in the extension popup.

### GitHub Comment Spelling & Grammar Fix

Adds an AI-powered fix button to every GitHub comment box (pull requests, issues, review comments).

- Click the 🌐 button next to a comment textarea to analyse the text
- A popup appears with the corrected version of your comment
- Accept the suggestion to replace your text, or dismiss it to keep the original
- Requires an OpenAI API key (see [Settings](#settings))

### GitHub Stats Viewer

Injects a **Developer Metrics** panel on any GitHub user profile page, displayed below the contribution graph.

**Metrics shown:**
- **Merged PRs** — number of pull requests merged in the selected period
- **Lines of Code** — total lines added + deleted across all merged PRs

**Filters:**
- Toggle between **Weekly** (current week) and **Monthly** (current month) views

**Repository selector:**
- Choose **All Repositories** or pick specific repos from the dropdown
- Predefined repositories are included by default
- **Add custom repos** — type any repository name in the input field at the top of the dropdown and press Enter or click `+` to add it; custom repos are saved across browser sessions
- Remove custom repos at any time with the `×` button next to each entry

## Settings

Open the **Settings** tab in the extension popup to configure:

- **OpenAI API Key** — required for the GitHub Comment Fix feature. Your key is stored locally in Chrome storage and never sent anywhere other than the OpenAI API.

## Troubleshooting

- **Extension not loading** — make sure you selected the `dist/` folder, not the project root
- **Changes not visible** — after rebuilding, click the refresh icon on the extension card in `chrome://extensions/`
- **Build errors** — delete `node_modules/` and `dist/`, then run `npm install` and `npm run build`
- **Comment Fix not working** — check that your OpenAI API key is saved in the Settings tab

## License

MIT

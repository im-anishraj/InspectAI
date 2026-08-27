<div align="center">
  <img src="inspectai.png" alt="InspectAI Logo" width="128" height="128" style="border-radius: 20%;" />
  <h1>🔍 InspectAI</h1>
  <p><b>The AI-powered Inspect Element for Modern Web Development.</b></p>
  <p>Point, Click, and Prompt. Watch your IDE automatically write the code.</p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
</div>

<br/>

## 💡 The Vision

Developers waste countless hours switching between the browser (to find UI elements), the IDE (to locate the source code), and AI Chatbots (to copy-paste code back and forth).

**InspectAI bridges this gap.** 
It allows you to visually select any React/Next.js element in your browser, type a natural language prompt, and instantly sends that context directly into your **IDE's built-in Agent Chat** (like Copilot or Cursor). Zero setup, zero API keys required.

## 🏗️ Architecture: The "Zero-Cost Bridge"

We pivoted away from demanding users provide their own LLM API keys. Instead, InspectAI is a two-part bridge:

1. **The Chrome Extension (`/extension`)**: Extracts React Fiber `_debugSource` metadata and the DOM snippet, then broadcasts it over a local WebSocket.
2. **The IDE Companion (`/ide-extension`)**: A VS Code extension listening on port `4444`. It catches the payload, opens the exact file, highlights the specific line of code, and triggers your IDE's native AI chat panel.

You get the safety of reviewing the diff in your editor, powered by the AI subscription you already pay for!

## 🚀 Getting Started

### 1. Install the Chrome Extension
1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `/extension/dist` directory.

### 2. Install the VS Code Companion
1. Open the `/ide-extension` folder in VS Code.
2. Run `npm install` and `npm run compile`.
3. Press `F5` to start the Extension Development Host (which opens a new VS Code window with the bridge running).

### 3. Magic Time
1. Open any local Next.js/React app (`npm run dev`).
2. Click the **InspectAI** icon in Chrome.
3. Click any element on your page.
4. Type a prompt (e.g., *"Make this button larger and add a purple hover effect"*).
5. Watch VS Code automatically jump to the file, highlight the code, and ask the AI to write the diff for you!

## 🤝 Contributing

We are looking for contributors!
- **Framework Support**: Add support for Vue, Svelte, or Angular.
- **IDE Support**: Build a companion extension for JetBrains, Neovim, or Zed.
- **UI Polish**: Improve the Chrome extension's Shadow DOM prompt UI.

Feel free to open an issue or submit a Pull Request!

## 📝 License

MIT License - feel free to use and modify!

# Speech to Text – Multilingual 🎙️

A minimal Chrome extension for voice dictation in any input field, powered by the Web Speech API.

## Features

- **20 languages** with auto-detection of your browser language
- **Language selector** with persistent preference (saved across sessions)
- Works in `<input>`, `<textarea>`, and `contenteditable` elements
- **Double-tap Alt** (or **Option ⌥** on Mac) to toggle dictation
- Toolbar icon to toggle dictation
- Clean, non-intrusive floating widget
- No account, no cloud, no limits – uses Chrome's built-in Web Speech API

## Installation

1. Download or clone this repository
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select this folder
5. Click the extension icon or double-tap `Alt` on any page

## Usage

1. Double-tap `Alt` or click the toolbar icon – the widget appears
2. Select your language from the dropdown (auto-detected on first use)
3. Click the 🎙️ button to start/stop recording
4. Speak – text is inserted at the cursor position

## Requirements

- Google Chrome (recommended) – other browsers have limited or no support ([see compatibility](https://caniuse.com/speech-recognition))
- Microphone access
- Internet connection (the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) sends audio to Google's servers for processing)

## Credits

Inspired by [SkyJinXX/speech-to-text-extension](https://github.com/SkyJinXX/speech-to-text-extension).

## License

[MIT](LICENSE)

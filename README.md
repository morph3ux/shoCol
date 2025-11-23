# shoCol

A VSCode extension that displays color preview boxes before hex, RGB, and RGBA color codes in your editor.

![Screenshot](screenshot.png)

## Features

- Automatically detects color codes in multiple formats:
  - Hex colors: `#9567bd`, `#ff800f`, `#abc` (3-digit and 6-digit)
  - Hex with alpha: `#9567bd80`, `#abcd` (4-digit and 8-digit)
  - RGB colors: `rgb(149, 103, 189)`
  - RGBA colors: `rgba(149, 103, 189, 0.5)`
- Displays a small color preview box just before each color code
- Updates in real-time as you edit your code
- Supports transparency/alpha channels

## Usage

Simply open any file containing color codes, and you'll see color preview boxes appear before each color code automatically.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile the extension:
   ```bash
   npm run compile
   ```

3. Press `F5` in VSCode to open a new window with the extension loaded.

4. Make changes to the code in `src/extension.ts` and press `Ctrl+R` (or `Cmd+R` on Mac) in the extension development window to reload.

## License

MIT


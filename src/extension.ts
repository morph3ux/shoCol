import * as vscode from 'vscode';

// Color regex patterns
const HEX_COLOR_REGEX = /#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\b/g;
const RGB_COLOR_REGEX = /rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi;
const RGBA_COLOR_REGEX = /rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/gi;

// Store decoration types per color
const decorationTypeCache = new Map<string, vscode.TextEditorDecorationType>();

interface ColorMatch {
  color: string;
  startIndex: number;
  length: number;
}

// Convert hex to RGBA
function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Expand shorthand (e.g., #abc -> #aabbcc, #abcd -> #aabbccdd)
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  if (hex.length === 6) {
    // No alpha channel, default to opaque
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b, a: 1 };
  } else if (hex.length === 8) {
    // With alpha channel
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = parseInt(hex.substring(6, 8), 16) / 255;
    return { r, g, b, a };
  }
  
  return null;
}

// Convert RGB/RGBA string to RGBA object
function parseRgbRgba(match: RegExpMatchArray, hasAlpha: boolean): { r: number; g: number; b: number; a: number } | null {
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = hasAlpha ? parseFloat(match[4]) : 1;
  
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 1) {
    return null;
  }
  
  return { r, g, b, a };
}

// Convert RGBA to CSS color string
function rgbaToCss(rgba: { r: number; g: number; b: number; a: number }): string {
  if (rgba.a === 1) {
    return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
  }
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}

// Get or create decoration type for a specific color
function getDecorationTypeForColor(colorString: string): vscode.TextEditorDecorationType {
  if (decorationTypeCache.has(colorString)) {
    return decorationTypeCache.get(colorString)!;
  }
  
  let cssColor: string;
  
  // Check if it's a hex color
  if (colorString.startsWith('#')) {
    const rgba = hexToRgba(colorString);
    if (!rgba) {
      throw new Error(`Invalid hex color: ${colorString}`);
    }
    cssColor = rgbaToCss(rgba);
  } else if (colorString.toLowerCase().startsWith('rgb')) {
    // Already a valid RGB/RGBA string
    cssColor = colorString;
  } else {
    throw new Error(`Invalid color format: ${colorString}`);
  }
  
  // Create a decoration type with a colored box
  // Using a space character with background color and white border
  const decorationType = vscode.window.createTextEditorDecorationType({
    before: {
      contentText: ' ',
      backgroundColor: cssColor,
      border: '1px solid white',
      width: '14px',
      height: '14px',
      margin: '0 2px 0 0'
    }
  });
  
  decorationTypeCache.set(colorString, decorationType);
  return decorationType;
}

// Find all color matches in text
function findAllColors(text: string): ColorMatch[] {
  const matches: ColorMatch[] = [];
  
  // Find hex colors
  let match;
  HEX_COLOR_REGEX.lastIndex = 0;
  while ((match = HEX_COLOR_REGEX.exec(text)) !== null) {
    const hexColor = match[0];
    const rgba = hexToRgba(hexColor);
    if (rgba) {
      matches.push({
        color: hexColor,
        startIndex: match.index,
        length: hexColor.length
      });
    }
  }
  
  // Find RGB colors
  RGB_COLOR_REGEX.lastIndex = 0;
  while ((match = RGB_COLOR_REGEX.exec(text)) !== null) {
    const rgba = parseRgbRgba(match, false);
    if (rgba) {
      matches.push({
        color: match[0],
        startIndex: match.index,
        length: match[0].length
      });
    }
  }
  
  // Find RGBA colors
  RGBA_COLOR_REGEX.lastIndex = 0;
  while ((match = RGBA_COLOR_REGEX.exec(text)) !== null) {
    const rgba = parseRgbRgba(match, true);
    if (rgba) {
      matches.push({
        color: match[0],
        startIndex: match.index,
        length: match[0].length
      });
    }
  }
  
  // Sort by position to avoid conflicts
  matches.sort((a, b) => a.startIndex - b.startIndex);
  
  return matches;
}

// Update decorations for a text editor
function updateDecorations(editor: vscode.TextEditor) {
  const text = editor.document.getText();
  
  // Find all color matches
  const colorMatches = findAllColors(text);
  
  // Group decorations by color
  const decorationsByColor = new Map<string, vscode.DecorationOptions[]>();
  
  colorMatches.forEach(match => {
    if (!decorationsByColor.has(match.color)) {
      decorationsByColor.set(match.color, []);
    }
    
    const startPos = editor.document.positionAt(match.startIndex);
    const endPos = editor.document.positionAt(match.startIndex + match.length);
    
    const decoration: vscode.DecorationOptions = {
      range: new vscode.Range(startPos, endPos)
    };
    
    decorationsByColor.get(match.color)!.push(decoration);
  });
  
  // Apply decorations for each color
  decorationsByColor.forEach((decorations, colorString) => {
    try {
      const decorationType = getDecorationTypeForColor(colorString);
      editor.setDecorations(decorationType, decorations);
    } catch (error) {
      console.error(`Error creating decoration for color ${colorString}:`, error);
    }
  });
  
  // Clear decorations for colors that are no longer present
  const currentColors = new Set(decorationsByColor.keys());
  decorationTypeCache.forEach((decorationType, cachedColor) => {
    if (!currentColors.has(cachedColor)) {
      editor.setDecorations(decorationType, []);
    }
  });
}

export function activate(context: vscode.ExtensionContext) {
  console.log('shoCol extension is now active!');
  
  // Update decorations for all visible editors
  const updateAllDecorations = () => {
    vscode.window.visibleTextEditors.forEach(editor => {
      updateDecorations(editor);
    });
  };
  
  // Initial update
  updateAllDecorations();
  
  // Update on document change
  const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(event => {
    const editor = vscode.window.visibleTextEditors.find(
      e => e.document === event.document
    );
    if (editor) {
      updateDecorations(editor);
    }
  });
  
  // Update when switching editors
  const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      updateDecorations(editor);
    }
  });
  
  // Update when visible editors change
  const onDidChangeVisibleTextEditors = vscode.window.onDidChangeVisibleTextEditors(() => {
    updateAllDecorations();
  });
  
  context.subscriptions.push(
    onDidChangeTextDocument,
    onDidChangeActiveTextEditor,
    onDidChangeVisibleTextEditors
  );
}

export function deactivate() {}


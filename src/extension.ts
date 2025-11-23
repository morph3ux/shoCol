import * as vscode from 'vscode';

// Hex color regex patterns
const HEX_COLOR_REGEX = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g;

// Store decoration types per color
const decorationTypeCache = new Map<string, vscode.TextEditorDecorationType>();

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Expand shorthand (e.g., #abc -> #aabbcc)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  if (hex.length !== 6) {
    return null;
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

// Get or create decoration type for a specific color
function getDecorationTypeForColor(hexColor: string): vscode.TextEditorDecorationType {
  if (decorationTypeCache.has(hexColor)) {
    return decorationTypeCache.get(hexColor)!;
  }
  
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    throw new Error(`Invalid hex color: ${hexColor}`);
  }
  
  // Normalize hex color (ensure it has # and is uppercase)
  const normalizedHex = hexColor.startsWith('#') ? hexColor.toUpperCase() : `#${hexColor.toUpperCase()}`;
  
  // Create a decoration type with a colored box
  // Using a space character with background color and white border
  const decorationType = vscode.window.createTextEditorDecorationType({
    before: {
      contentText: ' ',
      backgroundColor: normalizedHex,
      border: '1px solid white',
      width: '14px',
      height: '14px',
      margin: '0 2px 0 0'
    }
  });
  
  decorationTypeCache.set(hexColor, decorationType);
  return decorationType;
}

// Update decorations for a text editor
function updateDecorations(editor: vscode.TextEditor) {
  const text = editor.document.getText();
  
  // Group decorations by color
  const decorationsByColor = new Map<string, vscode.DecorationOptions[]>();
  
  let match;
  while ((match = HEX_COLOR_REGEX.exec(text)) !== null) {
    const hexColor = match[0];
    const startPos = editor.document.positionAt(match.index);
    const endPos = editor.document.positionAt(match.index + hexColor.length);
    
    const rgb = hexToRgb(hexColor);
    if (rgb) {
      if (!decorationsByColor.has(hexColor)) {
        decorationsByColor.set(hexColor, []);
      }
      
      const decoration: vscode.DecorationOptions = {
        range: new vscode.Range(startPos, endPos)
      };
      
      decorationsByColor.get(hexColor)!.push(decoration);
    }
  }
  
  // Apply decorations for each color
  decorationsByColor.forEach((decorations, hexColor) => {
    try {
      const decorationType = getDecorationTypeForColor(hexColor);
      editor.setDecorations(decorationType, decorations);
    } catch (error) {
      console.error(`Error creating decoration for color ${hexColor}:`, error);
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


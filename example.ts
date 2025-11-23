// Hex colors (6-digit)
export const chartColors = [
  "#9567bd",
  "#ff800f",
  "#e93324",
  "#00a86b",
  "#007aff",
  "#5856d6",
  "#af52de",
  "#ff2d55",
  "#4cd964",
  "#ffcc00",
  "#8e8e93",
  "#34c759",
  "#5ac8fa",
  "#ff9500",
  "#ff3b30",
] as const;

// Hex colors with alpha (8-digit)
export const colorsWithAlpha = [
  "#9567bd80", // 50% opacity
  "#ff800fff", // Full opacity
  "#e9332480", // 50% opacity
  "#00a86bcc", // 80% opacity
] as const;

// Short hex colors (3-digit)
export const shortHexColors = ["#abc", "#def", "#123", "#456"] as const;

// Short hex colors with alpha (4-digit)
export const shortHexWithAlpha = [
  "#abcd", // #aabbccdd
  "#1234", // #11223344
] as const;

// RGB colors
export const rgbColors = [
  "rgb(149, 103, 189)",
  "rgb(255, 128, 15)",
  "rgb(233, 51, 36)",
  "rgb(0, 168, 107)",
  "rgb(0, 122, 255)",
] as const;

// RGBA colors
export const rgbaColors = [
  "rgba(149, 103, 189, 0.5)",
  "rgba(255, 128, 15, 0.8)",
  "rgba(233, 51, 36, 1.0)",
  "rgba(0, 168, 107, 0.3)",
  "rgba(0, 122, 255, 0.9)",
] as const;

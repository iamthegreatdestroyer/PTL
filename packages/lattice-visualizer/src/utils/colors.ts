/**
 * Color Utilities
 *
 * Functions for computing colors in the visualization.
 */

/**
 * Convert confidence value to color
 *
 * High confidence = green, low confidence = red
 *
 * @param confidence - Confidence value (0-1)
 * @returns CSS color string
 */
export function confidenceToColor(confidence: number): string {
  // Clamp to 0-1
  const c = Math.max(0, Math.min(1, confidence));

  // HSL interpolation from red (0) to green (120)
  const hue = c * 120;
  const saturation = 60 + c * 20; // 60% to 80%
  const lightness = 45 + c * 10; // 45% to 55%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Map type category to color
 *
 * @param category - Type category
 * @returns CSS color string
 */
export function typeToColor(category: string): string {
  const colors: Record<string, string> = {
    primitive: '#4CAF50', // Green
    builtin: '#2196F3', // Blue
    collection: '#9C27B0', // Purple
    promise: '#FF9800', // Orange
    function: '#795548', // Brown
    class: '#607D8B', // Blue-grey
    interface: '#009688', // Teal
    union: '#E91E63', // Pink
    intersection: '#F44336', // Red
    generic: '#3F51B5', // Indigo
    literal: '#8BC34A', // Light green
    unknown: '#9E9E9E', // Grey
  };

  return colors[category] ?? (colors['unknown'] as string);
}

/**
 * Get contrasting text color for a background
 *
 * @param bgColor - Background color (hex or hsl)
 * @returns '#fff' or '#000'
 */
export function getContrastColor(bgColor: string): string {
  // Parse HSL
  const hslMatch = bgColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) {
    const lightness = parseInt(hslMatch[3]!, 10);
    return lightness > 50 ? '#333' : '#fff';
  }

  // Parse hex
  const hexMatch = bgColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    const r = parseInt(hexMatch[1]!, 16);
    const g = parseInt(hexMatch[2]!, 16);
    const b = parseInt(hexMatch[3]!, 16);
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#333' : '#fff';
  }

  // Default to dark text
  return '#333';
}

/**
 * Interpolate between two colors
 *
 * @param color1 - Start color (hex)
 * @param color2 - End color (hex)
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated color (hex)
 */
export function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = parseHex(color1);
  const c2 = parseHex(color2);

  if (!c1 || !c2) return color1;

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a color palette for n items
 *
 * @param n - Number of colors needed
 * @returns Array of hex colors
 */
export function generatePalette(n: number): string[] {
  const colors: string[] = [];
  const goldenAngle = 137.508;

  for (let i = 0; i < n; i++) {
    const hue = (i * goldenAngle) % 360;
    colors.push(`hsl(${hue}, 65%, 50%)`);
  }

  return colors;
}

// Helper functions

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1]!, 16),
    g: parseInt(match[2]!, 16),
    b: parseInt(match[3]!, 16),
  };
}

function toHex(n: number): string {
  const hex = Math.max(0, Math.min(255, n)).toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

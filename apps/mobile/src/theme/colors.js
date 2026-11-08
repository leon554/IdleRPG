// IdleRPG colour theme: "Lantern-lit workshop" (dark, neutral base, single blue accent).
// Neutral charcoal backgrounds, grey text, one saturated accent, vivid status colours.
//
// Every text colour meets WCAG AA (4.5:1) on background, surface AND surfaceRaised.
// Ratios noted as: on background / surface / surfaceRaised.
//
// CommonJS because tailwind.config.js require()s this file.

const colors = /** @type {const} */ ({
  // Backgrounds: neutral charcoal
  background: "#141414",
  surface: "#1c1c1c",        // cards, panels
  surfaceRaised: "#262626",  // modals, pressed states, nested cards

  // Borders
  border: "#333333",         // decorative dividers
  borderStrong: "#7a7a7a",   // input outlines, toggles: 4.0:1 on surface

  // Text
  textPrimary: "#ececec",    // 15.6 / 14.4 / 12.8
  textSecondary: "#bdbdbd",  //  9.8 /  9.1 /  8.1
  textMuted: "#999999",      //  6.5 /  6.0 /  5.3

  // Brand (single accent: buttons, links, focus rings, XP bars)
  primary: "#4f9dff",        // blue        6.7 / 6.2 / 5.5
  onPrimary: "#04152e",      //             6.6:1 on primary

  // Status
  success: "#22c55e",        // green       8.1 / 7.5 / 6.6
  warning: "#f97316",        // orange      6.6 / 6.1 / 5.4
  danger: "#f55a5a",         // red         5.7 / 5.3 / 4.7
  info: "#22c3e6",           // cyan        8.8 / 8.1 / 7.2
});

// Rarities: each a different hue AND lightness, so they stay distinguishable
// for most forms of colour blindness.
// Keep in sync with RARITIES[*].color in packages/shared/src/gameData.ts.
const rarityColors = /** @type {const} */ ({
  common: "#a3a3a3",         // grey        7.3 / 6.8 / 6.0
  uncommon: "#22c55e",       // green       8.1 / 7.5 / 6.6
  rare: "#4d8dff",           // blue        5.8 / 5.3 / 4.7
  epic: "#bb6bff",           // purple      5.8 / 5.4 / 4.8
  legendary: "#ffc61a",      // gold       11.7 / 10.8 / 9.6
  mythical: "#f2559b",       // pink        5.7 / 5.3 / 4.7
});

module.exports = { colors, rarityColors };
// IdleRPG colour theme: "Lantern-lit workshop" (dark).
// Warm charred-wood backgrounds, parchment text, brass and verdigris accents,
// and rarities named after old pigments and metals.
//
// Every text colour meets WCAG AA (4.5:1) on background, surface AND surfaceRaised.
// Ratios noted as: on background / surface / surfaceRaised.
//
// CommonJS because tailwind.config.js require()s this file.

const colors = /** @type {const} */ ({
  // Backgrounds: charred umber, not the usual navy
  background: "#15110e",     // soot
  surface: "#1e1814",        // dark walnut: cards, panels
  surfaceRaised: "#2a221c",  // oiled oak: modals, pressed states, nested cards

  // Borders
  border: "#3b3028",         // decorative dividers
  borderStrong: "#86765f",   // input outlines, toggles: 4.0:1 on surface

  // Text: parchment tones rather than pure grey-white
  textPrimary: "#efe6d6",    // parchment  15.2 / 14.2 / 12.6
  textSecondary: "#c4b6a2",  // vellum      9.4 /  8.8 /  7.9
  textMuted: "#9c8d79",      // faded ink   5.8 /  5.4 /  4.8

  // Brand
  primary: "#c99a4e",        // brass       7.4 / 6.9 / 6.1   main buttons, XP bars
  onPrimary: "#1e1406",      //             7.1:1 on primary
  secondary: "#7ab5a2",      // verdigris   8.0 / 7.5 / 6.7   secondary actions, links
  onSecondary: "#0d1f1a",    //             7.3:1 on secondary

  // Status
  success: "#93bf72",        // moss        8.9 / 8.3 / 7.4
  warning: "#e3925a",        // ochre fire  7.6 / 7.1 / 6.3
  danger: "#e2776c",         // terracotta  6.3 / 5.9 / 5.3
  info: "#86a8d8",           // slate blue  7.7 / 7.2 / 6.4
});

// Rarities named for pigments and metals; each a different hue AND lightness,
// so they stay distinguishable for most forms of colour blindness.
// Keep in sync with RARITIES[*].color in packages/shared/src/gameData.ts.
const rarityColors = /** @type {const} */ ({
  common: "#bcb3a6",         // bone        9.1 / 8.5 / 7.5
  uncommon: "#93bf72",       // lichen      8.9 / 8.3 / 7.4
  rare: "#6fa0e3",           // woad        7.0 / 6.5 / 5.8
  epic: "#b48cdb",           // heather     6.9 / 6.5 / 5.7
  legendary: "#f5c542",      // gilt       11.6 / 10.8 / 9.6  (brighter than brass, so it never reads as a button)
  mythical: "#e57aa8",       // rose madder 6.9 / 6.4 / 5.7
});

module.exports = { colors, rarityColors };

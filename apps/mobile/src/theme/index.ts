import { colors, rarityColors } from './colors';

export { colors, rarityColors };

export type ColorName = keyof typeof colors;
export type RarityColorName = keyof typeof rarityColors;

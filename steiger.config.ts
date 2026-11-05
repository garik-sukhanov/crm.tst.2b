import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // На старте в слоях по одному срезу — правило про «лишнее» дробление пока шумит.
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
]);

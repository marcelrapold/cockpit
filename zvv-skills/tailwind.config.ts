import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ATLAS: Brand-Tokens gegen atlas.zvv.dev verifizieren (siehe ATLAS.md).
        zvv: {
          blue: 'var(--zvv-blue)',
          ink: 'var(--zvv-ink)',
          paper: 'var(--zvv-paper)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};

export default config;

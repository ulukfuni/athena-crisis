import { readFileSync } from 'node:fs';
import { defineConfig } from 'vocs/config';

const Licht = JSON.parse(readFileSync('./node_modules/licht-theme/licht.json', 'utf8'));
const Dunkel = JSON.parse(readFileSync('./node_modules/dunkel-theme/dunkel.json', 'utf8'));

export default defineConfig({
  accentColor: '#c3217f',
  basePath: '/open-source',
  baseUrl: 'http://localhost:3003',
  codeHighlight: {
    themes: {
      dark: Dunkel,
      light: Licht,
    },
  },
  description: 'Open Source Docs & Playground',
  editLink: {
    link: 'https://github.com/ulukfuni/athena-crisis/tree/main/docs/content/pages/:path',
    text: 'Edit on GitHub',
  },
  ogImageUrl: 'https://vocs.dev/api/og?logo=%logo&title=%title&description=%description',
  renderStrategy: 'full-static',
  sidebar: [
    {
      link: '/getting-started',
      text: 'Getting Started',
    },
    {
      items: [
        {
          link: '/core-concepts/overview',
          text: 'Overview',
        },
        {
          link: '/core-concepts/immutable-data-structures',
          text: 'Immutable Data Structures',
        },
        {
          link: '/core-concepts/map-data',
          text: 'MapData ',
        },
        {
          link: '/core-concepts/actions',
          text: 'Actions ',
        },
        {
          link: '/core-concepts/ai',
          text: 'AI Deep Dive',
        },
      ],
      text: 'Core Concepts',
    },
    {
      items: [
        {
          link: '/ui/game-components',
          text: 'Game Components',
        },
      ],
      text: 'UI Components',
    },
    {
      items: [
        {
          link: '/playground/map-editor',
          text: 'Map Editor',
        },
        {
          link: '/playground/ai',
          text: 'AI',
        },
      ],
      text: 'Playground',
    },
  ],
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/ulukfuni/athena-crisis',
    },
  ],
  srcDir: 'content',
  title: 'Turn-Based Strategy Game',
  topNav: [{ link: '/core-concepts/overview', match: '/core-concepts', text: 'Docs' }],
});

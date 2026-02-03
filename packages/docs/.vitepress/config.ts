import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'PTL',
  description: 'Probabilistic Type Lattice - Bayesian Type Inference',

  base: '/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#007acc' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'PTL Documentation' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '/guide/' },
      { text: 'API', link: '/api/', activeMatch: '/api/' },
      { text: 'Playground', link: 'https://ptl.dev/playground' },
      {
        text: 'Resources',
        items: [
          { text: 'Examples', link: '/examples/' },
          { text: 'Blog', link: '/blog/' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
          ],
        },
        {
          text: 'Bayesian Inference',
          items: [
            { text: 'How It Works', link: '/guide/how-it-works' },
            { text: 'Type Priors', link: '/guide/type-priors' },
            { text: 'Confidence Intervals', link: '/guide/confidence-intervals' },
            { text: 'Type Lattice', link: '/guide/type-lattice' },
          ],
        },
        {
          text: 'Tools',
          items: [
            { text: 'CLI', link: '/guide/cli' },
            { text: 'VS Code Extension', link: '/guide/vscode' },
            { text: 'Web Playground', link: '/guide/playground' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Custom Priors', link: '/guide/custom-priors' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Performance', link: '/guide/performance' },
            { text: 'Integration', link: '/guide/integration' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'Core API',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'BayesianTypeInference', link: '/api/bayesian-type-inference' },
            { text: 'TypeLattice', link: '/api/type-lattice' },
            { text: 'PriorDatabase', link: '/api/prior-database' },
          ],
        },
        {
          text: 'Types',
          items: [
            { text: 'TypeNode', link: '/api/types/type-node' },
            { text: 'InferenceResult', link: '/api/types/inference-result' },
            { text: 'ConfidenceInterval', link: '/api/types/confidence-interval' },
          ],
        },
        {
          text: 'Utilities',
          items: [
            { text: 'Formatters', link: '/api/utilities/formatters' },
            { text: 'Validators', link: '/api/utilities/validators' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Basic Usage', link: '/examples/basic' },
            { text: 'Function Inference', link: '/examples/functions' },
            { text: 'Object Types', link: '/examples/objects' },
            { text: 'Generic Types', link: '/examples/generics' },
            { text: 'Custom Priors', link: '/examples/custom-priors' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/iamthegreatdestroyer/PTL' }],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/iamthegreatdestroyer/PTL/edit/main/packages/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 PTL Contributors',
    },
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
});

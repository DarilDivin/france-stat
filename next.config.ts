import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimisations pour réduire la taille du bundle sur Vercel
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
    // Note: optimizeCss disabled due to critters module issue
  },
  // Externaliser les gros packages pour réduire la taille des fonctions serverless
  serverExternalPackages: ['d3', 'gsap', 'topojson-client'],
  // Configuration webpack pour l'optimisation
  webpack: (config, { isServer }) => {
    // Pour le serveur, externaliser les gros packages pour réduire la taille des fonctions serverless
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'd3': 'commonjs d3',
        'd3-scale': 'commonjs d3-scale',
        'd3-selection': 'commonjs d3-selection',
        'd3-shape': 'commonjs d3-shape',
        'd3-geo': 'commonjs d3-geo',
        'd3-zoom': 'commonjs d3-zoom',
        'd3-transition': 'commonjs d3-transition',
        'd3-color': 'commonjs d3-color',
        'd3-axis': 'commonjs d3-axis',
        'gsap': 'commonjs gsap',
        'topojson-client': 'commonjs topojson-client',
      });
    }

    // Optimisation des fallbacks pour réduire la taille
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
      };
    }

    // Optimiser la résolution des modules pour tree-shaking
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Optimiser les loaders pour réduire la taille
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/i,
      type: 'asset/resource',
    });

    // Diviser les vendor chunks pour améliorer le caching (client seulement)
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            d3: {
              test: /[\\/]node_modules[\\/]d3/,
              name: 'd3',
              priority: 20,
              reuseExistingChunk: true,
            },
            gsap: {
              test: /[\\/]node_modules[\\/]gsap/,
              name: 'gsap',
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
  // Compression et optimisation des outputs
  compress: true,
  // Configuration des images pour optimiser
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  // Configuration de sortie pour Vercel - optimisée pour réduire la taille
  // output: 'standalone', // Disabled due to Windows symlink issues
  // Optimiser les imports pour tree-shaking (remove conflict with serverExternalPackages)
  transpilePackages: [],
  // Désactiver les features non utilisées pour réduire la taille
  poweredByHeader: false,
  // Optimiser les chunks
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Réduire la taille du bundle en excluant certains modules côté serveur
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
  // Optimiser la compression des assets - remove duplicate
  productionBrowserSourceMaps: false,
};

export default nextConfig;

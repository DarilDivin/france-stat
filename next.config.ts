import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimisations pour réduire la taille du bundle sur Vercel
  experimental: {
    optimizePackageImports: ['d3', 'gsap', 'lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
    // Note: optimizeCss disabled due to critters module issue
  },
  // Configuration webpack pour l'optimisation
  webpack: (config, { isServer }) => {
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

    // Diviser les vendor chunks pour améliorer le caching
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

    return config;
  },
  // Compression et optimisation des outputs
  compress: true,
  // Configuration des images pour optimiser
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  // Configuration de sortie pour Vercel
  // output: 'standalone', // Disabled due to Windows symlink issues
  // Optimiser les imports pour tree-shaking (remove conflict with serverExternalPackages)
  transpilePackages: ['lucide-react'],
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

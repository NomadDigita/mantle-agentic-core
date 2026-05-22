import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Tells the engine to ignore missing Web3 background modules
    config.externals.push('pino-pretty', 'lokijs', 'encoding', 'accounts');
    
    // Prevents core Node modules from breaking the browser
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false 
    };
    
    return config;
  },
};

export default nextConfig;
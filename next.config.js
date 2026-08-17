/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Las fuentes se cargan por <link> en el layout; evitamos que Next intente
  // optimizar ese stylesheet externo (solo generaba un aviso inocuo).
  optimizeFonts: false,
};
module.exports = nextConfig;

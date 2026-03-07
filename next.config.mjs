/** @type {import('next').NextConfig} */
const basePath = '/snake';

const nextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  }
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/assets/**",
        search: ""
      }
    ]
  }
};

export default nextConfig;

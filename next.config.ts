import type { NextConfig } from "next";

function getAllowedDevOrigins() {
  const configuredHosts = process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredHosts?.length) {
    return configuredHosts;
  }

  return ["192.168.1.219"];
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: getAllowedDevOrigins(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xyrcjaaodgrntcddmpba.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // events index merged into the homepage; detail pages stay at /events/[slug]
      { source: "/events", destination: "/", permanent: true },
      // guide page retired in the reshape
      { source: "/guide", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/reports/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default nextConfig;

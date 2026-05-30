import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@napi-rs/canvas",
    "pdf-parse",
    "pdfjs-dist",
    "pdf-to-img",
    "tesseract.js",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  outputFileTracingIncludes: {
    "/api/contracts/upload": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    ],
  },
};

export default nextConfig;

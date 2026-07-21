import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
];

// CORS restrito ao preview web do app mobile (Expo roda em localhost:8081).
// No Android o CORS nao se aplica, entao isso serve apenas para conseguir
// desenvolver as telas no navegador — por isso fica FORA do build de producao.
const isDev = process.env.NODE_ENV === "development";

const devCorsHeaders = [
  { key: "Access-Control-Allow-Origin", value: "http://localhost:8081" },
  { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
  { key: "Vary", value: "Origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...(isDev
        ? [
            {
              source: "/api/:path*",
              headers: devCorsHeaders,
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;

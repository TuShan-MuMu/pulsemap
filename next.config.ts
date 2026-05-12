import type { NextConfig } from "next";

const _SECURITY_HEADERS = [
  // 防止点击劫持
  { key: "X-Frame-Options", value: "DENY" },
  // 阻止MIME类型嗅探
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 控制Referer泄露
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 强制HTTPS
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // 修正Permissions-Policy格式错误（你的旧格式会导致CSP整体失效）
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // 完整适配高德地图的CSP白名单
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com https://webapi.amap.com https://*.amap.com",
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com https://webapi.amap.com https://*.amap.com",
      "img-src 'self' data: blob: https://*.mapbox.com https://*.amap.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.mapbox.com https://*.mapbox.com https://www.who.int https://events.mapbox.com https://*.amap.com",
      "worker-src 'self' blob:",
      "child-src blob:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: _SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;



/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: "/dashboard/contributions/receive",
        destination: "/admin/contributions/receive",
        permanent: false,
      },
      {
        source: "/dashboard/contributions/new",
        destination: "/admin/contributions/receive",
        permanent: false,
      },
      {
        source: "/dashboard/contributions/ledger",
        destination: "/admin/contributions/ledger",
        permanent: false,
      },
      {
        source: "/dashboard/contributions",
        destination: "/admin/contributions",
        permanent: false,
      },
      {
        source: "/dashboard/beneficiaries/new",
        destination: "/admin/beneficiaries/new",
        permanent: false,
      },
      {
        source: "/dashboard/beneficiaries/ledger",
        destination: "/admin/beneficiaries/ledger",
        permanent: false,
      },
      {
        source: "/dashboard/beneficiaries",
        destination: "/admin/beneficiaries",
        permanent: false,
      },
      {
        source: "/dashboard/groups/new",
        destination: "/admin/groups/new",
        permanent: false,
      },
      {
        source: "/dashboard/groups",
        destination: "/admin/groups",
        permanent: false,
      },
      {
        source: "/dashboard/profile",
        destination: "/admin/profile",
        permanent: false,
      },
      {
        source: "/dashboard",
        destination: "/admin/dashboard",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8000/api/v1/:path*",
      },
      {
        source: "/docs",
        destination: "http://127.0.0.1:8000/docs",
      },
      {
        source: "/openapi.json",
        destination: "http://127.0.0.1:8000/openapi.json",
      },
    ];
  },
};

export default nextConfig;

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
        source: "/dashboard/qard-hasan/new",
        destination: "/admin/qard-hasan/new",
        permanent: false,
      },
      {
        source: "/dashboard/qard-hasan/ledger",
        destination: "/admin/qard-hasan/ledger",
        permanent: false,
      },
      {
        source: "/dashboard/qard-hasan/:id/repay",
        destination: "/admin/qard-hasan/:id/repay",
        permanent: false,
      },
      {
        source: "/dashboard/qard-hasan/:id",
        destination: "/admin/qard-hasan/:id",
        permanent: false,
      },
      {
        source: "/dashboard/qard-hasan",
        destination: "/admin/qard-hasan",
        permanent: false,
      },
      {
        source: "/dashboard/sadaqah/new",
        destination: "/admin/sadaqah/new",
        permanent: false,
      },
      {
        source: "/dashboard/sadaqah/ledger",
        destination: "/admin/sadaqah/ledger",
        permanent: false,
      },
      {
        source: "/dashboard/sadaqah/:id",
        destination: "/admin/sadaqah/:id",
        permanent: false,
      },
      {
        source: "/dashboard/sadaqah",
        destination: "/admin/sadaqah",
        permanent: false,
      },
      {
        source: "/dashboard/sadakah/new",
        destination: "/admin/sadaqah/new",
        permanent: false,
      },
      {
        source: "/dashboard/sadakah/ledger",
        destination: "/admin/sadaqah/ledger",
        permanent: false,
      },
      {
        source: "/dashboard/sadakah/:id",
        destination: "/admin/sadaqah/:id",
        permanent: false,
      },
      {
        source: "/dashboard/sadakah",
        destination: "/admin/sadaqah",
        permanent: false,
      },
      {
        source: "/admin/sadakah/new",
        destination: "/admin/sadaqah/new",
        permanent: false,
      },
      {
        source: "/admin/sadakah/ledger",
        destination: "/admin/sadaqah/ledger",
        permanent: false,
      },
      {
        source: "/admin/sadakah/:id",
        destination: "/admin/sadaqah/:id",
        permanent: false,
      },
      {
        source: "/admin/sadakah",
        destination: "/admin/sadaqah",
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
        source: "/dashboard/expenses/new",
        destination: "/admin/expenses/new",
        permanent: false,
      },
      {
        source: "/dashboard/expenses/ledger",
        destination: "/admin/expenses/ledger",
        permanent: false,
      },
      {
        source: "/dashboard/expenses/:id",
        destination: "/admin/expenses/:id",
        permanent: false,
      },
      {
        source: "/dashboard/expenses",
        destination: "/admin/expenses",
        permanent: false,
      },
      {
        source: "/dashboard/audit-logs",
        destination: "/admin/dashboard",
        permanent: false,
      },
      {
        source: "/admin/audit-logs",
        destination: "/admin/dashboard",
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

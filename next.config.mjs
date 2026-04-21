import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@react-pdf/renderer'],
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb'
        }
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
    },
    // Security headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
        ]
    },

    // Compress output
    compress: true,
    // Optimize production build
    swcMinify: true,
}

export default withBundleAnalyzer(nextConfig)

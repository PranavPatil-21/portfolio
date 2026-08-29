import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Sveltia CMS is a static page in `public/admin/`. Next serves files from
      // `public/` at their exact path, so `/admin` and `/admin/` would 404
      // without this — only `/admin/index.html` would resolve.
      { source: '/admin', destination: '/admin/index.html' },
      { source: '/admin/', destination: '/admin/index.html' },
    ]
  },
}

export default nextConfig

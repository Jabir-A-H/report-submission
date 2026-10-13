import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "তা'লীমুল কুরআন রিপোর্ট",
    short_name: "তা'লীমুল কুরআন রিপোর্ট",
    description: "Talimul Quran Report - সাংগঠনিক রিপোর্ট সাবমিশন ও মনিটরিং পোর্টাল",
    start_url: "/home",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0da2b8",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}

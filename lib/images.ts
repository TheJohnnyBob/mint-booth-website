// Cloudflare Images configuration with your actual image IDs
export const CLOUDFLARE_IMAGES = {
  logos: {
    horizontal_white: "https://imagedelivery.net/m_7m-qcUZ1i_ecql-_Mosw/caa03f2f-67e6-4d9f-003f-172097527d00/public",
    horizontal_black: "https://imagedelivery.net/m_7m-qcUZ1i_ecql-_Mosw/79a51618-dc30-4442-44fb-9a8a390c5200/public",
    shape_white: "https://imagedelivery.net/m_7m-qcUZ1i_ecql-_Mosw/864c1510-acd6-43e3-9252-6beadaef8c00/public",
    shape_black: "https://imagedelivery.net/m_7m-qcUZ1i_ecql-_Mosw/cc9963b2-fb28-40f1-eb11-49439b59ec00/public",
    words_white: "https://imagedelivery.net/m_7m-qcUZ1i_ecql-_Mosw/fe3aca0a-56e1-4d30-8752-fe84763ed900/public",
    words_black: "https://imagedelivery.net/m_7m-qcUZ1i_ecql-_Mosw/cdb8ef84-bbcb-471c-fe28-0133304c8a00/public",
  },
}

// Helper function to get logo URL
export function getLogoUrl(type: keyof typeof CLOUDFLARE_IMAGES.logos): string {
  return CLOUDFLARE_IMAGES.logos[type]
}

// Optional: Helper for different variants (if you want to use different sizes)
export function getLogoUrlWithVariant(type: keyof typeof CLOUDFLARE_IMAGES.logos, variant = "public"): string {
  const logoId = CLOUDFLARE_IMAGES.logos[type].split("/")[4] // Extract the UUID
  return `https://imagedelivery.net/m_7m-qcUZ1i_ecql-_Mosw/${logoId}/${variant}`
}

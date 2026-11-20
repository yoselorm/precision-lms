// Bunny Stream links (what trainers copy from Bunny): a share page like
//   https://iframe.mediadelivery.net/play/{library}/{video}
// or the embed URL
//   https://iframe.mediadelivery.net/embed/{library}/{video}
// Both play through Bunny's embed player. Returns that embed URL, or null if
// `url` isn't a Bunny Stream link (then it's a plain video file).
export function bunnyEmbedUrl(url, { autoPlay = false } = {}) {
  const match = /^https?:\/\/(?:iframe|player)\.mediadelivery\.net\/(?:play|embed)\/(\d+)\/([0-9a-f-]+)/i.exec(String(url || "").trim());
  if (!match) return null;
  const [, library, video] = match;
  return `https://iframe.mediadelivery.net/embed/${library}/${video}?autoplay=${autoPlay ? "true" : "false"}&preload=true&responsive=true`;
}

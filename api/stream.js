export const config = {
  runtime: "nodejs",
};

function rewritePlaylist(playlistText, baseUrl, origin) {
  return playlistText
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return line;
      }

      const absoluteUrl = new URL(trimmed, baseUrl).toString();
      return `${origin}/api/segment?url=${encodeURIComponent(absoluteUrl)}`;
    })
    .join("\n");
}

export default async function handler(req, res) {
  const PLAYLIST_URL =
    "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com/hls/MB5KADfTop.m3u8";

  try {
    const upstream = await fetch(PLAYLIST_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com/",
        Origin: "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com",
      },
      redirect: "follow",
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return res.status(upstream.status).send(text || "No se pudo cargar el playlist");
    }

    const playlistText = await upstream.text();
    const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

    const rewrittenPlaylist = rewritePlaylist(playlistText, PLAYLIST_URL, origin);

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    return res.status(200).send(rewrittenPlaylist);
  } catch (error) {
    return res.status(500).send(`Error cargando playlist: ${error.message}`);
  }
}
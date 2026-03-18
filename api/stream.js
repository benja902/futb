export default async function handler(req, res) {
  const PLAYLIST_URL =
    "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com/hls/MB5KADfTop.m3u8";

  try {
    const response = await fetch(PLAYLIST_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com/",
        Origin: "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com",
      },
    });

    if (!response.ok) {
      return res.status(response.status).send("No se pudo cargar el playlist");
    }

    const playlistText = await response.text();

    const origin =
      `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

    const rewrittenPlaylist = playlistText
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) {
          return line;
        }

        const absoluteUrl = new URL(trimmed, PLAYLIST_URL).toString();

        return `${origin}/api/segment?url=${encodeURIComponent(absoluteUrl)}`;
      })
      .join("\n");

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.status(200).send(rewrittenPlaylist);
  } catch (error) {
    res.status(500).send(`Error cargando playlist: ${error.message}`);
  }
}
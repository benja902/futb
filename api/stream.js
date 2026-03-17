export default async function handler(req, res) {
  const BASE_URL = "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com/hls";
  const PLAYLIST_URL = `${BASE_URL}/MB5KADfTop.m3u8`;

  try {
    const response = await fetch(PLAYLIST_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com/",
      },
    });

    if (!response.ok) {
      return res.status(response.status).send("No se pudo cargar el playlist");
    }

    let playlist = await response.text();

    playlist = playlist.replace(
      /^(?!#)(.*\.ts.*)$/gm,
      (_, segment) =>
        `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/api/segment?url=${encodeURIComponent(`${BASE_URL}/${segment}`)}`
    );

    playlist = playlist.replace(
      /^(?!#)(.*\.m3u8.*)$/gm,
      (_, nestedPlaylist) =>
        `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/api/segment?url=${encodeURIComponent(`${BASE_URL}/${nestedPlaylist}`)}`
    );

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(playlist);
  } catch (error) {
    res.status(500).send(`Error cargando playlist: ${error.message}`);
  }
}
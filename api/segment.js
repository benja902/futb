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
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).send("Falta url");
    }

    const headers = {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com/",
      Origin: "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com",
    };

    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    const upstream = await fetch(url, {
      headers,
      redirect: "follow",
    });

    if (!upstream.ok && upstream.status !== 206) {
      const text = await upstream.text().catch(() => "");
      console.log("UPSTREAM ERROR:", upstream.status, url, text);
      return res.status(upstream.status).send(text || "Error cargando recurso");
    }

    const contentType = upstream.headers.get("content-type") || "";
    const finalUrl = upstream.url || url;

    const isPlaylist =
      contentType.includes("application/vnd.apple.mpegurl") ||
      contentType.includes("application/x-mpegURL") ||
      finalUrl.includes(".m3u8");

    const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

    if (isPlaylist) {
      const playlistText = await upstream.text();
      const rewrittenPlaylist = rewritePlaylist(playlistText, finalUrl, origin);

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

      return res.status(200).send(rewrittenPlaylist);
    }

    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    const acceptRanges = upstream.headers.get("accept-ranges");
    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader("Content-Type", contentType || "video/mp2t");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    if (acceptRanges) {
      res.setHeader("Accept-Ranges", acceptRanges);
    } else {
      res.setHeader("Accept-Ranges", "bytes");
    }

    if (contentRange) {
      res.setHeader("Content-Range", contentRange);
    }

    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    return res.status(upstream.status === 206 ? 206 : 200).send(buffer);
  } catch (error) {
    console.log("SEGMENT FETCH ERROR:", error);
    return res.status(500).send("Error interno");
  }
}
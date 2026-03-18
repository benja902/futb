export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).send("Falta url");
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com/",
        "Origin": "https://hls-b2bc1b24ff.server-1-522c630a83.balontv.com"
      }
    });

    if (!response.ok) {
      console.log("ERROR SEGMENT:", url, response.status);
      return res.status(response.status).send("Error cargando segmento");
    }

    const contentType =
      response.headers.get("content-type") || "video/mp2t";

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache");

    res.status(200).send(buffer);

  } catch (error) {
    console.log("ERROR FETCH SEGMENT:", error.message);
    res.status(500).send("Error interno");
  }
}
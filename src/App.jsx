import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

const STREAM_URL = "/api/stream";
const HLS_SUPPORTED = Hls.isSupported();

export default function App() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState(
    HLS_SUPPORTED ? "Inicializando..." : "HLS no soportado"
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !HLS_SUPPORTED) return;

    const hls = new Hls();
    hls.loadSource(STREAM_URL);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setStatus("Reproduciendo...");
      video.play().catch(() => {
        setStatus("Presiona play");
      });
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      console.error("HLS error:", data);
      setStatus(`Error: ${data.details}`);
    });

    return () => hls.destroy();
  }, []);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>HLS Player con Proxy</h1>
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        playsInline
        style={{ width: "800px", maxWidth: "100%" }}
      />
      <p>{status}</p>
    </div>
  );
}
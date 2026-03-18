import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

const STREAM_URL = "/api/stream";

export default function App() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Inicializando...");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls;

    const onVideoError = () => {
      const err = video.error;
      console.log("VIDEO ERROR", err);
      setStatus("Error al reproducir en este dispositivo");
    };

    video.addEventListener("error", onVideoError);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = STREAM_URL;
      setStatus("Usando reproducción nativa");

      video
        .play()
        .then(() => setStatus("Reproduciendo"))
        .catch(() => setStatus("Presiona play"));

      return () => {
        video.removeEventListener("error", onVideoError);
      };
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(STREAM_URL);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus("Manifest cargado");
        video.play().catch(() => {
          setStatus("Presiona play");
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.log("HLS ERROR", data);
        setStatus(`Error HLS: ${data.details}`);
      });
    } else {
      setStatus("Este navegador no soporta HLS");
    }

    return () => {
      video.removeEventListener("error", onVideoError);
      if (hls) hls.destroy();
    };
  }, []);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>Fútbol en vivo</h1>

      <video
        ref={videoRef}
        controls
        playsInline
        muted
        autoPlay
        style={{ width: "100%", maxWidth: "900px", background: "#000" }}
      />

      <p>{status}</p>
    </div>
  );
}
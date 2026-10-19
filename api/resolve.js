// api/resolve.js — serverless proxy for media resolution
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method" });
  }

  const { url, format } = req.body || {};
  if (!url) return res.status(400).json({ error: "missing url" });

  const kind = format === "mp3" ? "audio" : "video";

  try {
    const upstream = await fetch(
      `https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=${encodeURIComponent(extractId(url))}&urlAccess=normal&videos=auto&audios=auto`,
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "youtube-media-downloader.p.rapidapi.com",
        },
      }
    );

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: "resolver" });
    }

    const data = await upstream.json();
    const pool = kind === "audio" ? data.audios?.items || [] : data.videos?.items || [];

    if (!pool.length) return res.status(404).json({ error: "no formats" });

    const streams = pool.map((s) => ({
      quality: s.qualityLabel || s.bitrate || "auto",
      ext: kind === "audio" ? "mp3" : "mp4",
      url: s.url,
      size: s.size || null,
    }));

    return res.status(200).json({ title: data.title, thumb: data.thumbnails?.[0]?.url, streams });
  } catch {
    return res.status(500).json({ error: "proxy" });
  }
}

function extractId(input) {
  try {
    const u = new URL(input);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    return u.searchParams.get("v") || "";
  } catch {
    return input;
  }
}

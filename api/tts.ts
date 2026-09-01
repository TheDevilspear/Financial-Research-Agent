import { generatePodcastAudio } from "../server/lib/podcastGenerator.ts";

export const config = {
  maxDuration: 30,
};

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { text } = body;
    if (!text) {
      return res.status(400).json({ error: "Missing text." });
    }

    const audioBuffer = await generatePodcastAudio(text);
    res.setHeader("Content-Type", "audio/wav");
    res.send(audioBuffer);
  } catch (error: any) {
    console.error("[TTS] Error:", error);
    res.status(500).json({ error: error.message || "TTS Generation failed" });
  }
}

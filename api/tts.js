// server/lib/podcastGenerator.ts
async function generatePodcastAudio(text) {
  const sampleRate = 24e3;
  const numChannels = 1;
  const durationSeconds = Math.min(10, Math.max(2, Math.floor(text.length / 50)));
  const totalSamples = sampleRate * durationSeconds;
  const pcmBuffer = Buffer.alloc(totalSamples * 2);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 0.5) * 8e3;
    pcmBuffer.writeInt16LE(Math.floor(sample), i * 2);
  }
  const wavHeader = Buffer.alloc(44);
  wavHeader.write("RIFF", 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write("WAVE", 8);
  wavHeader.write("fmt ", 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(sampleRate * numChannels * 2, 28);
  wavHeader.writeUInt16LE(numChannels * 2, 32);
  wavHeader.writeUInt16LE(16, 34);
  wavHeader.write("data", 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([wavHeader, pcmBuffer]);
}

// server/api/tts.ts
var config = {
  maxDuration: 30
};
async function handler(req, res) {
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
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { text } = body;
    if (!text) {
      return res.status(400).json({ error: "Missing text." });
    }
    const audioBuffer = await generatePodcastAudio(text);
    res.setHeader("Content-Type", "audio/wav");
    res.send(audioBuffer);
  } catch (error) {
    console.error("[TTS] Error:", error);
    res.status(500).json({ error: error.message || "TTS Generation failed" });
  }
}
export {
  config,
  handler as default
};

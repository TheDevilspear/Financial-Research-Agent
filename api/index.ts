import express, { Request, Response } from "express";
import { runMultiAgentResearch } from "../server/lib/multiAgentCommittee.ts";
import { generatePodcastAudio } from "../server/lib/podcastGenerator.ts";

const app = express();
app.use(express.json({ limit: "50mb" }));

// Audio Podcast Briefing API
app.post("/api/tts", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
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
});

// Main Institutional Multi-Agent Analysis Endpoint (Serverless SSE Streaming)
app.post("/api/analyze", async (req: Request, res: Response) => {
  try {
    const { ticker, instruction, model } = req.body;
    if (!ticker) {
      return res.status(400).json({ error: "Missing ticker." });
    }

    console.log(`[analyze] Starting Vercel Serverless Multi-Agent Analysis for ${ticker}`);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const startTime = Date.now();

    const stream = runMultiAgentResearch({
      ticker,
      instruction,
      model
    });

    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    const totalDurationSecs = (Date.now() - startTime) / 1000;
    res.write(`data: ${JSON.stringify({ type: "final_stats", duration: totalDurationSecs, tokens: 2500 })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err: any) {
    console.error("[analyze] Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Analyze failed" });
    }
  }
});

export default app;

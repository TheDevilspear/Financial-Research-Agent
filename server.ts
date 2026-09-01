import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { runMultiAgentResearch } from "./server/lib/multiAgentCommittee.ts";
import { generatePodcastAudio } from "./server/lib/podcastGenerator.ts";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Audio Podcast Briefing API
  app.post("/api/tts", async (req, res) => {
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

  // Artifact upload / download
  app.post("/api/upload_artifact", express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
    try {
      const fileName = req.query.name || 'podcast_briefing.wav';
      const localArtifactsDir = path.join(process.cwd(), 'workspace', 'artifacts');
      if (!fs.existsSync(localArtifactsDir)) {
        fs.mkdirSync(localArtifactsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(localArtifactsDir, fileName as string), req.body);
      console.log(`[upload] Successfully saved ${fileName} (${req.body.length} bytes)`);
      res.json({ success: true });
    } catch (e) {
      console.error("[upload] Error:", e);
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/download_jsonl", (req, res) => {
    const ticker = req.query.ticker;
    if (!ticker) {
      return res.status(400).send("Missing ticker");
    }
    
    const runLogsDir = path.join(process.cwd(), 'run_logs');
    if (!fs.existsSync(runLogsDir)) {
      return res.status(404).send("No logs found");
    }
    
    const files = fs.readdirSync(runLogsDir)
      .filter(f => f.startsWith(`run_log_${ticker}_`) && f.endsWith('.jsonl'))
      .sort((a, b) => {
        const aMatch = a.match(/_(\d+)\.jsonl$/);
        const bMatch = b.match(/_(\d+)\.jsonl$/);
        if (aMatch && bMatch) {
          return parseInt(bMatch[1]) - parseInt(aMatch[1]);
        }
        return 0;
      });
      
    if (files.length === 0) {
      return res.status(404).send("No JSONL log found for ticker");
    }
    
    const latestFile = path.join(runLogsDir, files[0]);
    res.download(latestFile);
  });

  // Main Institutional Multi-Agent Analysis Endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { ticker, instruction, model } = req.body;
      if (!ticker) {
        return res.status(400).json({ error: "Missing ticker." });
      }

      console.log(`[analyze] Starting Institutional Multi-Agent Analysis for ${ticker}`);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const startTime = Date.now();
      const runLogsDir = path.join(process.cwd(), 'run_logs');
      if (!fs.existsSync(runLogsDir)) {
        fs.mkdirSync(runLogsDir, { recursive: true });
      }

      const runId = Date.now();
      const jsonlLogPath = path.join(runLogsDir, `run_log_${ticker}_${runId}.jsonl`);
      
      let debugLog = `--- Institutional Analysis for ${ticker} at ${new Date().toISOString()} ---\n\n`;
      const toolExecutions: Record<string, any> = {};

      const stream = runMultiAgentResearch({
        ticker,
        instruction,
        model
      });

      for await (const event of stream) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);

        try {
          fs.appendFileSync(jsonlLogPath, JSON.stringify(event) + '\n', 'utf-8');
        } catch (e) {
          console.error("Failed to write to JSONL log", e);
        }

        if (event.type === 'tool_call') {
          const callId = event.callId || `call_${Math.random()}`;
          toolExecutions[callId] = {
            name: event.name,
            args: event.arguments,
            startTime: Date.now()
          };
          debugLog += `[TOOL CALL] ${event.name}\nArguments: ${JSON.stringify(event.arguments, null, 2)}\n\n`;
        } else if (event.type === 'tool_result') {
          const callId = event.callId || 'unknown';
          const execution = toolExecutions[callId];
          const duration = execution ? ((Date.now() - execution.startTime) / 1000).toFixed(2) + 's' : '0.1s';
          if (execution) {
            execution.duration = duration;
            execution.result = event.result;
          }
          debugLog += `[TOOL RESULT] ${event.name} (${duration})\nResult: ${event.result?.substring(0, 300)}...\n\n`;
        } else if (event.type === 'text') {
          debugLog += `[SYNTHESIS] ${event.text}\n`;
        } else if (event.type === 'error') {
          debugLog += `[ERROR] ${event.message}\n`;
        }
      }

      const totalDurationSecs = ((Date.now() - startTime) / 1000);
      res.write(`data: ${JSON.stringify({ type: 'final_stats', duration: totalDurationSecs, tokens: 2500, jsonlLogUrl: '/run_logs/' + `run_log_${ticker}_${runId}.jsonl` })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (err: any) {
      console.error("[analyze] Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Analyze failed" });
      }
    }
  });

  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlExists = fs.existsSync(path.join(distPath, 'index.html'));
  app.use('/artifacts', express.static(path.join(process.cwd(), 'workspace', 'artifacts')));
  app.use('/run_logs', express.static(path.join(process.cwd(), 'run_logs')));
  app.use('/latest_log', express.static(process.cwd()));

  if (process.env.NODE_ENV !== "production" || !indexHtmlExists) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Institutional Financial Research Agent running on http://localhost:${PORT}`);
  });
}

startServer();

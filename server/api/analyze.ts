import { runMultiAgentResearch } from "../lib/multiAgentCommittee.ts";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  // Handle CORS
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
    const { ticker, instruction, model } = body;

    if (!ticker) {
      return res.status(400).json({ error: "Missing ticker." });
    }

    console.log(`[Vercel Serverless] Starting Analysis for ${ticker}`);

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    });

    const startTime = Date.now();
    const stream = runMultiAgentResearch({
      ticker,
      instruction,
      model
    });

    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
    }

    const totalDurationSecs = (Date.now() - startTime) / 1000;
    res.write(`data: ${JSON.stringify({ type: "final_stats", duration: totalDurationSecs, tokens: 2500 })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err: any) {
    console.error("[Vercel Serverless] Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Analyze failed" });
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
      res.end();
    }
  }
}

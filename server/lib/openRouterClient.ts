export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamEvent {
  type: "thinking" | "text" | "tool_call" | "tool_result" | "complete" | "error" | "done";
  text?: string;
  name?: string;
  arguments?: Record<string, unknown>;
  callId?: string;
  result?: string;
  interaction?: Record<string, unknown>;
  message?: string;
}

export async function* streamOpenRouterCompletion(
  messages: OpenRouterMessage[],
  preferredModel: string = "deepseek/deepseek-chat"
): AsyncGenerator<StreamEvent> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    yield { type: "error", message: "OPENROUTER_API_KEY is not set." };
    return;
  }

  // Model fallback chain: fast chat model -> resilient general instruct models
  const candidateModels = Array.from(new Set([
    preferredModel,
    "deepseek/deepseek-chat",
    "meta-llama/llama-3.3-70b-instruct",
    "qwen/qwen-2.5-72b-instruct",
    "deepseek/deepseek-r1"
  ]));

  let lastError = "";

  for (const model of candidateModels) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Financial Research Agent"
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: true,
          temperature: 0.2,
          max_tokens: 3500 // Prevents 402 credit cap reservation errors
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = errText;
        console.warn(`[OpenRouter] Model ${model} returned ${res.status}: ${errText}. Trying next fallback...`);
        if (res.status === 402 || res.status === 429) {
          continue; // Try next candidate model
        }
        yield { type: "error", message: `OpenRouter error (${res.status}): ${errText}` };
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        yield { type: "error", message: "No response body from OpenRouter." };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let inThinkingBlock = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") {
              yield { type: "done" };
              return;
            }

            try {
              const json = JSON.parse(dataStr);
              const delta = json.choices?.[0]?.delta;
              if (!delta) continue;

              // OpenRouter reasoning_content
              if (delta.reasoning_content) {
                yield { type: "thinking", text: delta.reasoning_content };
                continue;
              }

              if (delta.content) {
                const content = delta.content as string;
                if (content.includes("<think>")) {
                  inThinkingBlock = true;
                  const text = content.replace("<think>", "");
                  if (text) yield { type: "thinking", text };
                } else if (content.includes("</think>")) {
                  inThinkingBlock = false;
                  const text = content.replace("</think>", "");
                  if (text) yield { type: "text", text };
                } else if (inThinkingBlock) {
                  yield { type: "thinking", text: content };
                } else {
                  yield { type: "text", text: content };
                }
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
        return; // Successfully completed stream
      } finally {
        reader.releaseLock();
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  yield { type: "error", message: `All OpenRouter models failed: ${lastError}` };
}

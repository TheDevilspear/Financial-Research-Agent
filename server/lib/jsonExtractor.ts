/**
 * Utility to reliably extract JSON matching ReportData from model responses.
 */
import { ReportData } from "../../src/types.ts";

export function extractReportData(text: string): ReportData | null {
  if (!text) return null;

  try {
    // 1. Look for ```json ... ``` markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (isValidReportData(parsed)) {
        return parsed;
      }
    }

    // 2. Look for raw JSON object if no code block
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const rawJson = text.slice(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(rawJson);
      if (isValidReportData(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[jsonExtractor] Failed to parse ReportData:", err);
  }

  return null;
}

function isValidReportData(data: any): data is ReportData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.verdict === 'object' &&
    Array.isArray(data.findings)
  );
}

/**
 * Classifier Service — Stub version (Regex, BERT, and transformers removed)
 */

export type ClassificationResult = {
  priority: "HIGH" | "MEDIUM" | "LOW";
  regexFlags: string[];     // matched regex categories
  sentiment: {
    label: string;          // "POSITIVE" | "NEGATIVE" | "NEUTRAL"
    score: number;          // 0-1 confidence
    source: "bert" | "fallback";
  };
};

export async function classifyComplaint(text: string): Promise<ClassificationResult> {
  return {
    priority: "LOW",
    regexFlags: [],
    sentiment: {
      label: "NEUTRAL",
      score: 0.5,
      source: "fallback",
    },
  };
}

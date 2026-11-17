// User-friendly model names, mirroring the landing pricing section.
// Raw catalog IDs stay in tooltips; these labels are what users read.

const MODEL_NAMES: Record<string, string> = {
  'meta-models/Muse-Spark-Open-816B-A42B': 'Muse Spark Open',
  'zai-org/GLM-5.3-Flash': 'GLM 5.3 Flash',
  'anthropic/claude-haiku-5-5': 'Claude Haiku 5.5',
  'openai/gpt-6-luna': 'GPT-6 Luna',
  'deepseek-ai/DeepSeek-V4.1-Flash-1017': 'DeepSeek V4.1 Flash',
  'z-ai/glm-5.3-flash': 'GLM 5.3 Flash',
  'Qwen/Qwen3.8-27B': 'Qwen3.8 27B',
};

/** Friendly display name for a catalog model id. Falls back to the last
 * path segment, capped — unknown future models still read sensibly. */
export function friendlyModelName(id: string): string {
  const known = MODEL_NAMES[id];
  if (known) return known;
  const base = id.split('/').pop() ?? id;
  return base.length > 26 ? `${base.slice(0, 25)}…` : base;
}

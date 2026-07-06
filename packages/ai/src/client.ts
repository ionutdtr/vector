const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export function hasAiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

type Content = Array<{ type: string; text?: string; input?: unknown; name?: string }>;

async function callAnthropic(body: Record<string, unknown>): Promise<{ content?: Content }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as { content?: Content };
}

/** Force a structured JSON result via tool use, returning the raw tool input. */
export async function generateStructured(args: {
  model: string;
  system: string;
  userPrompt: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<unknown> {
  const data = await callAnthropic({
    model: args.model,
    // Structured outputs must never truncate mid-JSON — a cut tool input drops
    // required fields and 500s the parse. Give them ample room.
    max_tokens: args.maxTokens ?? 2048,
    system: [{ type: 'text', text: args.system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: args.userPrompt }],
    tools: [
      {
        name: args.toolName,
        description: args.toolDescription,
        input_schema: args.inputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: args.toolName },
  });
  const toolUse = (data.content ?? []).find((b) => b.type === 'tool_use');
  if (!toolUse) throw new Error('No tool_use block in Anthropic response');
  return toolUse.input;
}

/** Free-text reply (used by the Advisor chat). */
export async function generateText(args: {
  model: string;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
}): Promise<string> {
  const data = await callAnthropic({
    model: args.model,
    max_tokens: args.maxTokens ?? 1024,
    system: [{ type: 'text', text: args.system, cache_control: { type: 'ephemeral' } }],
    messages: args.messages,
  });
  const textBlock = (data.content ?? []).find((b) => b.type === 'text');
  return textBlock?.text ?? '';
}

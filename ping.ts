// Claude API 疎通確認: npx tsx --env-file=.env ping.ts
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error(".env に ANTHROPIC_API_KEY が見つかりません");

const client = new Anthropic({ apiKey });

const response = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 1024,
  output_config: { effort: "low" },
  messages: [{ role: "user", content: "「疎通OK」とだけ返してください。" }],
});

for (const block of response.content) {
  if (block.type === "text") console.log("応答:", block.text);
}
console.log("model:", response.model, "/ stop_reason:", response.stop_reason);
console.log("usage:", response.usage.input_tokens, "in /", response.usage.output_tokens, "out");

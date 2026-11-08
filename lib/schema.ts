// 構造化出力に渡す JSON Schema（sourceUrl は LLM に出させない）
export const recipeSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    yield: {
      type: "object",
      properties: {
        pan: { type: "string" },
        sizeCm: { type: "number" },
        servings: { type: "string" },
      },
      required: [],
      additionalProperties: false,
    },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          original: { type: "string" },
          grams: { type: ["number", "null"] },
          estimated: { type: "boolean" },
          group: { type: ["string", "null"] },
        },
        required: ["name", "original", "grams", "estimated", "group"],
        additionalProperties: false,
      },
    },
    prepTasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          timing: { type: "string" },
        },
        required: ["text", "timing"],
        additionalProperties: false,
      },
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          note: { type: ["string", "null"] },
          timerSec: { type: ["number", "null"] },
          uses: { type: "array", items: { type: "integer" } },
          image: { type: ["string", "null"] },
          alerts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                atSec: { type: "number" },
                text: { type: "string" },
              },
              required: ["atSec", "text"],
              additionalProperties: false,
            },
          },
        },
        required: ["text", "note", "timerSec", "uses", "image", "alerts"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "yield", "ingredients", "prepTasks", "steps"],
  additionalProperties: false,
} as const;

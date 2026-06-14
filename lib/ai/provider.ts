import "server-only";

export type AiProviderName = "sumopod" | "openai" | "gemini";

export interface GenerateTextOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateTextResult {
  provider: AiProviderName;
  model: string;
  text: string;
}

const DEFAULT_MODELS: Record<AiProviderName, string> = {
  sumopod: "MiniMax-M2.7-highspeed",
  openai: "gpt-4o-mini",
  gemini: "gemini-1.5-flash",
};

export async function generateAiText({
  prompt,
  temperature = 0.2,
  maxTokens = 1400,
}: GenerateTextOptions): Promise<GenerateTextResult> {
  const provider = getProvider();

  if (provider === "gemini") {
    return generateWithGemini({ prompt, temperature, maxTokens });
  }
  if (provider === "sumopod") {
    return generateWithOpenAICompatible({
      prompt,
      temperature,
      maxTokens,
      provider: "sumopod",
      apiKeyEnv: "SUMOPOD_API_KEY",
      baseUrl: process.env.SUMOPOD_BASE_URL ?? "https://ai.sumopod.com/v1",
      systemMessage:
        "Anda adalah analis risiko biaya bahan baku untuk UMKM Indonesia. Jawab hanya dengan JSON valid.",
    });
  }

  return generateWithOpenAI({ prompt, temperature, maxTokens });
}

function getProvider(): AiProviderName {
  const provider = (process.env.AI_PROVIDER ?? "sumopod").toLowerCase();
  if (provider === "sumopod" || provider === "openai" || provider === "gemini") {
    return provider;
  }

  throw new Error(
    'AI_PROVIDER harus bernilai "sumopod", "openai", atau "gemini".',
  );
}

function getModel(provider: AiProviderName): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODELS[provider];
}

async function generateWithOpenAI({
  prompt,
  temperature,
  maxTokens,
}: Required<GenerateTextOptions>): Promise<GenerateTextResult> {
  return generateWithOpenAICompatible({
    prompt,
    temperature,
    maxTokens,
    provider: "openai",
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrl: "https://api.openai.com/v1",
    systemMessage:
      "Anda adalah analis risiko biaya bahan baku untuk UMKM Indonesia. Jawab hanya dengan JSON valid.",
  });
}

async function generateWithOpenAICompatible({
  prompt,
  temperature,
  maxTokens,
  provider,
  apiKeyEnv,
  baseUrl,
  systemMessage,
}: Required<GenerateTextOptions> & {
  provider: Extract<AiProviderName, "sumopod" | "openai">;
  apiKeyEnv: "SUMOPOD_API_KEY" | "OPENAI_API_KEY";
  baseUrl: string;
  systemMessage: string;
}): Promise<GenerateTextResult> {
  const apiKey = process.env[apiKeyEnv];
  if (!apiKey) {
    throw new Error(`${apiKeyEnv} belum diset di environment server.`);
  }

  const model = getModel(provider);
  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `${provider} API error ${response.status}: ${await readError(response)}`,
    );
  }

  const json = (await response.json()) as OpenAIChatResponse;
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${provider} tidak mengembalikan teks insight.`);

  return { provider, model, text };
}

async function generateWithGemini({
  prompt,
  temperature,
  maxTokens,
}: Required<GenerateTextOptions>): Promise<GenerateTextResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum diset di environment server.");
  }

  const model = getModel("gemini").replace(/^models\//, "");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Gemini API error ${response.status}: ${await readError(response)}`,
    );
  }

  const json = (await response.json()) as GeminiGenerateResponse;
  const text = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini tidak mengembalikan teks insight.");

  return { provider: "gemini", model, text };
}

async function readError(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { error?: { message?: string } };
    return json.error?.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

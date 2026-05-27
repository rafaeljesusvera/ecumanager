import Anthropic from '@anthropic-ai/sdk';

export type AiMatchInput = {
  transcript: string;
  riders: Array<{ id: string; name: string }>;
  horses: Array<{ id: string; name: string }>;
  lessonContext?: string;
};

export type AiMatchItem = {
  riderId: string | null;
  riderName: string;
  horseId: string | null;
  horseName: string | null;
  feedback: string;
  suggestedBadge?: string;
  confidence: number;
};

export type AiMatchResult = {
  summary: string;
  items: AiMatchItem[];
  unmatched: string[];
  source: 'anthropic' | 'fallback';
};

/**
 * Llama a Claude con el contexto del club para mapear la nota de voz a
 * comentarios estructurados por alumno. Si no hay API key, usa un fallback
 * heurístico que reconoce nombres en la transcripción.
 */
export async function runAiMatch(input: AiMatchInput): Promise<AiMatchResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await callAnthropic(input);
    } catch (err) {
      console.error('[ai.match] anthropic falló, usando fallback', err);
    }
  }
  return runFallback(input);
}

// ----------------------------------------------------------------------------
// Anthropic (claude-haiku-4-5)
// ----------------------------------------------------------------------------

async function callAnthropic(input: AiMatchInput): Promise<AiMatchResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const ridersList = input.riders
    .map((r) => `- ${r.name} (id: ${r.id})`)
    .join('\n');
  const horsesList = input.horses
    .map((h) => `- ${h.name} (id: ${h.id})`)
    .join('\n');

  const system = `Eres un asistente para profesores de equitación. Recibirás:
1) La transcripción libre de un profesor tras una clase.
2) La lista de alumnos del club con su id.
3) La lista de caballos del club con su id.

Debes:
- Identificar qué alumno menciona en cada frase.
- Identificar qué caballo (si lo nombra).
- Producir un comentario constructivo en español, dirigido al alumno.
- Sugerir una insignia si el profesor habla de un logro claro.

Tolera variantes del nombre ("Lu", "Lucía", "Lucia"). Si no estás seguro de
quién es, marca rider_id como null y deja riderName con tu mejor candidato.

Responde EXCLUSIVAMENTE con JSON válido siguiendo este shape exacto:
{
  "summary": "string corta describiendo la clase",
  "items": [
    {
      "riderId": "uuid o null",
      "riderName": "string",
      "horseId": "uuid o null",
      "horseName": "string o null",
      "feedback": "string para mostrar al alumno",
      "suggestedBadge": "string o null",
      "confidence": 0.0
    }
  ],
  "unmatched": ["fragmento que no supiste asignar"]
}`;

  const userMessage = `# Alumnos del club
${ridersList || '(ninguno aún)'}

# Caballos del club
${horsesList || '(ninguno aún)'}

${input.lessonContext ? `# Contexto de la clase\n${input.lessonContext}\n` : ''}

# Transcripción
"""
${input.transcript}
"""`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => ('text' in b ? b.text : ''))
    .join('\n')
    .trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Respuesta IA sin JSON detectable');
  const parsed = JSON.parse(jsonMatch[0]) as Omit<AiMatchResult, 'source'>;

  return { ...parsed, source: 'anthropic' };
}

// ----------------------------------------------------------------------------
// Fallback (sin API key): heurística por nombre
// ----------------------------------------------------------------------------

function runFallback(input: AiMatchInput): AiMatchResult {
  const items: AiMatchItem[] = [];
  const unmatched: string[] = [];

  const sentences = input.transcript
    .split(/(?<=[\.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();

    const rider = input.riders.find((r) =>
      sentenceMentions(lower, r.name),
    );
    const horse = input.horses.find((h) =>
      sentenceMentions(lower, h.name),
    );

    if (rider) {
      items.push({
        riderId: rider.id,
        riderName: rider.name,
        horseId: horse?.id ?? null,
        horseName: horse?.name ?? null,
        feedback: sentence,
        confidence: 0.6,
      });
    } else {
      unmatched.push(sentence);
    }
  }

  return {
    summary: `Nota libre · ${sentences.length} fragmentos`,
    items,
    unmatched,
    source: 'fallback',
  };
}

function sentenceMentions(sentence: string, fullName: string): boolean {
  const norm = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const parts = norm.split(/\s+/).filter((p) => p.length > 2);
  return parts.some((p) =>
    sentence
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .includes(p),
  );
}

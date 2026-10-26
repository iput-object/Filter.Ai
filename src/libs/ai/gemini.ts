import type { Verdict } from '../../types/types';
import { GEMINI_CONFIG } from '../../configs/gemini';

export async function classifyWithGemini(apiKey: string, text: string): Promise<Verdict> {
  const url = `${GEMINI_CONFIG.endpoint}/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${GEMINI_CONFIG.systemPrompt}\n\nMessage: ${JSON.stringify(text)}` },
          ],
        },
      ],
      generationConfig: {
        temperature: GEMINI_CONFIG.temperature,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data: any = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini API');

  const parsed = JSON.parse(rawText);
  return {
    isSpam: Boolean(parsed.is_spam),
    category: String(parsed.category || (parsed.is_spam ? 'spam' : 'safe')),
  };
}

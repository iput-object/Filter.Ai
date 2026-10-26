import type { Bindings, Verdict } from '../types/types';
import { classifyWithJev } from './ai/jev';
import { classifyWithGemini } from './ai/gemini';

export type { Verdict };

export async function classify(env: Bindings, text: string): Promise<Verdict> {
  const provider = (env.AI_PROVIDER || 'both').toLowerCase();

  // 1. Direct Gemini mode
  if (provider === 'gemini') {
    if (!env.GEMINI_API_KEY) {
      throw new Error('AI_PROVIDER is set to "gemini" but GEMINI_API_KEY is not configured.');
    }
    return classifyWithGemini(env.GEMINI_API_KEY, text);
  }

  // 2. Direct Jev mode
  if (provider === 'jev') {
    return classifyWithJev(env, text);
  }

  // 3. 'both' mode (Try Jev first, fallback to Gemini if Jev fails)
  try {
    return await classifyWithJev(env, text);
  } catch (jevError: any) {
    const errorMsg = jevError instanceof Error ? jevError.message : String(jevError);
    console.warn(`Jev classification failed (${errorMsg}), falling back to Gemini...`);

    if (!env.GEMINI_API_KEY) {
      throw new Error(
        `Jev failed (${errorMsg}) and GEMINI_API_KEY is not configured for fallback. ` +
          `Please set GEMINI_API_KEY or configure AI Gateway credits for Jev.`,
      );
    }

    return classifyWithGemini(env.GEMINI_API_KEY, text);
  }
}

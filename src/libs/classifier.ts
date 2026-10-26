import type { Bindings } from '../types/types';
import { SPAM_QUESTIONS } from '../configs/jev';

const SPAM_THRESHOLD = 0.8;

export interface Verdict {
  isSpam: boolean;
  category: string;
  score: number;
}

export async function classify(env: Bindings, text: string): Promise<Verdict> {
  const res: any = await env.AI.run('typesafe/jev' as any, {
    state: text,
    questions: SPAM_QUESTIONS,
  } as any);

  const answers = res?.answers;
  if (!answers?.is_spam) {
    throw new Error(`Unexpected jev response: ${JSON.stringify(res)}`);
  }

  const score = Number(answers.is_spam.noul);
  return {
    isSpam: score >= SPAM_THRESHOLD,
    category: String(answers.category?.choice ?? 'unknown'),
    score,
  };
}

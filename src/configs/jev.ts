export const JEV_MODEL = 'typesafe/jev';

export const SPAM_QUESTIONS = {
  is_spam: {
    type: 'noul',
    instructions:
      'Is this message spam? Spam = unsolicited advertising, promotions, affiliate/referral links, ' +
      'crypto/forex/NFT promos, adult offers, phishing, scams, impersonation, deceptive links, ' +
      'requests for money, giveaways with suspicious links. ' +
      'Profanity, insults and hate speech alone are NOT spam.',
    criteria: {
      true: 'Advertising, scam, phishing or other unsolicited promotion',
      false: 'Anything else, including offensive language without promotion',
    },
  },
  category: {
    type: 'choice',
    instructions: 'Which kind of message is this?',
    criteria: {
      advertising: 'Promotions, affiliate/referral links, repeated marketing',
      crypto: 'Crypto, forex, NFT promos',
      scam: 'Scams, phishing, requests for money, suspicious giveaways',
      adult: 'Adult offers',
      impersonation: 'Impersonation or deceptive links',
      none: 'Normal conversation',
    },
  },
} as const;

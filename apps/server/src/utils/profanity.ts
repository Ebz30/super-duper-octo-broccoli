const PROFANITY_LISTS: Record<string, string[]> = {
  en: ['badword1', 'badword2'],
  tr: ['kotu1', 'kotu2'],
  ar: ['سيء1', 'سيء2'],
};

export function containsProfanity(text: string) {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ');

  for (const lang in PROFANITY_LISTS) {
    for (const word of PROFANITY_LISTS[lang]) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(normalized)) {
        return { detected: true, word, language: lang } as const;
      }
      const obfuscated = word
        .replace(/a/g, '[a@4]')
        .replace(/e/g, '[e3]')
        .replace(/i/g, '[i1!]')
        .replace(/o/g, '[o0]')
        .replace(/s/g, '[s5$]');
      const obfuscatedRegex = new RegExp(obfuscated, 'i');
      if (obfuscatedRegex.test(normalized)) {
        return { detected: true, word, language: lang } as const;
      }
    }
  }

  return { detected: false } as const;
}

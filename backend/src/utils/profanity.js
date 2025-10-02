// Multi-language profanity filter
// This is a basic implementation - in production, use a comprehensive library

const PROFANITY_LISTS = {
  en: [
    'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap', 'hell',
    'dick', 'cock', 'pussy', 'whore', 'slut', 'nigger', 'fag', 'retard'
    // Add more as needed
  ],
  tr: [
    'amk', 'orospu', 'piç', 'göt', 'sik', 'yarrak', 'kahpe', 'pezevenk'
    // Add more Turkish profanity
  ],
  ar: [
    // Add Arabic profanity
  ]
};

function containsProfanity(text) {
  if (!text) return { detected: false };
  
  const normalized = text.toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  for (const lang in PROFANITY_LISTS) {
    for (const word of PROFANITY_LISTS[lang]) {
      // Check exact word match with word boundaries
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(normalized)) {
        return { detected: true, word, language: lang };
      }
      
      // Check for leetspeak and common obfuscations
      const obfuscated = word
        .replace(/a/g, '[a@4]')
        .replace(/e/g, '[e3]')
        .replace(/i/g, '[i1!]')
        .replace(/o/g, '[o0]')
        .replace(/s/g, '[s5$]');
      const obfuscatedRegex = new RegExp(obfuscated, 'i');
      if (obfuscatedRegex.test(normalized)) {
        return { detected: true, word, language: lang };
      }
    }
  }
  
  return { detected: false };
}

function filterText(text) {
  const check = containsProfanity(text);
  if (check.detected) {
    // Replace profanity with asterisks
    const normalized = text.toLowerCase();
    return text.replace(new RegExp(check.word, 'gi'), '***');
  }
  return text;
}

module.exports = {
  containsProfanity,
  filterText
};

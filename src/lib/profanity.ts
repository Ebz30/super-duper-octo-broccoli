// Multi-language profanity filter for content moderation
// This is a basic implementation - in production, consider using a service like Perspective API

const PROFANITY_LISTS = {
  en: [
    // English profanity words (basic list - expand as needed)
    'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron', 'dumb',
    // Add more words as needed for content moderation
  ],
  tr: [
    // Turkish profanity words (basic list)
    'aptal', 'salak', 'ahmak',
    // Add more Turkish words as needed
  ],
  ar: [
    // Arabic profanity words (basic list)
    // Add Arabic words as needed
  ],
  // Add more languages as needed
}

export interface ProfanityCheckResult {
  detected: boolean
  word?: string
  language?: string
}

export function containsProfanity(text: string): ProfanityCheckResult {
  if (!text) return { detected: false }
  
  const normalized = text.toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
  
  for (const [lang, words] of Object.entries(PROFANITY_LISTS)) {
    for (const word of words) {
      // Check exact word match with word boundaries
      const regex = new RegExp(`\\b${word}\\b`, 'i')
      if (regex.test(normalized)) {
        return { detected: true, word, language: lang }
      }
      
      // Check for leetspeak and common obfuscations
      const obfuscated = word
        .replace(/a/g, '[a@4]')
        .replace(/e/g, '[e3]')
        .replace(/i/g, '[i1!]')
        .replace(/o/g, '[o0]')
        .replace(/s/g, '[s5$]')
      
      const obfuscatedRegex = new RegExp(obfuscated, 'i')
      if (obfuscatedRegex.test(normalized)) {
        return { detected: true, word, language: lang }
      }
    }
  }
  
  return { detected: false }
}

export function filterProfanity(text: string, replacement: string = '***'): string {
  let filtered = text
  
  for (const words of Object.values(PROFANITY_LISTS)) {
    for (const word of words) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      filtered = filtered.replace(regex, replacement)
    }
  }
  
  return filtered
}

export function validateContent(content: {
  title?: string
  description?: string
  notes?: string
}): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check title
  if (content.title) {
    const titleCheck = containsProfanity(content.title)
    if (titleCheck.detected) {
      errors.push(`Inappropriate content detected in title: "${titleCheck.word}"`)
    }
  }
  
  // Check description
  if (content.description) {
    const descCheck = containsProfanity(content.description)
    if (descCheck.detected) {
      warnings.push(`Potentially inappropriate content detected in description: "${descCheck.word}"`)
    }
  }
  
  // Check notes
  if (content.notes) {
    const notesCheck = containsProfanity(content.notes)
    if (notesCheck.detected) {
      warnings.push(`Potentially inappropriate content detected in notes: "${notesCheck.word}"`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
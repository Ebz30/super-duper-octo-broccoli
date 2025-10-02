// Content moderation utilities for MyBazaar

// Multi-language profanity lists
const PROFANITY_LISTS = {
  en: [
    'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron', 'loser',
    // Add more English profanity as needed
  ],
  tr: [
    'aptal', 'salak', 'gerizekalı', 'mal', 'beyinsiz',
    // Add Turkish profanity as needed
  ],
  ar: [
    'غبي', 'أحمق', 'مغفل',
    // Add Arabic profanity as needed
  ],
};

export interface ProfanityResult {
  detected: boolean;
  word?: string;
  language?: string;
}

// Check if text contains profanity
export function containsProfanity(text: string): ProfanityResult {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '') // Remove special chars
    .replace(/\s+/g, ' '); // Normalize spaces

  for (const lang in PROFANITY_LISTS) {
    for (const word of PROFANITY_LISTS[lang as keyof typeof PROFANITY_LISTS]) {
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

// Validate content for listings
export function validateListingContent(title: string, description: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check title
  if (title.length < 3) {
    errors.push('Title must be at least 3 characters long');
  }
  if (title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  const titleProfanity = containsProfanity(title);
  if (titleProfanity.detected) {
    errors.push('Title contains inappropriate content');
  }

  // Check description
  if (description.length < 20) {
    errors.push('Description must be at least 20 characters long');
  }
  if (description.length > 2000) {
    errors.push('Description must be less than 2000 characters');
  }
  const descProfanity = containsProfanity(description);
  if (descProfanity.detected) {
    errors.push('Description contains inappropriate content');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate message content
export function validateMessageContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (content.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (content.length > 1000) {
    return { valid: false, error: 'Message must be less than 1000 characters' };
  }

  const profanityCheck = containsProfanity(content);
  if (profanityCheck.detected) {
    return { valid: false, error: 'Message contains inappropriate content' };
  }

  return { valid: true };
}

// Issue warning to user
export async function issueWarning(
  userId: string,
  reason: string,
  supabaseAdmin: any
): Promise<number> {
  try {
    // Increment warning count
    const { data: user } = await supabaseAdmin
      .from('users')
      .update({
        warning_count: supabaseAdmin.rpc('increment_warning_count'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('warning_count')
      .single();

    const warningCount = user?.warning_count || 0;

    // Ban user if 3+ warnings
    if (warningCount >= 3) {
      await banUser(userId, reason, supabaseAdmin);
    }

    return warningCount;
  } catch (error) {
    console.error('Issue warning error:', error);
    return 0;
  }
}

// Ban user
export async function banUser(
  userId: string,
  reason: string,
  supabaseAdmin: any
): Promise<void> {
  try {
    await supabaseAdmin
      .from('users')
      .update({
        is_banned: true,
        ban_reason: reason,
        banned_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Deactivate all their listings
    await supabaseAdmin
      .from('items')
      .update({ is_available: false })
      .eq('seller_id', userId);
  } catch (error) {
    console.error('Ban user error:', error);
  }
}

// Validate image upload
export function validateImageUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Image must be JPEG, PNG, or WebP format' };
  }

  return { valid: true };
}

// Sanitize HTML content (for future use)
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
}

// Check for spam patterns
export function detectSpam(text: string): boolean {
  const spamPatterns = [
    /(.)\1{4,}/, // Repeated characters (aaaaa)
    /(https?:\/\/[^\s]+)/gi, // URLs
    /(www\.[^\s]+)/gi, // www links
    /(\b[A-Z]{2,}\b)/g, // Excessive caps
  ];

  return spamPatterns.some(pattern => pattern.test(text));
}
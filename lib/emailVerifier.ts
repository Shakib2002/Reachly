/**
 * Email verification utility.
 * Uses DNS MX record check + format validation.
 * Falls back gracefully if DNS is unavailable.
 */

const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'throwaway.email', 'mailinator.com', 'guerrillamail.com',
  'yopmail.com', 'sharklasers.com', 'trashmail.com', 'tempail.com',
  'fakeinbox.com', '10minutemail.com', 'temp-mail.org', 'discard.email',
]);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export type VerificationStatus = 'valid' | 'invalid' | 'risky' | 'unknown';

export interface VerificationResult {
  status: VerificationStatus;
  reason: string;
  email: string;
}

// In-memory cache (5-minute TTL)
const verificationCache = new Map<string, { result: VerificationResult; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function verifyEmail(email: string): Promise<VerificationResult> {
  const normalized = email.trim().toLowerCase();

  // Check cache
  const cached = verificationCache.get(normalized);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.result;
  }

  let result: VerificationResult;

  // Step 1: Format validation
  if (!EMAIL_REGEX.test(normalized)) {
    result = { status: 'invalid', reason: 'Invalid email format', email: normalized };
    verificationCache.set(normalized, { result, ts: Date.now() });
    return result;
  }

  const domain = normalized.split('@')[1];

  // Step 2: Check disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    result = { status: 'risky', reason: 'Disposable email domain detected', email: normalized };
    verificationCache.set(normalized, { result, ts: Date.now() });
    return result;
  }

  // Step 3: DNS MX record check via public DNS API
  try {
    const dnsRes = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
      signal: AbortSignal.timeout(5000),
    });
    const dnsData = await dnsRes.json();

    if (!dnsData.Answer || dnsData.Answer.length === 0) {
      result = { status: 'invalid', reason: 'Domain has no MX records — cannot receive email', email: normalized };
    } else {
      // Check for common catch-all patterns
      const mxRecords = dnsData.Answer.map((a: { data: string }) => a.data?.toLowerCase() || '');
      const hasValidMX = mxRecords.some((mx: string) =>
        mx.includes('google') || mx.includes('outlook') || mx.includes('zoho') ||
        mx.includes('protonmail') || mx.includes('icloud') || mx.includes('yahoo') ||
        mx.length > 0
      );

      if (hasValidMX) {
        result = { status: 'valid', reason: 'Email format valid, domain has MX records', email: normalized };
      } else {
        result = { status: 'risky', reason: 'Domain MX records exist but unrecognized provider', email: normalized };
      }
    }
  } catch {
    // DNS check failed — report as unknown rather than blocking
    result = { status: 'unknown', reason: 'Could not verify domain — DNS check timed out', email: normalized };
  }

  verificationCache.set(normalized, { result, ts: Date.now() });
  return result;
}

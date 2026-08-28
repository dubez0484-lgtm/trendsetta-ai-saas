/**
 * Comment-to-keyword matching engine. Pure functions, no I/O, so they can
 * be unit tested directly and reused by the webhook handler, manual
 * dashboard "test automation" action, and the MCP server.
 */
import type { Automation, MatchType } from '@prisma/client';

export interface MatchResult {
  matched: boolean;
  reason: string;
}

const MAX_COMMENT_LENGTH = 2200; // Instagram/Facebook comment length ceiling.
const MAX_REGEX_LENGTH = 200;

/** Collapses runs of whitespace and trims, for EXACT comparisons. */
function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Heuristic guard against catastrophic backtracking (ReDoS). Node has no
 * built-in interruptible regex execution, so this rejects the classic
 * nested-quantifier shapes (e.g. `(a+)+`, `(a*)*`, `(a|a)+`) and overly
 * long patterns before they ever reach RegExp. This is a mitigation, not a
 * guarantee — keep patterns simple.
 */
export function isPotentiallyCatastrophicRegex(pattern: string): boolean {
  if (pattern.length > MAX_REGEX_LENGTH) return true;

  // Nested quantifiers: a quantified group that itself contains a
  // quantified token, e.g. (x+)+, (x*)+, (x+)*, (x{2,})+.
  const nestedQuantifier = /\([^()]*[+*]\s*[^()]*\)[+*]|\([^()]*\{\d*,?\d*\}[^()]*\)[+*]/;
  if (nestedQuantifier.test(pattern)) return true;

  // Alternation with overlapping/duplicate branches under a quantifier,
  // e.g. (a|a)+ or (a|ab)*.
  const alternationUnderQuantifier = /\([^()]*\|[^()]*\)[+*]/;
  if (alternationUnderQuantifier.test(pattern)) return true;

  return false;
}

function matchContains(commentText: string, keyword: string): MatchResult {
  const haystack = commentText.toLowerCase();
  const needle = keyword.toLowerCase().trim();

  if (!needle) return { matched: false, reason: 'Keyword is empty.' };

  const matched = haystack.includes(needle);
  return {
    matched,
    reason: matched ? `Comment contains "${needle}" (case-insensitive).` : `Comment does not contain "${needle}".`,
  };
}

function matchExact(commentText: string, keyword: string): MatchResult {
  const normalizedComment = normalizeWhitespace(commentText).toLowerCase();
  const normalizedKeyword = normalizeWhitespace(keyword).toLowerCase();

  const matched = normalizedComment === normalizedKeyword;
  return {
    matched,
    reason: matched
      ? 'Comment matches keyword exactly (whitespace/case normalized).'
      : 'Comment does not exactly match keyword.',
  };
}

function matchRegex(commentText: string, pattern: string): MatchResult {
  if (isPotentiallyCatastrophicRegex(pattern)) {
    return { matched: false, reason: 'Regex rejected: pattern is too long or has a catastrophic-backtracking shape.' };
  }

  const truncatedComment = commentText.slice(0, MAX_COMMENT_LENGTH);

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, 'i');
  } catch (error) {
    return { matched: false, reason: `Malformed regex: ${error instanceof Error ? error.message : 'invalid pattern'}` };
  }

  try {
    const matched = regex.test(truncatedComment);
    return { matched, reason: matched ? `Comment matches regex /${pattern}/i.` : `Comment does not match regex /${pattern}/i.` };
  } catch (error) {
    return { matched: false, reason: `Regex execution failed: ${error instanceof Error ? error.message : 'unknown error'}` };
  }
}

/**
 * Evaluates whether a comment's text triggers a given automation, per its
 * configured matchType (CONTAINS | EXACT | REGEX).
 */
export function matchAutomation(
  commentText: string,
  automation: Pick<Automation, 'keyword' | 'matchType'>,
): MatchResult {
  if (typeof commentText !== 'string' || commentText.length === 0) {
    return { matched: false, reason: 'Comment text is empty.' };
  }

  const matchType: MatchType = automation.matchType;

  switch (matchType) {
    case 'CONTAINS':
      return matchContains(commentText, automation.keyword);
    case 'EXACT':
      return matchExact(commentText, automation.keyword);
    case 'REGEX':
      return matchRegex(commentText, automation.keyword);
    default:
      return { matched: false, reason: `Unknown match type: ${matchType satisfies never}` };
  }
}

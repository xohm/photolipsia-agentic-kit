const WORDS_PER_MINUTE = 200;

export function countWords(text) {
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return words ? words.length : 0;
}

export function countCharacters(text) {
  return text.trim().length;
}

export function countSentences(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const parts = trimmed.split(/[.!?]+/);
  let count = 0;
  for (const part of parts) {
    if (part.trim().length > 0) count += 1;
  }
  return count;
}

export function readingTime(words) {
  if (words === 0) return 0;
  const raw = words / WORDS_PER_MINUTE;
  return Math.max(Math.round(raw * 10) / 10, 0.1);
}

export function textStats(text) {
  const words = countWords(text);
  return {
    words,
    characters: countCharacters(text),
    sentences: countSentences(text),
    readingMinutes: readingTime(words),
  };
}

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\*/g, '')
    .replace(/\r/g, '');
}

function normalizeBullets(text) {
  return text
    .replace(/^\s*\d+\.\s+/gm, '- ')
    .replace(/^\s*[\*\u2022]\s+/gm, '- ')
    .replace(/^\s*-\s+\*\s*/gm, '- ');
}

function collapseWhitespace(text) {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function flattenToParagraph(text) {
  return text
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function limitBulletCount(text, maxBullets = 3) {
  const lines = text.split('\n');
  const result = [];
  let bulletCount = 0;

  for (const line of lines) {
    const isBullet = /^\s*-\s+/.test(line);
    if (!isBullet) {
      result.push(line);
      continue;
    }

    bulletCount += 1;
    if (bulletCount <= maxBullets) {
      result.push(line);
    }
  }

  return result.join('\n');
}

function shortenAnswer(text) {
  const normalized = collapseWhitespace(limitBulletCount(normalizeBullets(stripMarkdown(text))));
  const paragraphs = normalized.split('\n\n').filter(Boolean);
  const shortened = paragraphs.length <= 3
    ? normalized
    : paragraphs.slice(0, 3).join('\n\n').trim();

  return flattenToParagraph(shortened);
}

module.exports = {
  shortenAnswer
};

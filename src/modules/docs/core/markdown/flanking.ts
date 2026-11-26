const UNDERSCORE = '_';

export function canOpen(delimiter: string, before: string, after: string) {
  const left = isLeftFlanking(before, after);
  if (delimiter !== UNDERSCORE) return left;
  return left && (!isRightFlanking(before, after) || isPunctuation(before));
}

export function canClose(delimiter: string, before: string, after: string) {
  const right = isRightFlanking(before, after);
  if (delimiter !== UNDERSCORE) return right;
  return right && (!isLeftFlanking(before, after) || isPunctuation(after));
}

function isLeftFlanking(before: string, after: string) {
  return (
    !isSpace(after) &&
    (!isPunctuation(after) || isSpace(before) || isPunctuation(before))
  );
}

function isRightFlanking(before: string, after: string) {
  return (
    !isSpace(before) &&
    (!isPunctuation(before) || isSpace(after) || isPunctuation(after))
  );
}

function isSpace(char: string) {
  return /\s/u.test(char);
}

function isPunctuation(char: string) {
  return /[\p{P}\p{S}]/u.test(char);
}

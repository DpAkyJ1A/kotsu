import { LARGEST_DOC_BYTES } from './save-limits';
import type { SaveStatus } from './save-state';

const SHOWS_THE_FILL_FROM = 0.8;
const ALMOST_FULL_FROM = 0.9;
const BYTES_IN_A_KB = 1_000;

export type DocFill = 'roomy' | 'filling' | 'almostFull' | 'overfull';

export type SaveMark = 'saving' | 'saved' | 'problem';

export type SaveIndicator = {
  mark: SaveMark;
  fill: DocFill;
  showsTheFill: boolean;
  warnsTheDocIsAlmostFull: boolean;
};

export function saveIndicatorOf(
  status: SaveStatus,
  sizeBytes: number,
): SaveIndicator {
  const mark = markOf(status);
  const fill = docFillOf(sizeBytes);
  return {
    mark,
    fill,
    showsTheFill: fill !== 'roomy',
    warnsTheDocIsAlmostFull:
      mark !== 'problem' && (fill === 'almostFull' || fill === 'overfull'),
  };
}

export function docFillOf(sizeBytes: number): DocFill {
  if (sizeBytes > LARGEST_DOC_BYTES) return 'overfull';
  const share = sizeBytes / LARGEST_DOC_BYTES;
  if (share >= ALMOST_FULL_FROM) return 'almostFull';
  if (share >= SHOWS_THE_FILL_FROM) return 'filling';
  return 'roomy';
}

export function filledPercentOf(sizeBytes: number) {
  return Math.round(Math.min(sizeBytes / LARGEST_DOC_BYTES, 1) * 100);
}

export function shownSizeOf(sizeBytes: number) {
  if (sizeBytes <= LARGEST_DOC_BYTES) return sizeBytes;
  return Math.ceil(sizeBytes / BYTES_IN_A_KB) * BYTES_IN_A_KB;
}

function markOf(status: SaveStatus): SaveMark {
  if (status === 'saving' || status === 'saved') return status;
  return 'problem';
}

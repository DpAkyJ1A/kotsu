import type { Doc } from './doc';

export type SaveFailure =
  'CONFLICT' | 'OFFLINE' | 'TOO_LONG' | 'STORAGE_FULL' | 'FAILED';

type Conflict = 'asking' | 'postponed' | 'reloading' | 'keepingMine';

export type SaveState = {
  version: number;
  edits: number;
  savedEdits: number;
  sendingEdits: number | null;
  isDue: boolean;
  failure: SaveFailure | null;
  conflict: Conflict | null;
  sizeBytes: number;
  savedAt: number | null;
};

export type SaveStatus =
  'saved' | 'saving' | 'offline' | 'tooLong' | 'storageFull' | 'notSaved';

export function openedAt({
  version,
  sizeBytes,
}: Pick<Doc, 'version' | 'sizeBytes'>): SaveState {
  return {
    version,
    edits: 0,
    savedEdits: 0,
    sendingEdits: null,
    isDue: false,
    failure: null,
    conflict: null,
    sizeBytes,
    savedAt: null,
  };
}

export function statusOf(state: SaveState): SaveStatus {
  if (isWaitingForTheServerDoc(state)) return 'saving';
  if (state.failure === 'OFFLINE') return 'offline';
  if (state.failure === 'TOO_LONG') return 'tooLong';
  if (state.failure === 'STORAGE_FULL') return 'storageFull';
  if (state.failure !== null) return 'notSaved';
  return isSending(state) || hasUnsavedEdits(state) ? 'saving' : 'saved';
}

export function isIdle(state: SaveState) {
  return !isSending(state) && !hasUnsavedEdits(state) && state.failure === null;
}

export function hasUnsavedEdits(state: SaveState) {
  return state.edits > state.savedEdits;
}

export function hasEditsNotOnTheirWay(state: SaveState) {
  return state.edits > (state.sendingEdits ?? state.savedEdits);
}

export function isSending(state: SaveState) {
  return state.sendingEdits !== null;
}

export function isWaitingForTheServerDoc({ conflict }: SaveState) {
  return conflict === 'reloading' || conflict === 'keepingMine';
}

export function isWaitingForAChoice(state: SaveState) {
  return state.conflict === 'asking' || isWaitingForTheServerDoc(state);
}

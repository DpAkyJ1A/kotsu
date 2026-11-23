import type { Editor, EditorEvents, JSONContent } from '@tiptap/core';

import { byteLengthOf } from '../core/byte-length';
import type { Doc, DocSave } from '../core/doc';
import { LARGEST_DOC_BYTES, SAVE_AFTER_MS } from '../core/save-limits';
import {
  hasEditsNotOnTheirWay,
  hasUnsavedEdits,
  isIdle,
  isSending,
  isWaitingForAChoice,
  isWaitingForTheServerDoc,
  openedAt,
  type SaveFailure,
  type SaveState,
} from '../core/save-state';
import { isUserEdit } from '../core/user-edit';

export type SaveAnswer =
  { ok: true; version: number } | { ok: false; failure: SaveFailure };

export type SaveTransport = {
  send: (save: DocSave, how: { isLeaving: boolean }) => Promise<SaveAnswer>;
  canSendWhileLeaving: (save: DocSave) => boolean;
};

type ConflictChoice = 'later' | 'reload' | 'keepMine';

const TOO_LONG: SaveAnswer = { ok: false, failure: 'TOO_LONG' };

const RETRIED = new Set<SaveFailure>(['OFFLINE', 'STORAGE_FULL', 'FAILED']);

const CONFLICT_AFTER: Record<ConflictChoice, SaveState['conflict']> = {
  later: 'postponed',
  reload: 'reloading',
  keepMine: 'keepingMine',
};

type Body = {
  read: () => JSONContent;
  write: (content: Doc['content']) => void;
};

const NO_BODY: Body = {
  read: () => ({ type: 'doc' }),
  write: () => undefined,
};

export type SaveQueue = ReturnType<typeof createSaveQueue>;

export function createSaveQueue(doc: Doc, transport: SaveTransport) {
  let state = openedAt(doc);
  let body = NO_BODY;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();

  function update(change: Partial<SaveState>) {
    state = { ...state, ...change };
    for (const listener of listeners) listener();
  }

  function edited() {
    update({ edits: state.edits + 1 });
    clearTimeout(timer);
    timer = setTimeout(saveNow, SAVE_AFTER_MS);
  }

  function saveNow({ isLeaving = false } = {}) {
    clearTimeout(timer);
    if (isSending(state)) {
      if (hasEditsNotOnTheirWay(state)) update({ isDue: true });
      return;
    }
    if (!hasUnsavedEdits(state) || isWaitingForAChoice(state)) return;
    const edits = state.edits;
    const save = saveOfNow();
    const sizeBytes = byteLengthOf(JSON.stringify(save.content));
    update({ sendingEdits: edits, isDue: false, sizeBytes });
    if (sizeBytes > LARGEST_DOC_BYTES) {
      answered(edits, TOO_LONG);
      return;
    }
    void transport.send(save, { isLeaving }).then((answer) => {
      answered(edits, answer);
    });
  }

  function answered(edits: number, answer: SaveAnswer) {
    if (!answer.ok) {
      update({
        sendingEdits: null,
        isDue: false,
        failure: answer.failure,
        conflict: answer.failure === 'CONFLICT' ? 'asking' : null,
      });
      return;
    }
    update({
      version: answer.version,
      savedEdits: edits,
      sendingEdits: null,
      failure: null,
      conflict: null,
      savedAt: Date.now(),
    });
    if (state.isDue) saveNow();
  }

  function saveOfNow(): DocSave {
    return { id: doc.id, version: state.version, content: body.read() };
  }

  return {
    getState: () => state,

    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    connect(editor: Editor) {
      function handleUpdate({ transaction }: EditorEvents['update']) {
        if (isUserEdit(transaction)) edited();
      }
      body = {
        read: () => editor.getJSON(),
        write: (content) => {
          editor
            .chain()
            .setMeta('addToHistory', false)
            .setContent(content, { emitUpdate: false })
            .run();
        },
      };
      editor.on('update', handleUpdate);
      return () => {
        editor.off('update', handleUpdate);
        saveNow();
        const last = editor.getJSON();
        body = { ...NO_BODY, read: () => last };
      };
    },

    leave() {
      saveNow({ isLeaving: true });
    },

    retry() {
      if (state.failure !== null && RETRIED.has(state.failure)) saveNow();
    },

    choose(choice: ConflictChoice) {
      update({ conflict: CONFLICT_AFTER[choice] });
    },

    serverHas({ version, content, sizeBytes }: Doc) {
      if (version <= state.version) return;
      if (state.conflict === 'keepingMine') {
        update({ version, failure: null, conflict: null });
        saveNow();
        return;
      }
      if (state.conflict !== 'reloading' && !isIdle(state)) return;
      body.write(content);
      update({
        version,
        sizeBytes,
        savedEdits: state.edits,
        failure: null,
        conflict: null,
      });
    },

    wantsTheServerDoc: () => isIdle(state) || isWaitingForTheServerDoc(state),

    mustAskBeforeLeaving() {
      if (!hasEditsNotOnTheirWay(state)) return false;
      return (
        isSending(state) ||
        state.failure !== null ||
        !transport.canSendWhileLeaving(saveOfNow())
      );
    },
  };
}

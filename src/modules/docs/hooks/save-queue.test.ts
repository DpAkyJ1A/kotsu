import { Editor, type JSONContent } from '@tiptap/core';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { byteLengthOf } from '../core/byte-length';
import { DocKit } from '../core/doc-kit';
import { LARGEST_DOC_BYTES, SAVE_AFTER_MS } from '../core/save-limits';
import { statusOf } from '../core/save-state';
import {
  createSaveQueue,
  type SaveAnswer,
  type SaveTransport,
} from './save-queue';

const DOC_ID = '019a9c3e-0101-7000-8000-000000000101';
const BLOCK_ID = '0e5a8a34-6f0e-4f5c-9a46-0b1d3c2e9f01';

function bodyOf(line: string): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: { blockId: BLOCK_ID },
        content: line ? [{ type: 'text', text: line }] : [],
      },
    ],
  };
}

type Sent = {
  version: number;
  line: string;
  isLeaving: boolean;
  answer: (answer: SaveAnswer) => Promise<void>;
};

function fakeTransport() {
  const sent: Sent[] = [];
  const canLeave = { now: true };
  const transport: SaveTransport = {
    send: (save, { isLeaving }) => {
      const answered = Promise.withResolvers<SaveAnswer>();
      sent.push({
        version: save.version,
        line: textOf(save.content),
        isLeaving,
        answer: async (answer) => {
          answered.resolve(answer);
          await answered.promise;
          await Promise.resolve();
        },
      });
      return answered.promise;
    },
    canSendWhileLeaving: () => canLeave.now,
  };
  return { transport, sent, canLeave };
}

function textOf(content: JSONContent) {
  return content.content?.[0]?.content?.[0]?.text ?? '';
}

function serverDoc(line: string, version: number, sizeBytes = 0) {
  return { id: DOC_ID, content: bodyOf(line), version, sizeBytes };
}

function openDoc({ line = 'hablo', version = 1, sizeBytes = 0 } = {}) {
  const editor = new Editor({
    element: null,
    extensions: [DocKit],
    content: bodyOf(line),
  });
  const { transport, sent, canLeave } = fakeTransport();
  const queue = createSaveQueue(serverDoc(line, version, sizeBytes), transport);
  const disconnect = queue.connect(editor);
  return {
    editor,
    queue,
    sent,
    canLeave,
    disconnect,
    type(text: string) {
      editor.commands.insertContentAt(editor.state.doc.content.size - 1, {
        type: 'text',
        text,
      });
    },
    status: () => statusOf(queue.getState()),
  };
}

function bytesOfTheBody(editor: Editor) {
  return byteLengthOf(JSON.stringify(editor.getJSON()));
}

function openDocWithABodyOfBytes(bytes: number) {
  const probe = openDoc({ line: 'a' });
  const withoutTheLine = bytesOfTheBody(probe.editor) - 1;
  probe.disconnect();
  return openDoc({ line: 'a'.repeat(bytes - withoutTheLine) });
}

function waitTheQuiet() {
  vi.advanceTimersByTime(SAVE_AFTER_MS);
}

const SAVED = (version: number): SaveAnswer => ({ ok: true, version });
const CONFLICT: SaveAnswer = { ok: false, failure: 'CONFLICT' };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('saving after a pause', () => {
  test('sends the text 800 ms after the last edit, from the version the doc opened at, and not before', () => {
    const doc = openDoc({ version: 4 });

    doc.type(', hablas');
    vi.advanceTimersByTime(SAVE_AFTER_MS - 1);
    expect(doc.sent).toHaveLength(0);

    vi.advanceTimersByTime(1);
    expect(doc.sent).toMatchObject([
      { version: 4, line: 'hablo, hablas', isLeaving: false },
    ]);
  });

  test('starts the 800 ms again with every edit, so a long run of typing is one save', () => {
    const doc = openDoc();

    for (const letter of ', hablas') {
      doc.type(letter);
      vi.advanceTimersByTime(SAVE_AFTER_MS - 100);
    }
    expect(doc.sent).toHaveLength(0);

    vi.advanceTimersByTime(100);
    expect(doc.sent).toMatchObject([{ line: 'hablo, hablas' }]);
  });

  test('says Saving… from the first edit until the answer, and Saved after it', async () => {
    const doc = openDoc();
    expect(doc.status()).toBe('saved');

    doc.type('!');
    expect(doc.status()).toBe('saving');
    waitTheQuiet();
    expect(doc.status()).toBe('saving');

    await doc.sent[0]?.answer(SAVED(2));
    expect(doc.status()).toBe('saved');
  });

  test('sends nothing for a pause without edits', () => {
    const doc = openDoc();

    doc.editor.commands.setTextSelection(2);
    vi.advanceTimersByTime(SAVE_AFTER_MS * 3);

    expect(doc.sent).toHaveLength(0);
  });
});

describe('one save at a time', () => {
  test('keeps the edits made during a save for the next one, sent as soon as the answer comes, from the version it returned', async () => {
    const doc = openDoc();
    doc.type(', hablas');
    waitTheQuiet();

    doc.type(', habla');
    waitTheQuiet();
    expect(doc.sent).toHaveLength(1);

    await doc.sent[0]?.answer(SAVED(2));
    expect(doc.sent).toHaveLength(2);
    expect(doc.sent[1]).toMatchObject({
      version: 2,
      line: 'hablo, hablas, habla',
    });
    expect(doc.status()).toBe('saving');

    await doc.sent[1]?.answer(SAVED(3));
    expect(doc.status()).toBe('saved');
    expect(doc.queue.getState().version).toBe(3);
  });

  test('waits for the pause after the answer when the typing goes on', async () => {
    const doc = openDoc();
    doc.type(', hablas');
    waitTheQuiet();
    doc.type(', habla');

    await doc.sent[0]?.answer(SAVED(2));
    expect(doc.sent).toHaveLength(1);

    waitTheQuiet();
    expect(doc.sent).toHaveLength(2);
  });

  test('sends nothing more after an answer when nothing was typed during the save', async () => {
    const doc = openDoc();
    doc.type(', hablas');
    waitTheQuiet();

    await doc.sent[0]?.answer(SAVED(2));
    vi.advanceTimersByTime(SAVE_AFTER_MS * 3);

    expect(doc.sent).toHaveLength(1);
  });
});

describe('how long the doc is', () => {
  test('starts from the size the server has for the doc', () => {
    const doc = openDoc({ sizeBytes: 1200 });

    expect(doc.queue.getState().sizeBytes).toBe(1200);
  });

  test('measures the body as it sends it, as the server measures it, and sends a body as long as a doc may be', () => {
    const doc = openDocWithABodyOfBytes(LARGEST_DOC_BYTES - 1);

    doc.type('!');
    waitTheQuiet();

    expect(doc.queue.getState().sizeBytes).toBe(LARGEST_DOC_BYTES);
    expect(doc.sent).toHaveLength(1);
  });

  test('sends nothing longer than a doc may be and says the doc is full, then saves again once the doc is short enough', async () => {
    const doc = openDocWithABodyOfBytes(LARGEST_DOC_BYTES);

    doc.type('!');
    waitTheQuiet();
    expect(doc.sent).toHaveLength(0);
    expect(doc.status()).toBe('tooLong');
    expect(doc.queue.getState().sizeBytes).toBe(LARGEST_DOC_BYTES + 1);
    expect(doc.queue.mustAskBeforeLeaving()).toBe(true);

    const end = doc.editor.state.doc.content.size - 1;
    doc.editor.commands.deleteRange({ from: end - 2, to: end });
    waitTheQuiet();
    expect(doc.sent).toMatchObject([{ version: 1 }]);
    expect(doc.queue.getState().sizeBytes).toBe(LARGEST_DOC_BYTES - 1);

    await doc.sent[0]?.answer(SAVED(2));
    expect(doc.status()).toBe('saved');
  });

  test('takes the size of a newer version from the server along with its text, and not while it keeps its own', () => {
    const doc = openDoc({ sizeBytes: 100 });

    doc.queue.serverHas(serverDoc('como', 3, 140));
    expect(doc.queue.getState().sizeBytes).toBe(140);

    doc.type('!');
    doc.queue.serverHas(serverDoc('como', 4, 900));
    expect(doc.queue.getState().sizeBytes).toBe(140);
  });
});

describe('when the doc was saved', () => {
  test('is unknown until this tab saves it, set by a save, and kept through a failed one', async () => {
    vi.setSystemTime(new Date('2026-03-02T09:00:00Z'));
    const doc = openDoc();
    expect(doc.queue.getState().savedAt).toBeNull();

    doc.type(', hablas');
    waitTheQuiet();
    await doc.sent[0]?.answer(CONFLICT);
    expect(doc.queue.getState().savedAt).toBeNull();

    doc.queue.choose('later');
    doc.type('!');
    waitTheQuiet();
    await doc.sent[1]?.answer(SAVED(2));
    const savedAt = Date.now();
    expect(doc.queue.getState().savedAt).toBe(savedAt);

    vi.advanceTimersByTime(60_000);
    doc.type('!');
    waitTheQuiet();
    await doc.sent[2]?.answer({ ok: false, failure: 'OFFLINE' });
    expect(doc.queue.getState().savedAt).toBe(savedAt);
  });
});

describe('a conflict', () => {
  async function conflicted() {
    const doc = openDoc();
    doc.type(', hablas');
    waitTheQuiet();
    await doc.sent[0]?.answer(CONFLICT);
    return doc;
  }

  test('asks what to keep, says Not saved, and sends nothing while it asks', async () => {
    const doc = await conflicted();

    expect(doc.queue.getState().conflict).toBe('asking');
    expect(doc.status()).toBe('notSaved');
    doc.type('!');
    waitTheQuiet();
    expect(doc.sent).toHaveLength(1);
  });

  test('Keep mine saves the text on screen over the version on the server, once that version arrives', async () => {
    const doc = await conflicted();

    doc.queue.choose('keepMine');
    expect(doc.status()).toBe('saving');
    doc.type('!');
    waitTheQuiet();
    expect(doc.sent).toHaveLength(1);

    doc.queue.serverHas(serverDoc('como', 5));
    expect(doc.sent[1]).toMatchObject({ version: 5, line: 'hablo, hablas!' });
    expect(doc.editor.getText()).toBe('hablo, hablas!');

    await doc.sent[1]?.answer(SAVED(6));
    expect(doc.status()).toBe('saved');
  });

  test('Reload puts the version on the server in the editor and counts it as saved, without sending it back', async () => {
    const doc = await conflicted();

    doc.queue.choose('reload');
    doc.queue.serverHas(serverDoc('como', 5));

    expect(doc.editor.getText()).toBe('como');
    expect(doc.status()).toBe('saved');
    expect(doc.queue.getState().version).toBe(5);
    vi.advanceTimersByTime(SAVE_AFTER_MS * 3);
    expect(doc.sent).toHaveLength(1);
  });

  test('put off, it saves again with the next edit and asks again if the doc is still newer elsewhere', async () => {
    const doc = await conflicted();

    doc.queue.choose('later');
    expect(doc.status()).toBe('notSaved');
    vi.advanceTimersByTime(SAVE_AFTER_MS * 3);
    expect(doc.sent).toHaveLength(1);

    doc.type('!');
    waitTheQuiet();
    expect(doc.sent[1]).toMatchObject({ version: 1 });
    await doc.sent[1]?.answer(CONFLICT);
    expect(doc.queue.getState().conflict).toBe('asking');
  });
});

describe('a newer version from the server', () => {
  test('replaces the text when nothing is unsaved, and the change is not an edit to save', () => {
    const doc = openDoc();

    doc.queue.serverHas(serverDoc('como', 3));

    expect(doc.editor.getText()).toBe('como');
    expect(doc.queue.getState().version).toBe(3);
    expect(doc.status()).toBe('saved');
    vi.advanceTimersByTime(SAVE_AFTER_MS * 3);
    expect(doc.sent).toHaveLength(0);
  });

  test('is not taken while there are unsaved edits, so the next save finds the conflict', () => {
    const doc = openDoc();
    doc.type(', hablas');

    doc.queue.serverHas(serverDoc('como', 3));

    expect(doc.editor.getText()).toBe('hablo, hablas');
    waitTheQuiet();
    expect(doc.sent).toMatchObject([{ version: 1 }]);
  });

  test('is not taken while a save is on its way', () => {
    const doc = openDoc();
    doc.type(', hablas');
    waitTheQuiet();

    doc.queue.serverHas(serverDoc('como', 3));

    expect(doc.editor.getText()).toBe('hablo, hablas');
  });

  test('changes nothing when it is the version this tab already has, or older', async () => {
    const doc = openDoc();
    doc.type(', hablas');
    waitTheQuiet();
    await doc.sent[0]?.answer(SAVED(2));

    doc.queue.serverHas(serverDoc('hablo', 2));
    doc.queue.serverHas(serverDoc('hablo', 1));

    expect(doc.editor.getText()).toBe('hablo, hablas');
  });

  test('is wanted only when nothing is unsaved, or after Reload or Keep mine', async () => {
    const doc = openDoc();
    expect(doc.queue.wantsTheServerDoc()).toBe(true);

    doc.type(', hablas');
    expect(doc.queue.wantsTheServerDoc()).toBe(false);
    waitTheQuiet();
    await doc.sent[0]?.answer(CONFLICT);
    expect(doc.queue.wantsTheServerDoc()).toBe(false);

    doc.queue.choose('reload');
    expect(doc.queue.wantsTheServerDoc()).toBe(true);
  });
});

describe('leaving', () => {
  test('sends what waits for the pause at once, as a save that can outlive the page', () => {
    const doc = openDoc();
    doc.type(', hablas');

    doc.queue.leave();

    expect(doc.sent).toMatchObject([
      { line: 'hablo, hablas', isLeaving: true },
    ]);
    vi.advanceTimersByTime(SAVE_AFTER_MS * 3);
    expect(doc.sent).toHaveLength(1);
  });

  test('sends nothing when nothing waits', () => {
    const doc = openDoc();

    doc.queue.leave();

    expect(doc.sent).toHaveLength(0);
  });

  test('keeps one save at a time while a save is on its way: what waits goes after the answer', async () => {
    const doc = openDoc();
    doc.type(', hablas');
    waitTheQuiet();
    doc.type(', habla');

    doc.queue.leave();
    expect(doc.sent).toHaveLength(1);

    await doc.sent[0]?.answer(SAVED(2));
    expect(doc.sent[1]).toMatchObject({
      version: 2,
      line: 'hablo, hablas, habla',
    });
  });

  test('closing the doc in the app sends what waits at once, and the save after it still has the text from when it closed', async () => {
    const doc = openDoc();
    doc.type(', hablas');
    waitTheQuiet();
    doc.type(', habla');

    doc.disconnect();
    doc.editor.commands.setContent(bodyOf('otro doc'));
    expect(doc.sent).toHaveLength(1);

    await doc.sent[0]?.answer(SAVED(2));
    expect(doc.sent[1]).toMatchObject({
      line: 'hablo, hablas, habla',
      isLeaving: false,
    });
  });

  test('closing the doc stops counting the editor’s changes as edits', () => {
    const doc = openDoc();

    doc.disconnect();
    doc.type('!');
    vi.advanceTimersByTime(SAVE_AFTER_MS * 3);

    expect(doc.sent).toHaveLength(0);
  });
});

describe('asking before the page goes away', () => {
  test('does not ask with nothing unsaved, or with edits the last save can still carry out', () => {
    const doc = openDoc();
    expect(doc.queue.mustAskBeforeLeaving()).toBe(false);

    doc.type('!');
    expect(doc.queue.mustAskBeforeLeaving()).toBe(false);
  });

  test('does not ask while a save is on its way with nothing typed after it', () => {
    const doc = openDoc();
    doc.type('!');
    waitTheQuiet();

    expect(doc.queue.mustAskBeforeLeaving()).toBe(false);
  });

  test('asks when the edits could not go out as the page closes: offline, or too long for it', () => {
    const doc = openDoc();
    doc.type('!');

    doc.canLeave.now = false;

    expect(doc.queue.mustAskBeforeLeaving()).toBe(true);
  });

  test('asks when the last save failed or met a conflict', async () => {
    for (const failure of [
      'FAILED',
      'OFFLINE',
      'TOO_LONG',
      'CONFLICT',
    ] as const) {
      const doc = openDoc();
      doc.type('!');
      waitTheQuiet();
      await doc.sent[0]?.answer({ ok: false, failure });

      expect(doc.queue.mustAskBeforeLeaving()).toBe(true);
    }
  });

  test('asks when edits were made after the save on its way, since they would have to wait for its answer', () => {
    const doc = openDoc();
    doc.type('!');
    waitTheQuiet();
    doc.type('!');

    expect(doc.queue.mustAskBeforeLeaving()).toBe(true);
  });
});

describe('after a failed save', () => {
  test('sends again on retry when it failed offline, on the server or for a full storage that may have room again', async () => {
    for (const failure of ['OFFLINE', 'FAILED', 'STORAGE_FULL'] as const) {
      const doc = openDoc();
      doc.type('!');
      waitTheQuiet();
      await doc.sent[0]?.answer({ ok: false, failure });

      doc.queue.retry();

      expect(doc.sent).toHaveLength(2);
    }
  });

  test('does not send again on retry for a body too long to save or a conflict, only after an edit', async () => {
    for (const failure of ['TOO_LONG', 'CONFLICT'] as const) {
      const doc = openDoc();
      doc.type('!');
      waitTheQuiet();
      await doc.sent[0]?.answer({ ok: false, failure });

      doc.queue.retry();

      expect(doc.sent).toHaveLength(1);
    }
  });

  test('says what failed until a save goes through', async () => {
    const doc = openDoc();
    doc.type('!');
    waitTheQuiet();
    await doc.sent[0]?.answer({ ok: false, failure: 'OFFLINE' });
    expect(doc.status()).toBe('offline');

    doc.queue.retry();
    expect(doc.status()).toBe('offline');
    await doc.sent[1]?.answer(SAVED(2));
    expect(doc.status()).toBe('saved');
  });
});

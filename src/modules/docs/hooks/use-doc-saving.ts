import type { Editor } from '@tiptap/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import type { Doc } from '../core/doc';
import { statusOf } from '../core/save-state';
import { createSaveQueue, type SaveQueue } from './save-queue';
import { saveTransport } from './send-save';

type Router = ReturnType<typeof useRouter>;

export function useDocSaving(editor: Editor | null, doc: Doc) {
  const router = useRouter();
  const [queue] = useState(() => createSaveQueue(doc, saveTransport));
  const status = useSyncExternalStore(
    queue.subscribe,
    () => statusOf(queue.getState()),
    () => statusOf(queue.getState()),
  );
  const sizeBytes = useSyncExternalStore(
    queue.subscribe,
    () => queue.getState().sizeBytes,
    () => queue.getState().sizeBytes,
  );
  const savedAt = useSyncExternalStore(
    queue.subscribe,
    () => queue.getState().savedAt,
    () => null,
  );
  const isAskingAboutAConflict = useSyncExternalStore(
    queue.subscribe,
    () => queue.getState().conflict === 'asking',
    () => false,
  );

  useEffect(
    () => (editor ? queue.connect(editor) : undefined),
    [queue, editor],
  );

  useEffect(() => {
    queue.serverHas(doc);
  }, [queue, doc]);

  useEffect(() => followThePage(queue, router), [queue, router]);

  function choose(choice: 'reload' | 'keepMine') {
    queue.choose(choice);
    router.refresh();
  }

  return {
    status,
    sizeBytes,
    savedAt,
    isAskingAboutAConflict,
    reload: () => {
      choose('reload');
    },
    keepMine: () => {
      choose('keepMine');
    },
    decideLater: () => {
      queue.choose('later');
    },
  };
}

function followThePage(queue: SaveQueue, router: Router) {
  function leave() {
    queue.leave();
  }

  function catchUp() {
    queue.retry();
    if (queue.wantsTheServerDoc()) router.refresh();
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') leave();
    else catchUp();
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (queue.mustAskBeforeLeaving()) event.preventDefault();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', leave);
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('online', catchUp);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', leave);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('online', catchUp);
  };
}

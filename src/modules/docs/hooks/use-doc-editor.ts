import { isNodeEmpty } from '@tiptap/core';
import { Placeholder } from '@tiptap/extensions';
import { Selection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { useEditor } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import type { Doc } from '../core/doc';
import { DocKit } from '../core/doc-kit';

const TOUCH_SCREEN = '(pointer: coarse)';
const ROOM_AROUND_THE_CARET_PX = { top: 5, right: 5, bottom: 96, left: 5 };

type Words = { placeholder: string; emptyChecklistItem: string };

export function useDocEditor(content: Doc['content']) {
  const t = useTranslations('docs');
  const placeholder = t('placeholder');
  const emptyChecklistItem = t('emptyChecklistItem');
  const [words] = useState(() => cellOf({ placeholder, emptyChecklistItem }));

  const editor = useEditor({
    extensions: [
      DocKit.configure({
        checklistItemLabel: (item) =>
          item.textContent || words.get().emptyChecklistItem,
      }),
      Placeholder.configure({ placeholder: () => words.get().placeholder }),
    ],
    content,
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      if (content === null && !matchMedia(TOUCH_SCREEN).matches) {
        editor.commands.focus('start');
      }
    },
    editorProps: {
      attributes: (state) => ({
        'aria-label': t('body'),
        'aria-multiline': 'true',
        ...(isNodeEmpty(state.doc) && { 'aria-placeholder': placeholder }),
      }),
      scrollThreshold: ROOM_AROUND_THE_CARET_PX,
      scrollMargin: ROOM_AROUND_THE_CARET_PX,
      handleClick: (view, _position, event) => {
        if (!isUnderTheText(view, event)) return false;
        view.dispatch(
          view.state.tr.setSelection(Selection.atEnd(view.state.doc)),
        );
        view.focus();
        return true;
      },
    },
  });

  useEffect(() => {
    const next = { placeholder, emptyChecklistItem };
    if (isSame(words.get(), next)) return;
    words.set(next);
    editor?.createNodeViews();
  }, [editor, words, placeholder, emptyChecklistItem]);

  return editor;
}

function cellOf(value: Words) {
  let current = value;
  return {
    get: () => current,
    set: (next: Words) => {
      current = next;
    },
  };
}

function isSame(shown: Words, next: Words) {
  return (
    shown.placeholder === next.placeholder &&
    shown.emptyChecklistItem === next.emptyChecklistItem
  );
}

function isUnderTheText(view: EditorView, { clientY }: MouseEvent) {
  const lastBlock = view.dom.lastElementChild;
  return (
    lastBlock !== null && clientY > lastBlock.getBoundingClientRect().bottom
  );
}

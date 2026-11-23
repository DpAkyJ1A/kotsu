import { type Editor, isNodeEmpty } from '@tiptap/core';
import { Placeholder } from '@tiptap/extensions';
import type { Node } from '@tiptap/pm/model';
import { Selection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { useEditor } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { TOUCH_SCREEN, useMediaQuery, WIDE_SCREEN } from '@/ui/use-media-query';

import type { Doc } from '../core/doc';
import { DocKit } from '../core/doc-kit';
import { SlashMenu } from '../ui/slash-menu';

export const ROOM_UNDER_THE_DOC_BAR_PX = 112;
const ROOM_AROUND_THE_CARET_PX = { top: 64, right: 5, bottom: 96, left: 5 };
const ROOM_AROUND_THE_CARET_UNDER_THE_DOC_BAR_PX = {
  ...ROOM_AROUND_THE_CARET_PX,
  top: ROOM_UNDER_THE_DOC_BAR_PX,
};
const SHOWS_HINT = 'shows-hint';

type Words = {
  placeholder: string;
  emptyLineHint: string;
  emptyChecklistItem: string;
};

export function useDocEditor(content: Doc['content']) {
  const t = useTranslations('docs');
  const placeholder = t('placeholder');
  const emptyLineHint = t('emptyLineHint');
  const emptyChecklistItem = t('emptyChecklistItem');
  const [words] = useState(() =>
    cellOf({ placeholder, emptyLineHint, emptyChecklistItem }),
  );
  const [translations] = useState(() => cellOf(t));
  const roomAroundTheCaret = useMediaQuery(WIDE_SCREEN)
    ? ROOM_AROUND_THE_CARET_UNDER_THE_DOC_BAR_PX
    : ROOM_AROUND_THE_CARET_PX;

  const editor = useEditor({
    extensions: [
      DocKit.configure({
        checklistItemLabel: (item) =>
          item.textContent || words.get().emptyChecklistItem,
      }),
      Placeholder.configure({
        emptyNodeClass: ({ editor, node }) =>
          showsAHint(editor, node) ? SHOWS_HINT : '',
        placeholder: ({ editor }) =>
          editor.isEmpty ? words.get().placeholder : words.get().emptyLineHint,
      }),
      SlashMenu.configure({
        labelOf: (block) => translations.get()(`slashMenu.${block}.label`),
      }),
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
      scrollThreshold: roomAroundTheCaret,
      scrollMargin: roomAroundTheCaret,
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
    const next = { placeholder, emptyLineHint, emptyChecklistItem };
    if (isSame(words.get(), next)) return;
    words.set(next);
    editor?.createNodeViews();
  }, [editor, words, placeholder, emptyLineHint, emptyChecklistItem]);

  useEffect(() => {
    translations.set(t);
  }, [translations, t]);

  return editor;
}

function cellOf<Value>(value: Value) {
  let current = value;
  return {
    get: () => current,
    set: (next: Value) => {
      current = next;
    },
  };
}

function showsAHint(editor: Editor, line: Node) {
  return (
    editor.isEmpty ||
    (editor.isFocused &&
      editor.state.selection.empty &&
      line.type.name === 'paragraph')
  );
}

function isSame(shown: Words, next: Words) {
  return (
    shown.placeholder === next.placeholder &&
    shown.emptyLineHint === next.emptyLineHint &&
    shown.emptyChecklistItem === next.emptyChecklistItem
  );
}

function isUnderTheText(view: EditorView, { clientY }: MouseEvent) {
  const lastBlock = view.dom.lastElementChild;
  return (
    lastBlock !== null && clientY > lastBlock.getBoundingClientRect().bottom
  );
}

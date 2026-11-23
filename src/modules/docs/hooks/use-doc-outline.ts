import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';

import { outlineOf } from '../core/outline';

export function useDocOutline(editor: Editor | null) {
  const doc = useEditorState({
    editor,
    selector: (snapshot) => snapshot.editor?.state.doc ?? null,
    equalityFn: Object.is,
  });
  return doc ? outlineOf(doc) : [];
}

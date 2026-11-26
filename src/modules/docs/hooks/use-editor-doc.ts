import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';

export function useEditorDoc(editor: Editor | null) {
  return useEditorState({
    editor,
    selector: (snapshot) => snapshot.editor?.state.doc ?? null,
    equalityFn: Object.is,
  });
}

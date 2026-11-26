import type { Editor } from '@tiptap/core';

import { outlineOf } from '../core/outline';
import { useEditorDoc } from './use-editor-doc';

export function useDocOutline(editor: Editor | null) {
  const doc = useEditorDoc(editor);
  return doc ? outlineOf(doc) : [];
}

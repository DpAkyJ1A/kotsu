import { UniqueID } from '@tiptap/extension-unique-id';
import { Fragment, type Node, Slice } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

export const BLOCK_ID = 'blockId';

export const BlockIds = UniqueID.extend({
  addProseMirrorPlugins() {
    return (this.parent?.() ?? []).map(
      ({ spec }) =>
        new Plugin({
          ...spec,
          props: {
            ...spec.props,
            transformPasted: (slice, view) =>
              isMovedWithin(view)
                ? slice
                : withoutIdsTakenIn(view.state.doc, slice),
          },
        }),
    );
  },
});

export function withoutIdsTakenIn(doc: Node, slice: Slice) {
  const taken = idsIn(doc);
  return new Slice(
    withoutTaken(slice.content, taken),
    slice.openStart,
    slice.openEnd,
  );
}

function isMovedWithin(view: EditorView) {
  return view.dragging?.move === true;
}

function idsIn(doc: Node) {
  const ids = new Set<unknown>();
  doc.descendants(({ attrs }) => {
    if (attrs[BLOCK_ID]) ids.add(attrs[BLOCK_ID]);
  });
  return ids;
}

function withoutTaken(content: Fragment, taken: Set<unknown>): Fragment {
  const nodes: Node[] = [];
  content.forEach((node) => {
    if (node.isText) {
      nodes.push(node);
      return;
    }
    const isTaken = taken.has(node.attrs[BLOCK_ID]);
    nodes.push(
      node.type.create(
        isTaken ? { ...node.attrs, [BLOCK_ID]: null } : node.attrs,
        withoutTaken(node.content, taken),
        node.marks,
      ),
    );
  });
  return Fragment.from(nodes);
}

import type { Node } from '@tiptap/pm/model';
import {
  type EditorState,
  Plugin,
  PluginKey,
  type Transaction,
} from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

type OpenCards = {
  open: DecorationSet;
  shown: DecorationSet;
};

const OPEN_CARDS = new PluginKey<OpenCards>('openCards');

const OPEN = { isOpenCard: true };

export function openCards(card: string) {
  return new Plugin<OpenCards>({
    key: OPEN_CARDS,
    state: {
      init: (_, { doc }) => ({
        open: DecorationSet.empty,
        shown: withHiddenAnswers(doc, card, DecorationSet.empty),
      }),
      apply: (tr, previous) => {
        const toggled: unknown = tr.getMeta(OPEN_CARDS);
        if (!tr.docChanged && typeof toggled !== 'number') return previous;
        const mapped = previous.open.map(tr.mapping, tr.doc);
        const open =
          typeof toggled === 'number'
            ? withCardToggled(mapped, tr.doc, toggled)
            : mapped;
        return { open, shown: withHiddenAnswers(tr.doc, card, open) };
      },
    },
    props: {
      decorations: (state) => OPEN_CARDS.getState(state)?.shown,
    },
  });
}

export function isCardOpen(state: EditorState, cardPosition: number) {
  const open = OPEN_CARDS.getState(state)?.open;
  return open !== undefined && openAt(open, cardPosition).length > 0;
}

export function toggleCard(tr: Transaction, cardPosition: number) {
  return tr.setMeta(OPEN_CARDS, cardPosition).setMeta('addToHistory', false);
}

export function isOpenIn(decorations: readonly Decoration[]) {
  return decorations.some(({ spec }) => spec === OPEN);
}

function withCardToggled(open: DecorationSet, doc: Node, position: number) {
  const card = doc.nodeAt(position);
  if (!card) return open;
  const opened = openAt(open, position);
  return opened.length > 0
    ? open.remove(opened)
    : open.add(doc, [
        Decoration.node(position, position + card.nodeSize, {}, OPEN),
      ]);
}

function openAt(open: DecorationSet, position: number) {
  return open
    .find(position, position, (spec) => spec === OPEN)
    .filter(({ from }) => from === position);
}

function withHiddenAnswers(doc: Node, card: string, open: DecorationSet) {
  const hidden: Decoration[] = [];
  doc.descendants((node, position) => {
    if (node.type.name !== card) return !node.isTextblock;
    if (openAt(open, position).length === 0) {
      const answer = position + 1 + node.child(0).nodeSize;
      hidden.push(
        Decoration.node(answer, answer + node.child(1).nodeSize, {
          hidden: '',
        }),
      );
    }
    return true;
  });
  return open.add(doc, hidden);
}

import { flip, type MiddlewareState, shift, size } from '@floating-ui/dom';
import { Extension, type Range } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import {
  exitSuggestion,
  Suggestion,
  type SuggestionOptions,
  type SuggestionProps,
} from '@tiptap/suggestion';

import { blocksAt } from '../core/blocks-at';
import { insertBlock } from '../core/insert-block';
import { isSlashMenuOpen, type SlashBlock } from '../core/slash-blocks';
import {
  SlashMenuList,
  type SlashMenuListHandle,
  type SlashMenuListProps,
} from './slash-menu-list';

const SLASH = '/';
const GAP_TO_THE_CARET_PX = 6;
const GAP_TO_THE_SCREEN_EDGE_PX = 8;

type SlashMenuRenderer = ReturnType<
  NonNullable<SuggestionOptions<SlashBlock, SlashBlock>['render']>
>;

type SlashMenuOptions = {
  labelOf: (block: SlashBlock) => string;
};

export const SlashMenu = Extension.create<SlashMenuOptions>({
  name: 'slashMenu',

  addProseMirrorPlugins() {
    const { labelOf } = this.options;
    return [
      Suggestion<SlashBlock, SlashBlock>({
        editor: this.editor,
        char: SLASH,
        allowSpaces: true,
        allow: ({ state, range, isActive }) =>
          !isInCode(state, range) &&
          isSlashMenuOpen({
            query: queryIn(state, range),
            wasOpen: isActive ?? false,
            labelOf,
            available: blocksAt(state.doc.resolve(range.from)),
          }),
        command: ({ editor, range, props }) => {
          insertBlock(editor, range, props);
        },
        offset: { mainAxis: GAP_TO_THE_CARET_PX },
        flip: false,
        floatingUi: {
          middleware: [
            flip({ padding: GAP_TO_THE_SCREEN_EDGE_PX }),
            shift({ padding: GAP_TO_THE_SCREEN_EDGE_PX }),
            size({ padding: GAP_TO_THE_SCREEN_EDGE_PX, apply: passHeightLeft }),
          ],
        },
        render: renderSlashMenu,
      }),
    ];
  },
});

function isInCode(state: EditorState, { from }: Range) {
  const inCodeBlock = state.doc.resolve(from).parent.type.spec.code === true;
  const marks = state.doc.nodeAt(from)?.marks ?? [];
  return inCodeBlock || marks.some(({ type }) => type.spec.code === true);
}

function queryIn(state: EditorState, { from, to }: Range) {
  return state.doc.textBetween(from + SLASH.length, to);
}

function passHeightLeft({
  availableHeight,
  elements,
  rects,
}: MiddlewareState & { availableHeight: number }) {
  if (rects.floating.height === 0) return;
  elements.floating.style.setProperty(
    '--available-height',
    `${String(availableHeight)}px`,
  );
}

function renderSlashMenu(): SlashMenuRenderer {
  let menu: ReactRenderer<SlashMenuListHandle, SlashMenuListProps> | null =
    null;
  let unmount: (() => void) | null = null;

  return {
    onStart: (props) => {
      menu = new ReactRenderer(SlashMenuList, {
        editor: props.editor,
        props: listPropsOf(props),
        className: 'z-50',
      });
      menu.element.addEventListener('mousedown', keepTheFocusInTheEditor);
      unmount = props.mount(menu.element);
    },
    onUpdate: (props) => menu?.updateProps(listPropsOf(props)),
    onKeyDown: ({ event, view }) => {
      if (event.key === 'Tab') {
        exitSuggestion(view);
        return false;
      }
      return menu?.ref?.onKeyDown(event) ?? false;
    },
    onExit: () => {
      unmount?.();
      menu?.destroy();
      unmount = null;
      menu = null;
    },
  };
}

function keepTheFocusInTheEditor(event: MouseEvent) {
  event.preventDefault();
}

function listPropsOf({
  query,
  range,
  editor,
  command,
}: SuggestionProps<SlashBlock, SlashBlock>): SlashMenuListProps {
  return {
    query,
    available: blocksAt(editor.state.doc.resolve(range.from)),
    editorElement: editor.view.dom,
    onPick: command,
  };
}

import { type Attribute, Extension } from '@tiptap/core';
import {
  BackgroundColor,
  Color,
  TextStyle,
} from '@tiptap/extension-text-style';

import { type Colouring, colourText } from './apply-colour';
import { type Colour, INK, isColour, MARKER } from './colours';
import { SHORTCUTS } from './formats';
import { FIRST_LAST_COLOUR } from './last-colour';

const TEXT_DATA = 'data-color';
const BACKGROUND_DATA = 'data-bg';

type TextColourOptions = {
  lastColour: () => Colouring;
};

export const TextColour = Extension.create<TextColourOptions>({
  name: 'textColour',

  addOptions() {
    return { lastColour: () => FIRST_LAST_COLOUR };
  },

  addExtensions() {
    return [
      TextStyle.extend({
        parseHTML: () => [
          {
            tag: 'span',
            consuming: false,
            getAttrs: (element) => (hasOurColour(element) ? null : false),
          },
        ],
      }),
      Color.extend({
        addGlobalAttributes: () => [
          {
            types: ['textStyle'],
            attributes: {
              color: colourAttribute({
                name: 'color',
                data: TEXT_DATA,
                classes: INK,
              }),
            },
          },
        ],
      }),
      BackgroundColor.extend({
        addGlobalAttributes: () => [
          {
            types: ['textStyle'],
            attributes: {
              backgroundColor: colourAttribute({
                name: 'backgroundColor',
                data: BACKGROUND_DATA,
                classes: MARKER,
              }),
            },
          },
        ],
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      [SHORTCUTS.lastColour.keys]: () =>
        this.editor.commands.command(({ commands }) =>
          colourText(commands, this.options.lastColour()),
        ),
    };
  },
});

function hasOurColour(element: HTMLElement) {
  return (
    isColour(element.getAttribute(TEXT_DATA)) ||
    isColour(element.getAttribute(BACKGROUND_DATA))
  );
}

type ColourAttribute = {
  name: string;
  data: string;
  classes: Record<Colour, string>;
};

function colourAttribute({ name, data, classes }: ColourAttribute): Attribute {
  return {
    default: null,
    parseHTML: (element) => {
      const colour = element.getAttribute(data);
      return isColour(colour) ? colour : null;
    },
    renderHTML: (attributes) => {
      const colour: unknown = attributes[name];
      return isColour(colour) ? { [data]: colour, class: classes[colour] } : {};
    },
  };
}

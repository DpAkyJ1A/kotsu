import { CommandManager, type Editor, type SingleCommands } from '@tiptap/core';

import { type Colour, type ColourRow, COLOURS, isColour } from './colours';

export type Colouring = Partial<Record<ColourRow, Colour | null | undefined>>;

const ROWS: ColourRow[] = ['text', 'background'];

const SET: Record<
  ColourRow,
  (commands: SingleCommands, colour: Colour) => boolean
> = {
  text: (commands, colour) => commands.setColor(colour),
  background: (commands, colour) => commands.setBackgroundColor(colour),
};

const UNSET: Record<ColourRow, (commands: SingleCommands) => boolean> = {
  text: (commands) => commands.unsetColor(),
  background: (commands) => commands.unsetBackgroundColor(),
};

export function colourText(commands: SingleCommands, colouring: Colouring) {
  return ROWS.every((row) => {
    const colour = colouring[row];
    if (colour === undefined) return true;
    return colour === null ? UNSET[row](commands) : SET[row](commands, colour);
  });
}

export function coloursAt(editor: Editor): Record<ColourRow, Colour | null> {
  const { color, backgroundColor } = editor.getAttributes('textStyle');
  return {
    text: isColour(color) ? color : null,
    background: isColour(backgroundColor) ? backgroundColor : null,
  };
}

export function canColour(editor: Editor) {
  const trial = new CommandManager({ editor, state: editor.state });
  return trial
    .createChain()
    .command(({ commands }) => colourText(commands, { text: COLOURS[0] }))
    .run();
}

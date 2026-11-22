import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  SquareCheckIcon,
  SquareCodeIcon,
  StrikethroughIcon,
  TextQuoteIcon,
  TypeIcon,
} from '@/ui/icons';

import type { Mark } from '../core/formats';
import type { SlashBlock } from '../core/slash-blocks';

export const ICONS: Record<SlashBlock | Mark, typeof TypeIcon> = {
  text: TypeIcon,
  heading1: Heading1Icon,
  heading2: Heading2Icon,
  heading3: Heading3Icon,
  bold: BoldIcon,
  italic: ItalicIcon,
  strike: StrikethroughIcon,
  code: CodeIcon,
  bulletList: ListIcon,
  orderedList: ListOrderedIcon,
  taskList: SquareCheckIcon,
  blockquote: TextQuoteIcon,
  codeBlock: SquareCodeIcon,
  horizontalRule: MinusIcon,
};

'use client';

import type { Editor } from '@tiptap/core';
import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { type MouseEvent, useId, useState } from 'react';

import { BaselineIcon } from '@/ui/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { Swatch, SwatchGroup } from '@/ui/swatch-group';
import { ToolbarButton } from '@/ui/toolbar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip';

import { type Colouring, colourText } from '../core/apply-colour';
import {
  type Colour,
  type ColourRow,
  COLOURS,
  INK,
  isColour,
  MARKER,
} from '../core/colours';
import { SHORTCUTS } from '../core/formats';
import { type LastColour, withPick } from '../core/last-colour';
import { rememberLastColour, useLastColour } from '../hooks/use-last-colour';
import { PlatformKeys } from './platform-keys';

const DEFAULT = 'default';

type TextColoursProps = {
  editor: Editor | null;
  current: Record<ColourRow, Colour | null>;
  canColour: boolean;
};

export function TextColours({ editor, current, canColour }: TextColoursProps) {
  const t = useTranslations('docs.colours');
  const lastColour = useLastColour();
  const [picked, setPicked] = useState<LastColour>({});

  const pick = (row: ColourRow, choice: Colour | null) => {
    const colouring: Colouring = { [row]: choice };
    editor?.commands.command(({ commands }) => colourText(commands, colouring));
    if (choice === null) return;
    const next = withPick(picked, { row, colour: choice });
    setPicked(next);
    rememberLastColour(next);
  };

  return (
    <>
      <Popover
        onOpenChange={(isOpen) => {
          if (isOpen) setPicked({});
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <ToolbarButton
                label={t('label')}
                disabled={!canColour}
                onMouseDown={keepTheFocusInTheEditor}
              >
                <BaselineIcon className="size-4" />
              </ToolbarButton>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>{t('label')}</TooltipContent>
        </Tooltip>
        <PopoverContent
          aria-label={t('label')}
          className="flex w-auto flex-col gap-3 p-3"
          onCloseAutoFocus={(event) => {
            if (hasFocusMovedOn()) return;
            event.preventDefault();
            editor?.commands.focus();
          }}
        >
          <SwatchRow
            row="text"
            current={current.text}
            onPick={(choice) => {
              pick('text', choice);
            }}
          />
          <SwatchRow
            row="background"
            current={current.background}
            onPick={(choice) => {
              pick('background', choice);
            }}
          />
        </PopoverContent>
      </Popover>
      <LastColourButton
        lastColour={lastColour}
        canColour={canColour}
        onApply={() => {
          editor
            ?.chain()
            .focus()
            .command(({ commands }) => colourText(commands, lastColour))
            .run();
        }}
      />
    </>
  );
}

type SwatchRowProps = {
  row: ColourRow;
  current: Colour | null;
  onPick: (choice: Colour | null) => void;
};

function SwatchRow({ row, current, onPick }: SwatchRowProps) {
  const t = useTranslations('docs.colours');
  const labelId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <p id={labelId} className="text-xs font-semibold text-muted-foreground">
        {t(row)}
      </p>
      <SwatchGroup aria-labelledby={labelId} value={current ?? DEFAULT}>
        {[DEFAULT, ...COLOURS].map((choice) => {
          const colour = isColour(choice) ? choice : null;
          return (
            <Swatch
              key={choice}
              value={choice}
              aria-label={colour ? t(`names.${colour}`) : t('default')}
              onClick={() => {
                onPick(colour);
              }}
            >
              <ColourSample
                text={row === 'text' ? colour : null}
                background={row === 'background' ? colour : null}
              />
            </Swatch>
          );
        })}
      </SwatchGroup>
    </div>
  );
}

type LastColourButtonProps = {
  lastColour: LastColour;
  canColour: boolean;
  onApply: () => void;
};

function LastColourButton({
  lastColour,
  canColour,
  onApply,
}: LastColourButtonProps) {
  const label = useLastColourLabel(lastColour);
  const { keys } = SHORTCUTS.lastColour;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToolbarButton
          label={label}
          disabled={!canColour}
          onMouseDown={keepTheFocusInTheEditor}
          onClick={onApply}
        >
          <ColourSample
            text={lastColour.text ?? null}
            background={lastColour.background ?? null}
            className="size-6"
          />
        </ToolbarButton>
      </TooltipTrigger>
      <TooltipContent>
        {label} <PlatformKeys binding={keys} />
      </TooltipContent>
    </Tooltip>
  );
}

function useLastColourLabel({ text, background }: LastColour) {
  const t = useTranslations('docs.colours');
  const nameOf = (colour: Colour) => t(`names.${colour}`).toLocaleLowerCase();
  const parts = [
    text && t('textPart', { colour: nameOf(text) }),
    background && t('backgroundPart', { colour: nameOf(background) }),
  ];
  return t('last', { colours: parts.filter(Boolean).join(', ') });
}

type ColourSampleProps = {
  text: Colour | null;
  background: Colour | null;
  className?: string;
};

function ColourSample({ text, background, className }: ColourSampleProps) {
  return (
    <span
      className={cn(
        'grid size-full place-items-center rounded-sm border',
        background ? MARKER[background] : 'bg-background',
        className,
      )}
    >
      <BaselineIcon
        className={cn('size-4', text ? INK[text] : 'text-foreground')}
      />
    </span>
  );
}

function hasFocusMovedOn() {
  return document.activeElement !== document.body;
}

function keepTheFocusInTheEditor(event: MouseEvent) {
  event.preventDefault();
}

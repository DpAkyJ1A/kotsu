import type { Editor } from '@tiptap/core';
import { useEffect, useEffectEvent, useState } from 'react';

import { REDUCED_MOTION, TOUCH_SCREEN } from '@/ui/use-media-query';

import {
  currentHeadingOf,
  type HeadingTop,
  type OutlineHeading,
} from '../core/outline';
import { ROOM_UNDER_THE_DOC_BAR_PX } from './use-doc-editor';

const WAYS_TO_MOVE_ON = ['wheel', 'touchmove', 'keydown', 'pointerdown'];

export function useCurrentHeading(
  editor: Editor,
  outline: readonly OutlineHeading[],
) {
  const [readHeading, setReadHeading] = useState<string>();
  const [pickedHeading, setPickedHeading] = useState<string>();

  const readTheCurrentHeading = useEffectEvent(() => {
    setReadHeading(
      currentHeadingOf(topsOf(editor, outline), ROOM_UNDER_THE_DOC_BAR_PX),
    );
  });

  useEffect(() => {
    let frame = 0;
    const readSoon = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        readTheCurrentHeading();
      });
    };
    const resizes = new ResizeObserver(readSoon);
    if (!editor.isDestroyed) resizes.observe(editor.view.dom);
    window.addEventListener('scroll', readSoon, { passive: true });
    window.addEventListener('resize', readSoon);
    return () => {
      cancelAnimationFrame(frame);
      resizes.disconnect();
      window.removeEventListener('scroll', readSoon);
      window.removeEventListener('resize', readSoon);
    };
  }, [editor]);

  useEffect(() => {
    if (pickedHeading === undefined) return;
    const moveOn = () => {
      setPickedHeading(undefined);
    };
    for (const event of WAYS_TO_MOVE_ON) {
      window.addEventListener(event, moveOn, { capture: true, passive: true });
    }
    return () => {
      for (const event of WAYS_TO_MOVE_ON) {
        window.removeEventListener(event, moveOn, { capture: true });
      }
    };
  }, [pickedHeading]);

  const current = outline.some(({ blockId }) => blockId === pickedHeading)
    ? pickedHeading
    : readHeading;

  const goTo = ({ blockId, position }: OutlineHeading) => {
    if (editor.isDestroyed) return;
    const heading = editor.view.nodeDOM(position);
    if (!(heading instanceof HTMLElement)) return;
    setPickedHeading(blockId);
    heading.scrollIntoView({
      behavior: matchMedia(REDUCED_MOTION).matches ? 'instant' : 'smooth',
      block: 'start',
    });
    if (!matchMedia(TOUCH_SCREEN).matches) {
      editor.commands.focus(position + 1, { scrollIntoView: false });
    }
  };

  return { current, goTo };
}

function topsOf(editor: Editor, outline: readonly OutlineHeading[]) {
  if (editor.isDestroyed) return [];
  return outline.flatMap(({ blockId, position }): HeadingTop[] => {
    const heading = editor.view.nodeDOM(position);
    return heading instanceof HTMLElement
      ? [{ blockId, top: heading.getBoundingClientRect().top }]
      : [];
  });
}

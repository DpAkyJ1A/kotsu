import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import {
  Accessibility,
  defaultPreset,
  type DragDropManager,
  type DragEndEvent,
  type Draggable,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom';
import { isSortable } from '@dnd-kit/react/sortable';
import { useTranslations } from 'next-intl';

import type { Shelf } from '../core/shelf';
import { shelfBefore } from '../core/shelf-change';

const LONG_PRESS = { value: 250, tolerance: 5 };
const MOUSE_TRAVEL = { value: 5 };

const SENSORS = [
  PointerSensor.configure({
    activatorElements: (source) => [source.element],
    activationConstraints: (event) => [
      event.pointerType === 'touch'
        ? new PointerActivationConstraints.Delay(LONG_PRESS)
        : new PointerActivationConstraints.Distance(MOUSE_TRAVEL),
    ],
    preventActivation: (event) =>
      event.target instanceof Element &&
      event.target.closest('button, input') !== null,
  }),
  KeyboardSensor,
];

const MODIFIERS = [RestrictToVerticalAxis];

export function useShelfDragging(
  shelves: Shelf[],
  move: (id: string, after: string | undefined) => void,
) {
  const t = useTranslations('shelves.move');

  function handleDragEnd({ operation: { source }, canceled }: DragEndEvent) {
    if (canceled || !isSortable(source)) return;
    if (source.index === source.initialIndex) return;
    const id = String(source.id);
    move(id, shelfBefore(shelves, id, source.index));
  }

  return {
    sensors: SENSORS,
    modifiers: MODIFIERS,
    plugins: [
      ...defaultPreset.plugins.filter((plugin) => plugin !== Accessibility),
      Accessibility.configure({
        screenReaderInstructions: { draggable: t('instructions') },
        announcements: {
          dragstart: (
            { operation: { source } }: DragStartEvent,
            manager: DragDropManager,
          ) => {
            if (!isSortable(source)) return;
            return t('pickedUp', placeOf(source, source.initialIndex, manager));
          },
          dragover: (
            { operation: { source, target } }: DragOverEvent,
            manager: DragDropManager,
          ) => {
            if (!isSortable(source) || !isSortable(target)) return;
            if (source.id === target.id) return;
            return t('movedTo', placeOf(source, target.index, manager));
          },
          dragend: (
            { operation: { source }, canceled }: DragEndEvent,
            manager: DragDropManager,
          ) => {
            if (!isSortable(source)) return;
            return canceled
              ? t('cancelled', placeOf(source, source.initialIndex, manager))
              : t('dropped', placeOf(source, source.index, manager));
          },
        },
      }),
    ],
    onDragEnd: handleDragEnd,
  };
}

function placeOf(source: Draggable, index: number, manager: DragDropManager) {
  return {
    name: nameIn(source.data),
    position: index + 1,
    count: [...manager.registry.draggables].length,
  };
}

function nameIn(data: unknown) {
  return typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    typeof data.name === 'string'
    ? data.name
    : '';
}

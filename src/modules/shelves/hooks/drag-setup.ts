import type { Data } from '@dnd-kit/abstract';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import {
  Accessibility,
  defaultPreset,
  type DragDropManager,
  type Draggable,
  type Droppable,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom';
import type {
  SortableDraggable,
  SortableDroppable,
} from '@dnd-kit/dom/sortable';

const LONG_PRESS = { value: 250, tolerance: 5 };
const MOUSE_TRAVEL = { value: 5 };

export const DRAG_SENSORS = [
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

export const UP_AND_DOWN = [RestrictToVerticalAxis];

type Announcements = NonNullable<
  NonNullable<ConstructorParameters<typeof Accessibility>[1]>['announcements']
>;

export function spokenDragPlugins(
  instructions: string,
  announcements: Announcements,
) {
  return [
    ...defaultPreset.plugins.filter((plugin) => plugin !== Accessibility),
    Accessibility.configure({
      screenReaderInstructions: { draggable: instructions },
      announcements,
    }),
  ];
}

export function eitherOf(
  first: Announcements,
  second: Announcements,
): Announcements {
  return {
    dragstart: (event, manager) =>
      first.dragstart(event, manager) ?? second.dragstart(event, manager),
    dragover: (event, manager) =>
      first.dragover?.(event, manager) ?? second.dragover?.(event, manager),
    dragend: (event, manager) =>
      first.dragend(event, manager) ?? second.dragend(event, manager),
  };
}

type Place = { name: string; position: number; count: number };

type ListMoves = {
  isMoved: (source: Draggable | null) => source is SortableDraggable<Data>;
  isTarget: (target: Droppable | null) => target is SortableDroppable<Data>;
  say: (
    moment: 'pickedUp' | 'movedTo' | 'dropped' | 'cancelled',
    place: Place,
  ) => string;
};

export function spokenListMoves({
  isMoved,
  isTarget,
  say,
}: ListMoves): Announcements {
  function placeOf(
    source: SortableDraggable<Data>,
    index: number,
    manager: DragDropManager,
  ) {
    return {
      name: nameIn(source.data),
      position: index + 1,
      count: [...manager.registry.draggables].filter(isMoved).length,
    };
  }

  return {
    dragstart: ({ operation: { source } }, manager) =>
      isMoved(source)
        ? say('pickedUp', placeOf(source, source.initialIndex, manager))
        : undefined,
    dragover: ({ operation: { source, target } }, manager) =>
      isMoved(source) && isTarget(target) && source.id !== target.id
        ? say('movedTo', placeOf(source, target.index, manager))
        : undefined,
    dragend: ({ operation: { source }, canceled }, manager) => {
      if (!isMoved(source)) return undefined;
      return canceled
        ? say('cancelled', placeOf(source, source.initialIndex, manager))
        : say('dropped', placeOf(source, source.index, manager));
    },
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

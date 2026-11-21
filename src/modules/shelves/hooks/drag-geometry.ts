import type { DragOperation } from '@dnd-kit/abstract';

export function isBelow({ shape, position, target }: DragOperation) {
  const { y } = shape?.current.center ?? position.current;
  return target?.shape ? y > target.shape.center.y : false;
}

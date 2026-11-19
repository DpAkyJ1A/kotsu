import { ImageResponse } from 'next/og';

import { KotsuBee } from './kotsu-bee';

const LAVENDER = '#f3edff';
const DEEP_VIOLET = '#2b2363';

const SHAPES = {
  rounded: { radius: 0.225, mark: 0.92, background: LAVENDER },
  fullBleed: { radius: 0, mark: 0.8, background: LAVENDER },
  favicon: { radius: 0.225, mark: 1.2, background: DEEP_VIOLET },
};

export function appIcon(size: number, shape: keyof typeof SHAPES) {
  const { radius, mark, background } = SHAPES[shape];

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        borderRadius: size * radius,
        background,
      }}
    >
      <KotsuBee size={size * mark} />
    </div>,
    { width: size, height: size },
  );
}

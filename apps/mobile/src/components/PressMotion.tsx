import type { ComponentProps } from 'react';
import { cssInterop } from 'nativewind';
import { PressableScale } from 'pressto';

const StyledPressableScale = cssInterop(PressableScale, {
  className: 'style',
});

type PressableScaleMotionProps = ComponentProps<typeof StyledPressableScale> & {
  disabled?: boolean;
};

export function PressableScaleMotion({ disabled, enabled, ...props }: PressableScaleMotionProps) {
  return <StyledPressableScale enabled={enabled ?? !disabled} {...props} />;
}

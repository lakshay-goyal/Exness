import { useEffect } from "react";
import Reanimated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Rect,
} from "react-native-svg";

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);
const AnimatedEllipse = Reanimated.createAnimatedComponent(Ellipse);
const AnimatedG = Reanimated.createAnimatedComponent(G);
const AnimatedPath = Reanimated.createAnimatedComponent(Path);
const AnimatedLine = Reanimated.createAnimatedComponent(Line);

function createTransformMatrix(
  translateX: number,
  translateY: number,
  rotateDegrees: number,
  originX: number,
  originY: number,
  scaleX = 1,
  scaleY = 1,
) {
  "worklet";

  const radians = (rotateDegrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const a = cos * scaleX;
  const b = sin * scaleX;
  const c = -sin * scaleY;
  const d = cos * scaleY;
  const e = translateX + originX - a * originX - c * originY;
  const f = translateY + originY - b * originX - d * originY;

  return `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;
}

type MoodCharactersProps = {
  width: number | string;
  height: number | string;
};

export function MoodCharacters({ width, height }: MoodCharactersProps) {
  const greenEnter = useSharedValue(0);
  const purpleEnter = useSharedValue(0);
  const pinkEnter = useSharedValue(0);
  const yellowEnter = useSharedValue(0);
  const orangeEnter = useSharedValue(0);
  const blueEnter = useSharedValue(0);
  const redEnter = useSharedValue(0);

  const breathe = useSharedValue(0);
  const orbit = useSharedValue(0);
  const glance = useSharedValue(0);
  const bounce = useSharedValue(0);
  const grump = useSharedValue(0);
  const sleepy = useSharedValue(0);
  const wobble = useSharedValue(0);

  useEffect(() => {
    const entranceDelay = 900;
    const spring = {
      damping: 18,
      mass: 1.45,
      stiffness: 34,
    };
    const ease = Easing.inOut(Easing.sin);

    greenEnter.value = withDelay(entranceDelay, withSpring(1, spring));
    purpleEnter.value = withDelay(entranceDelay + 420, withSpring(1, spring));
    pinkEnter.value = withDelay(entranceDelay + 760, withSpring(1, spring));
    orangeEnter.value = withDelay(entranceDelay + 1120, withSpring(1, spring));
    yellowEnter.value = withDelay(entranceDelay + 1480, withSpring(1, spring));
    blueEnter.value = withDelay(entranceDelay + 1840, withSpring(1, spring));
    redEnter.value = withDelay(entranceDelay + 2200, withSpring(1, spring));

    breathe.value = withRepeat(
      withTiming(1, { duration: 2100, easing: ease }),
      -1,
      true,
    );
    orbit.value = withRepeat(
      withTiming(1, { duration: 2600, easing: ease }),
      -1,
      true,
    );
    glance.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: ease }),
        withTiming(-1, { duration: 900, easing: ease }),
        withTiming(0, { duration: 900, easing: ease }),
      ),
      -1,
      false,
    );
    bounce.value = withRepeat(
      withSequence(
        withTiming(-1, { duration: 520, easing: ease }),
        withTiming(0, { duration: 680, easing: ease }),
      ),
      -1,
      false,
    );
    grump.value = withRepeat(
      withSequence(
        withTiming(-1, { duration: 120, easing: Easing.linear }),
        withTiming(1, { duration: 120, easing: Easing.linear }),
        withTiming(0, { duration: 520, easing: ease }),
      ),
      -1,
      false,
    );
    sleepy.value = withRepeat(
      withTiming(1, { duration: 2400, easing: ease }),
      -1,
      true,
    );
    wobble.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 620, easing: ease }),
        withTiming(-1, { duration: 620, easing: ease }),
        withTiming(0, { duration: 900, easing: ease }),
      ),
      -1,
      false,
    );
  }, [
    blueEnter,
    bounce,
    breathe,
    glance,
    greenEnter,
    grump,
    orangeEnter,
    orbit,
    pinkEnter,
    purpleEnter,
    redEnter,
    sleepy,
    wobble,
    yellowEnter,
  ]);

  const greenProps = useAnimatedProps(() => {
    const p = greenEnter.value;
    const scale = 0.82 + p * 0.18 + breathe.value * 0.035;
    return {
      opacity: p,
      transform: createTransformMatrix(
        94 - (1 - p) * 300,
        26 - (1 - p) * 30,
        breathe.value * 2,
        74,
        74,
        scale,
        scale,
      ),
    };
  });
  const purpleProps = useAnimatedProps(() => {
    const p = purpleEnter.value;
    const angle = 11 + orbit.value * 8;
    return {
      opacity: p,
      transform: createTransformMatrix(
        245 + (1 - p) * 280,
        6 - (1 - p) * 160,
        angle,
        63,
        63,
      ),
    };
  });
  const pinkProps = useAnimatedProps(() => {
    const p = pinkEnter.value;
    return {
      opacity: p,
      transform: createTransformMatrix(
        -28 - (1 - p) * 280,
        154 + glance.value * 2,
        -4 + glance.value * 2,
        78,
        78,
      ),
    };
  });
  const yellowProps = useAnimatedProps(() => {
    const p = yellowEnter.value;
    return {
      opacity: p,
      transform: createTransformMatrix(
        152,
        145 + (1 - p) * 300 + bounce.value * 8,
        6 + bounce.value * 3,
        66,
        101,
      ),
    };
  });
  const orangeProps = useAnimatedProps(() => {
    const p = orangeEnter.value;
    return {
      opacity: p,
      transform: createTransformMatrix(
        299 + (1 - p) * 290 + grump.value * 4,
        124,
        -14 + grump.value * 2,
        82,
        76,
      ),
    };
  });
  const blueProps = useAnimatedProps(() => {
    const p = blueEnter.value;
    const scaleY = 1 - sleepy.value * 0.035;
    return {
      opacity: p,
      transform: createTransformMatrix(
        24 - (1 - p) * 250,
        276 + (1 - p) * 260,
        4 - sleepy.value * 2,
        74,
        73,
        1,
        scaleY,
      ),
    };
  });
  const redProps = useAnimatedProps(() => {
    const p = redEnter.value;
    return {
      opacity: p,
      transform: createTransformMatrix(
        239 + (1 - p) * 270,
        264 + (1 - p) * 250,
        -5 + wobble.value * 5,
        80,
        76,
      ),
    };
  });
  const purpleEyeLeftProps = useAnimatedProps(() => ({
    cy: 65 + orbit.value * 3,
  }));
  const purpleEyeRightProps = useAnimatedProps(() => ({
    cy: 38 - orbit.value * 3,
  }));
  const pinkEyeLeftProps = useAnimatedProps(() => ({
    cx: 50 + glance.value * 5,
  }));
  const pinkEyeRightProps = useAnimatedProps(() => ({
    cx: 88 + glance.value * 5,
  }));
  const yellowSmileProps = useAnimatedProps(() => ({
    transform: `matrix(1, 0, 0, 1, 0, ${bounce.value * 3})`,
  }));
  const orangeEyeProps = useAnimatedProps(() => ({
    ry: 12 - Math.abs(grump.value) * 3,
  }));
  const blueMouthProps = useAnimatedProps(() => ({
    transform: `matrix(1, 0, 0, 1, 0, ${sleepy.value * 5})`,
  }));
  const redAngerLineLeftProps = useAnimatedProps(() => ({
    strokeWidth: 8 + Math.abs(wobble.value) * 1.5,
  }));
  const redAngerLineRightProps = useAnimatedProps(() => ({
    strokeWidth: 8 + Math.abs(wobble.value) * 1.5,
  }));

  return (
    <Svg width={width} height={height} viewBox="0 0 390 430" fill="none">
      <AnimatedG animatedProps={greenProps}>
        <Circle cx="74" cy="74" r="73" fill="#9DFF8F" />
        <Path
          d="M47 78C53 88 64 94 75 94C86 94 97 88 103 78"
          stroke="#0B0B0B"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Path
          d="M43 57C50 64 58 64 65 57"
          stroke="#0B0B0B"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Path
          d="M86 57C93 64 101 64 108 57"
          stroke="#0B0B0B"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </AnimatedG>

      <AnimatedG animatedProps={purpleProps}>
        <Circle
          cx="64"
          cy="64"
          r="56"
          stroke="#C77AF6"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <Path
          d="M34 21C55 3 89 7 107 29"
          stroke="#C77AF6"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <AnimatedCircle
          animatedProps={purpleEyeLeftProps}
          cx="42"
          r="10"
          fill="#0B0B0B"
        />
        <AnimatedCircle
          animatedProps={purpleEyeRightProps}
          cx="84"
          r="10"
          fill="#0B0B0B"
        />
        <Path
          d="M58 92C70 82 87 87 92 104"
          stroke="#0B0B0B"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M64 55C58 74 70 82 89 77"
          stroke="#0B0B0B"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </AnimatedG>

      <AnimatedG animatedProps={pinkProps}>
        <Circle cx="78" cy="78" r="78" fill="#F48ADC" />
        <AnimatedCircle
          animatedProps={pinkEyeLeftProps}
          cy="62"
          r="12"
          fill="#0B0B0B"
        />
        <AnimatedCircle
          animatedProps={pinkEyeRightProps}
          cy="62"
          r="12"
          fill="#0B0B0B"
        />
        <Path
          d="M39 106C62 96 86 101 102 120"
          stroke="#0B0B0B"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </AnimatedG>

      <AnimatedG animatedProps={yellowProps}>
        <Path
          d="M58 0H128L105 83H142L57 202L70 111H14L58 0Z"
          fill="#FFD33D"
          strokeLinejoin="round"
        />
        <Path
          d="M40 91C51 71 74 71 86 91"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <AnimatedPath
          animatedProps={yellowSmileProps}
          d="M72 115C87 128 111 128 126 115"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </AnimatedG>

      <AnimatedG animatedProps={orangeProps}>
        <Rect width="164" height="153" rx="31" fill="#FF8549" />
        <AnimatedEllipse
          animatedProps={orangeEyeProps}
          cx="60"
          cy="55"
          rx="20"
          fill="#FFFFFF"
        />
        <AnimatedEllipse
          animatedProps={orangeEyeProps}
          cx="111"
          cy="55"
          rx="20"
          fill="#FFFFFF"
        />
        <Circle cx="69" cy="52" r="8" fill="#0B0B0B" />
        <Circle cx="120" cy="52" r="8" fill="#0B0B0B" />
        <Path
          d="M54 103C75 91 107 93 127 110"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </AnimatedG>

      <AnimatedG animatedProps={blueProps}>
        <Rect width="148" height="147" rx="43" fill="#94C7FF" />
        <Path
          d="M35 72C41 82 52 84 61 75"
          stroke="#0B0B0B"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Path
          d="M84 72C90 82 101 84 110 75"
          stroke="#0B0B0B"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <AnimatedPath
          animatedProps={blueMouthProps}
          d="M67 111C71 100 88 101 94 113"
          stroke="#0B0B0B"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </AnimatedG>

      <AnimatedG animatedProps={redProps}>
        <Polygon
          points="72,3 159,146 0,157"
          fill="#FF777B"
          strokeLinejoin="round"
        />
        <AnimatedLine
          animatedProps={redAngerLineLeftProps}
          x1="48"
          y1="80"
          x2="69"
          y2="101"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <AnimatedLine
          animatedProps={redAngerLineLeftProps}
          x1="68"
          y1="80"
          x2="47"
          y2="101"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <AnimatedLine
          animatedProps={redAngerLineRightProps}
          x1="103"
          y1="78"
          x2="124"
          y2="99"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <AnimatedLine
          animatedProps={redAngerLineRightProps}
          x1="123"
          y1="78"
          x2="102"
          y2="99"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <Path
          d="M59 126C79 119 102 121 120 132"
          stroke="#0B0B0B"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </AnimatedG>
    </Svg>
  );
}

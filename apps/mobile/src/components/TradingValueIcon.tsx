import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

type TradingValueIconProps = {
  name: 'setup' | 'security' | 'sync';
};

export function TradingValueIcon({ name }: TradingValueIconProps) {
  if (name === 'security') {
    return (
      <Svg width={34} height={34} viewBox="0 0 34 34" fill="none">
        <Path d="M17 4L27 8V16C27 22 23 27 17 30C11 27 7 22 7 16V8L17 4Z" fill="#F4F4F4" />
        <Rect x="12" y="15" width="10" height="8" rx="2" fill="#111111" />
        <Path
          d="M14 15V12C14 10 15 9 17 9C19 9 20 10 20 12V15"
          stroke="#111111"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  if (name === 'sync') {
    return (
      <Svg width={34} height={34} viewBox="0 0 34 34" fill="none">
        <Circle cx="17" cy="17" r="13" fill="#F4F4F4" />
        <Path
          d="M10 16C10 12 13 10 17 10C19 10 21 11 22 12"
          stroke="#111111"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <Path
          d="M22 8V13H27"
          stroke="#111111"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M24 18C24 22 21 24 17 24C15 24 13 23 12 22"
          stroke="#111111"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <Path
          d="M12 26V21H7"
          stroke="#111111"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={34} height={34} viewBox="0 0 34 34" fill="none">
      <G transform="translate(4 5)">
        <Path
          d="M2 18C7 10 12 15 16 8C18 5 21 4 24 4"
          stroke="#F4F4F4"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Circle cx="6" cy="18" r="3" fill="#F4F4F4" />
        <Circle cx="16" cy="8" r="3" fill="#F4F4F4" />
        <Circle cx="24" cy="4" r="3" fill="#F4F4F4" />
        <Line
          x1="2"
          y1="24"
          x2="27"
          y2="24"
          stroke="#7C7C7C"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

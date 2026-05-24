import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";

export function TradingSetupIllustration() {
  return (
    <Svg width={150} height={134} viewBox="0 0 150 134" fill="none">
      <G transform="translate(22 20)">
        <Rect x="6" y="16" width="112" height="82" rx="18" fill="#2B2B2B" />
        <Path
          d="M22 55C36 37 48 60 62 42C75 26 91 39 105 31"
          stroke="#F3F3F3"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <Path
          d="M22 56C36 38 48 61 62 43C75 27 91 40 105 32"
          stroke="#AFAFAF"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Path
          d="M21 66H107C111 66 114 69 114 73V78H14V73C14 69 17 66 21 66Z"
          fill="#F5F5F5"
        />
        <Path
          d="M18 77H114V87C114 93 109 98 103 98H29C23 98 18 93 18 87V77Z"
          fill="#BBBBBB"
        />
        <Path
          d="M53 87H80C78 96 73 101 66 101C59 101 55 96 53 87Z"
          fill="#BBBBBB"
        />
        <Circle cx="28" cy="44" r="5" fill="#FFFFFF" opacity="0.42" />
        <Circle cx="28" cy="71" r="5" fill="#1A1A1A" opacity="0.28" />
        <Line
          x1="70"
          y1="8"
          x2="70"
          y2="24"
          stroke="#444444"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Line
          x1="62"
          y1="16"
          x2="78"
          y2="16"
          stroke="#444444"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>
      <G transform="translate(15 28)">
        <Path d="M9 0L11 7L18 9L11 11L9 18L7 11L0 9L7 7L9 0Z" fill="#FFFFFF" />
        <Circle cx="23" cy="3" r="2" fill="#FFFFFF" />
      </G>
      <G transform="translate(118 78)">
        <Path d="M9 0L11 7L18 9L11 11L9 18L7 11L0 9L7 7L9 0Z" fill="#FFFFFF" />
        <Circle cx="23" cy="13" r="2" fill="#FFFFFF" />
      </G>
    </Svg>
  );
}

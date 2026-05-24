import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Rect,
} from "react-native-svg";

type MoodCharactersProps = {
  width: number | string;
  height: number | string;
};

export function MoodCharacters({ width, height }: MoodCharactersProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 390 430" fill="none">
      <G transform="translate(94 26)">
        <Circle cx="74" cy="74" r="73" fill="#F4F4F4" />
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
      </G>

      <G transform="translate(245 6) rotate(11 63 63)">
        <Circle
          cx="64"
          cy="64"
          r="56"
          stroke="#DCDCDC"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <Path
          d="M34 21C55 3 89 7 107 29"
          stroke="#0B0B0B"
          strokeOpacity="0.88"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <Circle cx="42" cy="65" r="10" fill="#0B0B0B" />
        <Circle cx="84" cy="38" r="10" fill="#0B0B0B" />
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
      </G>

      <G transform="translate(-28 154) rotate(-4 78 78)">
        <Circle cx="78" cy="78" r="78" fill="#E9E9E9" />
        <Circle cx="50" cy="62" r="12" fill="#0B0B0B" />
        <Circle cx="88" cy="62" r="12" fill="#0B0B0B" />
        <Path
          d="M39 106C62 96 86 101 102 120"
          stroke="#0B0B0B"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </G>

      <G transform="translate(152 145) rotate(6 66 101)">
        <Path
          d="M58 0H128L105 83H142L57 202L70 111H14L58 0Z"
          fill="#F7F7F7"
          stroke="#0B0B0B"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <Path
          d="M40 91C51 71 74 71 86 91"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <Path
          d="M72 115C87 128 111 128 126 115"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </G>

      <G transform="translate(299 124) rotate(-14 82 76)">
        <Rect width="164" height="153" rx="31" fill="#CECECE" />
        <Ellipse cx="60" cy="55" rx="20" ry="12" fill="#FFFFFF" />
        <Ellipse cx="111" cy="55" rx="20" ry="12" fill="#FFFFFF" />
        <Circle cx="69" cy="52" r="8" fill="#0B0B0B" />
        <Circle cx="120" cy="52" r="8" fill="#0B0B0B" />
        <Path
          d="M54 103C75 91 107 93 127 110"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </G>

      <G transform="translate(24 276) rotate(4 74 73)">
        <Rect width="148" height="147" rx="43" fill="#D8D8D8" />
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
        <Path
          d="M67 111C71 100 88 101 94 113"
          stroke="#0B0B0B"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </G>

      <G transform="translate(239 264) rotate(-5 80 76)">
        <Polygon
          points="72,3 159,146 0,157"
          fill="#EDEDED"
          stroke="#0B0B0B"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <Line
          x1="48"
          y1="80"
          x2="69"
          y2="101"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <Line
          x1="68"
          y1="80"
          x2="47"
          y2="101"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <Line
          x1="103"
          y1="78"
          x2="124"
          y2="99"
          stroke="#0B0B0B"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <Line
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
      </G>
    </Svg>
  );
}

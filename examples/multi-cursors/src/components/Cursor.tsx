import { animated, to, useSpring } from "@react-spring/web";

interface CursorProps {
  position: { x: number; y: number };
  color: string;
  isDragging: boolean;
  isRemote: boolean;
  name: string;
}

export function Cursor({
  position,
  color,
  isDragging,
  isRemote,
  name,
}: CursorProps) {
  const springs = useSpring({
    x: position.x,
    y: position.y,
    immediate: !isRemote,
    config: {
      tension: 170,
      friction: 26,
    },
  });

  return (
    <animated.g
      transform={to(
        [springs.x, springs.y],
        (x: number, y: number) => `translate(${x}, ${y})`,
      )}
    >
      <polygon
        points="0,0 0,20 14.3,14.3"
        fill={
          isDragging ? color : `color-mix(in oklch, ${color}, transparent 56%)`
        }
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="10"
        y="25"
        fill={color}
        stroke="white"
        strokeWidth="3"
        strokeLinejoin="round"
        paintOrder="stroke"
        fontSize="14"
        dominantBaseline="hanging"
        style={{
          fontFamily: "Inter, Manrope, system-ui, sans-serif",
          fontWeight: 500,
        }}
      >
        {name}
      </text>
    </animated.g>
  );
}

import type { CSSProperties, ReactNode } from "react";

export type LayeredObjectOffset = "sm" | "md" | "lg" | number;

export type LayeredObjectProps = {
  children: ReactNode;
  offset?: LayeredObjectOffset;
  radius?: number | string;
  primaryColor?: string;
  primaryBorderColor?: string;
  primaryBorderWidth?: number | string;
  secondaryColor?: string;
  secondaryBorderColor?: string;
  secondaryBorderWidth?: number | string;
  className?: string;
  style?: CSSProperties;
  backLayerClassName?: string;
  backLayerStyle?: CSSProperties;
  frontLayerClassName?: string;
  frontLayerStyle?: CSSProperties;
};

const namedOffsets: Record<Exclude<LayeredObjectOffset, number>, number> = {
  sm: 6,
  md: 8,
  lg: 12,
};

export function LayeredObject({
  children,
  offset = "md",
  radius = 12,
  primaryColor = "Canvas",
  primaryBorderColor = "color-mix(in srgb, CanvasText 18%, transparent)",
  primaryBorderWidth = 1,
  secondaryColor = "color-mix(in srgb, CanvasText 8%, Canvas)",
  secondaryBorderColor = "color-mix(in srgb, CanvasText 22%, transparent)",
  secondaryBorderWidth = 1,
  className,
  style,
  backLayerClassName,
  backLayerStyle,
  frontLayerClassName,
  frontLayerStyle,
}: LayeredObjectProps) {
  const offsetPx = typeof offset === "number" ? offset : namedOffsets[offset];

  return (
    <div
      className={className}
      style={{
        paddingBottom: offsetPx,
        paddingRight: offsetPx,
        position: "relative",
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        className={backLayerClassName}
        style={{
          background: secondaryColor,
          border: `${cssSize(secondaryBorderWidth)} solid ${secondaryBorderColor}`,
          borderRadius: radius,
          bottom: offsetPx,
          left: 0,
          position: "absolute",
          right: offsetPx,
          top: 0,
          transform: `translate(${offsetPx}px, ${offsetPx}px)`,
          ...backLayerStyle,
        }}
      />
      <div
        className={frontLayerClassName}
        style={{
          background: primaryColor,
          border: `${cssSize(primaryBorderWidth)} solid ${primaryBorderColor}`,
          borderRadius: radius,
          overflow: "hidden",
          position: "relative",
          ...frontLayerStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default LayeredObject;

function cssSize(value: number | string) {
  return typeof value === "number" ? `${value}px` : value;
}

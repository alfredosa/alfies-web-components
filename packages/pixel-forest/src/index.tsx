import { useEffect, useRef, type CSSProperties } from "react";

export type TreePalette = {
  leafDark: string;
  leafMid: string;
  leafLight: string;
  trunkDark: string;
  trunkLight: string;
};

export type PixelForestProps = {
  seed?: number;
  density?: number;
  windStrength?: number;
  dprMax?: number;
  fullscreen?: boolean;
  respectReducedMotion?: boolean;
  palettes?: TreePalette[];
  skyTop?: string;
  skyMiddle?: string;
  skyBottom?: string;
  mistColor?: string;
  groundColor?: string;
  className?: string;
  style?: CSSProperties;
};

type CanopyBlob = {
  x: number;
  y: number;
  r: number;
};

type TreeModel = {
  seed: number;
  x: number;
  groundY: number;
  unit: number;
  layer: number;
  trunkHeight: number;
  trunkLean: number;
  canopy: CanopyBlob[];
  phase: number;
  palette: TreePalette;
};

const defaultPalettes: TreePalette[] = [
  {
    leafDark: "#17351f",
    leafMid: "#255b32",
    leafLight: "#4f8b4a",
    trunkDark: "#4a2d1f",
    trunkLight: "#795033",
  },
  {
    leafDark: "#183927",
    leafMid: "#2d6841",
    leafLight: "#6a9d55",
    trunkDark: "#3c2a21",
    trunkLight: "#6d4a32",
  },
  {
    leafDark: "#1b3328",
    leafMid: "#2f6048",
    leafLight: "#7b9555",
    trunkDark: "#493122",
    trunkLight: "#815638",
  },
];
const fallbackPalette: TreePalette = defaultPalettes[0] ?? {
  leafDark: "#17351f",
  leafMid: "#255b32",
  leafLight: "#4f8b4a",
  trunkDark: "#4a2d1f",
  trunkLight: "#795033",
};

export function PixelForest({
  seed = 24891237,
  density = 1,
  windStrength = 1,
  dprMax = 2,
  fullscreen = true,
  respectReducedMotion = true,
  palettes = defaultPalettes,
  skyTop = "#0d1515",
  skyMiddle = "#16251f",
  skyBottom = "#10170f",
  mistColor = "rgba(105, 148, 83, 0.08)",
  groundColor = "rgba(13, 23, 13, 0.95)",
  className,
  style,
}: PixelForestProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const optionsRef = useRef({
    density,
    dprMax,
    groundColor,
    mistColor,
    palettes,
    respectReducedMotion,
    seed,
    skyBottom,
    skyMiddle,
    skyTop,
    windStrength,
  });

  optionsRef.current = {
    density,
    dprMax,
    groundColor,
    mistColor,
    palettes,
    respectReducedMotion,
    seed,
    skyBottom,
    skyMiddle,
    skyTop,
    windStrength,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return undefined;
    const canvasElement = canvas;
    const renderContext = context;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let trees: TreeModel[] = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function resize() {
      const rect = canvasElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, optionsRef.current.dprMax);
      width = Math.max(1, Math.floor(rect.width || window.innerWidth));
      height = Math.max(1, Math.floor(rect.height || window.innerHeight));
      canvasElement.width = Math.floor(width * dpr);
      canvasElement.height = Math.floor(height * dpr);
      renderContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderContext.imageSmoothingEnabled = false;
      trees = generateForest(width, height, optionsRef.current);
    }

    function render(time: number) {
      const options = optionsRef.current;
      const freeze = options.respectReducedMotion && reducedMotion.matches;
      const sceneTime = freeze ? 0 : time;
      drawBackground(renderContext, width, height, sceneTime, options);

      for (const tree of trees) {
        drawTree(renderContext, tree, sceneTime, options.windStrength);
      }

      if (!freeze) {
        animationFrame = window.requestAnimationFrame(render);
      }
    }

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(canvasElement);
    resize();
    render(0);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [density, palettes, seed]);

  const canvasStyle: CSSProperties = {
    display: "block",
    height: fullscreen ? "100vh" : "100%",
    imageRendering: "pixelated",
    pointerEvents: "none",
    width: fullscreen ? "100vw" : "100%",
    ...style,
  };

  if (fullscreen) {
    canvasStyle.inset = 0;
    canvasStyle.position = "fixed";
    canvasStyle.zIndex = -1;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={canvasStyle}
    />
  );
}

export { PixelForest as TreeScene };

function mulberry32(seed: number) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(random: () => number, min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function valueNoise(seed: number, x: number, y: number) {
  let value = seed ^ Math.imul(x + 374761393, 668265263);
  value ^= Math.imul(y + 1442695041, 2246822519);
  value = Math.imul(value ^ (value >>> 13), 1274126177);

  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function generateTree(
  seed: number,
  x: number,
  groundY: number,
  unit: number,
  layer: number,
  palettes: TreePalette[],
): TreeModel {
  const random = mulberry32(seed);
  const trunkHeight = randInt(random, 13, 21);
  const trunkLean = randInt(random, -2, 2);
  const topY = 44 - trunkHeight;
  const centerCount = randInt(random, 4, 7);
  const canopy: CanopyBlob[] = [
    { x: 0, y: topY - randInt(random, 8, 12), r: randInt(random, 8, 11) },
    { x: -7, y: topY - randInt(random, 4, 9), r: randInt(random, 7, 10) },
    { x: 7, y: topY - randInt(random, 4, 9), r: randInt(random, 7, 10) },
  ];

  for (let index = 3; index < centerCount; index += 1) {
    canopy.push({
      x: randInt(random, -10, 10),
      y: topY - randInt(random, 4, 15),
      r: randInt(random, 5, 8),
    });
  }

  return {
    seed,
    x,
    groundY,
    unit,
    layer,
    trunkHeight,
    trunkLean,
    canopy,
    phase: random() * Math.PI * 2,
    palette: palettes[randInt(random, 0, palettes.length - 1)] ?? fallbackPalette,
  };
}

function generateForest(
  width: number,
  height: number,
  options: Pick<PixelForestProps, "density" | "palettes" | "seed">,
) {
  const random = mulberry32(
    (options.seed ?? 24891237) +
      Math.round(width) * 17 +
      Math.round(height) * 31,
  );
  const trees: TreeModel[] = [];
  const density = Math.max(0.25, options.density ?? 1);
  const palettes = options.palettes?.length ? options.palettes : defaultPalettes;
  const rows = [
    { y: 0.28, spacing: 210, unit: 1.65, layer: 0, xOffset: -70 },
    { y: 0.4, spacing: 185, unit: 1.9, layer: 0, xOffset: 38 },
    { y: 0.52, spacing: 170, unit: 2.15, layer: 1, xOffset: -18 },
    { y: 0.64, spacing: 155, unit: 2.45, layer: 1, xOffset: 76 },
    { y: 0.76, spacing: 145, unit: 2.75, layer: 2, xOffset: 12 },
    { y: 0.86, spacing: 132, unit: 3.05, layer: 3, xOffset: -46 },
    { y: 0.94, spacing: 124, unit: 3.35, layer: 4, xOffset: 52 },
  ];

  rows.forEach((row, rowIndex) => {
    for (let x = -140 + row.xOffset; x < width + 180; x += row.spacing / density) {
      const jitterX = randInt(random, -34, 34);
      const jitterY = randInt(random, -10, 10);
      const unit = row.unit + random() * 0.42;
      const treeSeed = 9000 + rowIndex * 700 + Math.round(x * 11) + randInt(random, 0, 500);
      const rowDrift = (random() - 0.5) * 0.16;

      trees.push(
        generateTree(
          treeSeed,
          x + jitterX,
          height * (row.y + rowDrift) + jitterY,
          unit,
          row.layer,
          palettes,
        ),
      );
    }
  });

  return trees.sort((a, b) => a.groundY - b.groundY);
}

function drawPixel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  unit: number,
  color: string,
) {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.ceil(unit), Math.ceil(unit));
}

function drawBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  options: Pick<
    Required<PixelForestProps>,
    "groundColor" | "mistColor" | "skyBottom" | "skyMiddle" | "skyTop"
  >,
) {
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, options.skyTop);
  sky.addColorStop(0.54, options.skyMiddle);
  sky.addColorStop(1, options.skyBottom);
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  context.fillStyle = options.mistColor;
  for (let index = 0; index < 9; index += 1) {
    const y = height * (0.45 + index * 0.055);
    const drift = Math.sin(time * 0.00018 + index * 1.7) * 18;
    context.fillRect(-20 + drift, Math.round(y), width + 40, 2);
  }

  const ground = context.createLinearGradient(0, height * 0.55, 0, height);
  ground.addColorStop(0, "rgba(35, 72, 39, 0)");
  ground.addColorStop(0.42, "rgba(32, 62, 32, 0.44)");
  ground.addColorStop(1, options.groundColor);
  context.fillStyle = ground;
  context.fillRect(0, height * 0.5, width, height * 0.5);
}

function drawTree(
  context: CanvasRenderingContext2D,
  tree: TreeModel,
  time: number,
  windStrength: number,
) {
  const bottomY = 44;
  const trunkTopY = bottomY - tree.trunkHeight;
  const windCurve = Math.sin(time * 0.0012 + tree.phase + tree.layer * 0.58);
  const gustCurve = Math.sin(time * 0.00052 + tree.x * 0.018);
  const wind = Math.round((windCurve * 0.72 + gustCurve * 0.35) * (tree.layer + 1) * windStrength);
  const trunkFlex = valueNoise(tree.seed, 17, 23) > 0.22 ? 0.42 : 0.12;
  const trunkTopWind = Math.round(wind * trunkFlex);
  const originX = tree.x;
  const originY = tree.groundY - bottomY * tree.unit;

  context.fillStyle = `rgba(0, 0, 0, ${0.16 + tree.layer * 0.04})`;
  context.fillRect(
    Math.round(originX - 13 * tree.unit),
    Math.round(tree.groundY - 2 * tree.unit),
    Math.round(28 * tree.unit),
    Math.round(4 * tree.unit),
  );

  for (let y = trunkTopY; y <= bottomY; y += 1) {
    const progress = (bottomY - y) / tree.trunkHeight;
    const lean = Math.round(tree.trunkLean * progress);
    const bend = Math.round(trunkTopWind * progress ** 1.45);
    const halfWidth = progress < 0.28 ? 1 : 2;

    for (let x = -halfWidth; x <= halfWidth; x += 1) {
      const color = x < 0 ? tree.palette.trunkDark : tree.palette.trunkLight;
      drawPixel(context, originX + (lean + bend + x) * tree.unit, originY + y * tree.unit, tree.unit, color);
    }
  }

  for (const blob of tree.canopy) {
    const leafWind = Math.round(wind * (0.78 + Math.max(0, -blob.y) * 0.01));
    const blobWind = trunkTopWind + leafWind;

    for (let y = Math.floor(blob.y - blob.r); y <= Math.ceil(blob.y + blob.r); y += 1) {
      for (let x = Math.floor(blob.x - blob.r); x <= Math.ceil(blob.x + blob.r); x += 1) {
        const dx = x - blob.x;
        const dy = y - blob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const noise = valueNoise(tree.seed, x + 40, y + 80) * 3.6 - 1.5;

        if (distance > blob.r + noise) continue;

        const shade = valueNoise(tree.seed + 31, x * 2, y * 2);
        const color =
          shade > 0.78
            ? tree.palette.leafLight
            : shade < 0.3
              ? tree.palette.leafDark
              : tree.palette.leafMid;

        drawPixel(
          context,
          originX + (x + blobWind) * tree.unit,
          originY + y * tree.unit,
          tree.unit,
          color,
        );
      }
    }
  }
}

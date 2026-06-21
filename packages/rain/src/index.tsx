import { useEffect, useRef, type CSSProperties } from "react";

export type RainEffectProps = {
  color?: string;
  intensity?: number;
  size?: number;
  maxDrops?: number;
  windX?: number;
  lightning?: boolean;
  lightningMinDelayMs?: number;
  lightningMaxDelayMs?: number;
  lightningGlowColor?: string;
  lightningCoreColor?: string;
  flashColor?: string;
  dprMax?: number;
  className?: string;
  style?: CSSProperties;
};

type RainDrop = {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
};

type LightningSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
};

type LightningBolt = {
  age: number;
  segments: LightningSegment[];
};

export function RainEffect({
  color = "#d7c08d",
  intensity = 0.65,
  size = 1,
  maxDrops = 300,
  windX = -0.1,
  lightning = true,
  lightningMinDelayMs = 2000,
  lightningMaxDelayMs = 6000,
  lightningGlowColor = "rgba(156, 222, 242, ALPHA)",
  lightningCoreColor = "rgba(255, 255, 255, ALPHA)",
  flashColor = "rgba(255, 255, 255, ALPHA)",
  dprMax = 2,
  className,
  style,
}: RainEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const optionsRef = useRef({
    color,
    dprMax,
    flashColor,
    intensity,
    lightning,
    lightningCoreColor,
    lightningGlowColor,
    lightningMaxDelayMs,
    lightningMinDelayMs,
    maxDrops,
    size,
    windX,
  });

  optionsRef.current = {
    color,
    dprMax,
    flashColor,
    intensity,
    lightning,
    lightningCoreColor,
    lightningGlowColor,
    lightningMaxDelayMs,
    lightningMinDelayMs,
    maxDrops,
    size,
    windX,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return undefined;
    }
    const canvasElement = canvas;
    const context = ctx;

    let width = 0;
    let height = 0;
    let animationFrameId = 0;
    let lastFrame = performance.now();
    let flashOpacity = 0;
    let nextLightningAt = lastFrame + getLightningDelay();
    const drops: RainDrop[] = [];
    const bolts: LightningBolt[] = [];

    function getLightningDelay() {
      const options = optionsRef.current;
      return (
        options.lightningMinDelayMs +
        Math.random() *
          Math.max(0, options.lightningMaxDelayMs - options.lightningMinDelayMs)
      );
    }

    function resize() {
      const rect = canvasElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, optionsRef.current.dprMax);
      width = Math.max(1, Math.floor(rect.width || window.innerWidth));
      height = Math.max(1, Math.floor(rect.height || window.innerHeight));
      canvasElement.width = Math.floor(width * dpr);
      canvasElement.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      const options = optionsRef.current;
      const len = 10 + Math.random() * 20;
      const speed = 4 + Math.random() * 8;
      const effectLength = len * options.size;
      const maxHorizontalDrift =
        (height + effectLength) * Math.abs(options.windX / speed) +
        effectLength;
      const minX = options.windX > 0 ? -maxHorizontalDrift : -effectLength;
      const maxX =
        options.windX > 0 ? width + effectLength : width + maxHorizontalDrift;

      drops.push({
        x: minX + Math.random() * (maxX - minX),
        y: -effectLength,
        len,
        speed,
        alpha: 0.22 + Math.random() * 0.22,
      });
    }

    function buildBolt(
      x: number,
      y: number,
      length: number,
      direction: number,
      segments: LightningSegment[],
      depth = 0,
    ) {
      const originalDirection = direction;
      let remaining = length;
      const maxBranches = depth > 3 ? 0 : 2;
      let branches = 0;

      while (remaining > 0 && y < height + 20 && x > -30 && x < width + 30) {
        const x1 = x;
        const y1 = y;
        const step = 4 + Math.random() * 6;
        x += Math.cos(direction) * step;
        y -= Math.sin(direction) * step;
        remaining -= step;

        segments.push({
          x1,
          y1,
          x2: x,
          y2: y,
          alpha: Math.min(1, Math.max(0.12, remaining / 350)),
        });

        direction =
          originalDirection + (-Math.PI / 8 + Math.random() * (Math.PI / 4));

        if (branches < maxBranches && remaining > 30 && Math.random() > 0.985) {
          branches += 1;
          buildBolt(
            x,
            y,
            remaining * (0.25 + Math.random() * 0.45),
            originalDirection + (-Math.PI / 6 + Math.random() * (Math.PI / 3)),
            segments,
            depth + 1,
          );
        } else if (
          branches < maxBranches &&
          remaining > 60 &&
          Math.random() > 0.975
        ) {
          branches += 1;
          buildBolt(
            x,
            y,
            remaining,
            originalDirection + (-Math.PI / 6 + Math.random() * (Math.PI / 3)),
            segments,
            depth + 1,
          );
          remaining = 0;
        }
      }
    }

    function launchLightning() {
      const segments: LightningSegment[] = [];
      const x = -10 + Math.random() * (width + 20);
      const length = height * (0.6 + Math.random() * 0.4);

      flashOpacity = 0.12 + Math.random() * 0.15;
      buildBolt(x, -10, length, (Math.PI * 3) / 2, segments);
      bolts.push({ age: 0, segments });
    }

    function draw() {
      animationFrameId = window.requestAnimationFrame(draw);
      const options = optionsRef.current;
      const frame = performance.now();
      const elapsed = (frame - lastFrame) / 1000;
      const clampedIntensity = clamp(options.intensity, 0, 1);
      const speedMult = 0.35 + clampedIntensity * 0.65;
      lastFrame = frame;

      context.clearRect(0, 0, width, height);

      if (
        drops.length < options.maxDrops * clampedIntensity &&
        Math.random() < 0.6 * clampedIntensity
      ) {
        spawn();
      }

      if (
        options.lightning &&
        clampedIntensity > 0.1 &&
        frame >= nextLightningAt
      ) {
        launchLightning();
        nextLightningAt = frame + getLightningDelay();
      }

      if (flashOpacity > 0) {
        context.fillStyle = colorWithAlpha(options.flashColor, flashOpacity * clampedIntensity);
        context.fillRect(0, 0, width, height);
        flashOpacity = Math.max(0, flashOpacity - 2 * elapsed);
      }

      context.lineCap = "round";
      context.lineJoin = "round";
      for (let index = bolts.length - 1; index >= 0; index -= 1) {
        const bolt = bolts[index];
        if (!bolt) continue;

        bolt.age += elapsed;
        if (bolt.age >= 0.75) {
          bolts.splice(index, 1);
          continue;
        }

        const fadeAlpha =
          bolt.age <= 0.25 ? 1 : Math.max(0, (0.75 - bolt.age) / 0.5);

        for (const segment of bolt.segments) {
          const alpha = segment.alpha * fadeAlpha * clampedIntensity;
          if (alpha <= 0) continue;

          context.strokeStyle = colorWithAlpha(options.lightningGlowColor, alpha * 0.25);
          context.lineWidth = 3 * options.size;
          context.beginPath();
          context.moveTo(segment.x1, segment.y1);
          context.lineTo(segment.x2, segment.y2);
          context.stroke();

          context.strokeStyle = colorWithAlpha(options.lightningCoreColor, alpha * 0.9);
          context.lineWidth = options.size;
          context.beginPath();
          context.moveTo(segment.x1, segment.y1);
          context.lineTo(segment.x2, segment.y2);
          context.stroke();
        }
      }

      context.lineCap = "round";
      for (let index = drops.length - 1; index >= 0; index -= 1) {
        const drop = drops[index];
        if (!drop) continue;

        drop.x += options.windX * speedMult;
        drop.y += drop.speed * 18 * speedMult * elapsed;

        context.strokeStyle = colorWithAlpha(options.color, drop.alpha * clampedIntensity);
        context.lineWidth = 1.1 * options.size;
        context.beginPath();
        context.moveTo(
          drop.x - options.windX * drop.len * 0.25,
          drop.y - drop.len * options.size,
        );
        context.lineTo(drop.x, drop.y);
        context.stroke();

        if (drop.y > height + drop.len) {
          drops.splice(index, 1);
        }
      }
    }

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(canvasElement);
    resize();
    window.addEventListener("resize", resize);
    animationFrameId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        height: "100%",
        pointerEvents: "none",
        width: "100%",
        ...style,
      }}
    />
  );
}

export { RainEffect as Rain };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function colorWithAlpha(color: string, alpha: number) {
  if (color.includes("ALPHA")) {
    return color.replaceAll("ALPHA", String(alpha));
  }

  if (color.startsWith("#") && color.length === 7) {
    const red = Number.parseInt(color.slice(1, 3), 16);
    const green = Number.parseInt(color.slice(3, 5), 16);
    const blue = Number.parseInt(color.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  return color;
}

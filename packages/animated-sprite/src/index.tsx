import { useEffect, useRef, type CSSProperties } from "react";

export type SpriteAnimation = {
  src: string;
  frames: number;
  fps: number;
};

export type AnimatedSpriteAnimations = {
  idle: SpriteAnimation;
  walk?: SpriteAnimation;
  action?: SpriteAnimation;
};

export type SpriteState = {
  animation: keyof AnimatedSpriteAnimations;
  x: number;
  y: number;
  frame: number;
  flipped: boolean;
};

export type AnimatedSpriteProps = {
  animations: AnimatedSpriteAnimations;
  size?: number;
  speedPxPerSecond?: number;
  idleMinMs?: number;
  idleMaxMs?: number;
  mouseAttractionRadius?: number;
  mouseAttractionChance?: number;
  actionOnClick?: boolean;
  dprMax?: number;
  imageSmoothingEnabled?: boolean;
  className?: string;
  style?: CSSProperties;
  canvasStyle?: CSSProperties;
  onLoadError?: (error: Error) => void;
  onStateChange?: (state: SpriteState) => void;
};

type LoadedSprite = {
  img: HTMLImageElement;
  frames: number;
  fps: number;
};

type BrainState = {
  animation: keyof AnimatedSpriteAnimations;
  x: number;
  y: number;
  frame: number;
  flipped: boolean;
};

type BrainOptions = {
  actionOnClick: boolean;
  animations: AnimatedSpriteAnimations;
  idleMaxMs: number;
  idleMinMs: number;
  mouseAttractionChance: number;
  mouseAttractionRadius: number;
  speedPxPerSecond: number;
};

export function AnimatedSprite({
  animations,
  size = 100,
  speedPxPerSecond = 130,
  idleMinMs = 2500,
  idleMaxMs = 5500,
  mouseAttractionRadius = 300,
  mouseAttractionChance = 0.55,
  actionOnClick = true,
  dprMax = 2,
  imageSmoothingEnabled = false,
  className,
  style,
  canvasStyle,
  onLoadError,
  onStateChange,
}: AnimatedSpriteProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const optionsRef = useRef({
    actionOnClick,
    animations,
    dprMax,
    idleMaxMs,
    idleMinMs,
    imageSmoothingEnabled,
    mouseAttractionChance,
    mouseAttractionRadius,
    onLoadError,
    onStateChange,
    size,
    speedPxPerSecond,
  });

  optionsRef.current = {
    actionOnClick,
    animations,
    dprMax,
    idleMaxMs,
    idleMinMs,
    imageSmoothingEnabled,
    mouseAttractionChance,
    mouseAttractionRadius,
    onLoadError,
    onStateChange,
    size,
    speedPxPerSecond,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    const canvasElement = canvas;
    const wrapperElement = wrapper;
    const context = ctx;

    let running = true;
    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let brain: ReturnType<typeof createBrain> | null = null;
    let sprites: Partial<Record<keyof AnimatedSpriteAnimations, LoadedSprite>> | null = null;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, optionsRef.current.dprMax);
      const rect = wrapperElement.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvasElement.width = Math.floor(width * dpr);
      canvasElement.height = Math.floor(height * dpr);
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = optionsRef.current.imageSmoothingEnabled;
      brain?.setBounds(width, height);
    }

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(wrapperElement);
    window.addEventListener("resize", resize);

    loadSprites(optionsRef.current.animations).then((loadedSprites) => {
      if (!running) return;

      sprites = loadedSprites;
      resize();
      brain = createBrain(width, height, wrapperElement, () => optionsRef.current);
      window.addEventListener("mousemove", brain.handleMouseMove);
      wrapperElement.addEventListener("click", brain.handleClick);

      let lastFrame = performance.now();
      const animate = (timestamp: number) => {
        if (!running || !brain || !sprites) return;

        const delta = timestamp - lastFrame;
        lastFrame = timestamp;
        brain.update(delta);
        const state = brain.state();
        const sprite = sprites[state.animation] ?? sprites.idle;
        if (!sprite) return;

        const frameWidth = sprite.img.naturalWidth / sprite.frames;
        const frameHeight = sprite.img.naturalHeight;
        const drawSize = optionsRef.current.size;

        optionsRef.current.onStateChange?.(state);
        context.clearRect(0, 0, width, height);
        context.save();

        if (state.flipped) {
          context.translate(state.x, 0);
          context.scale(-1, 1);
          context.translate(-state.x, 0);
        }

        context.drawImage(
          sprite.img,
          state.frame * frameWidth,
          0,
          frameWidth,
          frameHeight,
          state.x - drawSize / 2,
          state.y - drawSize / 2,
          drawSize,
          drawSize,
        );
        context.restore();
        animationFrameId = window.requestAnimationFrame(animate);
      };

      animationFrameId = window.requestAnimationFrame(animate);
    }).catch((error: unknown) => {
      if (!running) return;

      const normalizedError =
        error instanceof Error ? error : new Error(String(error));
      optionsRef.current.onLoadError?.(normalizedError);
    });

    return () => {
      running = false;
      window.cancelAnimationFrame(animationFrameId);
      observer?.disconnect();
      window.removeEventListener("resize", resize);

      if (brain) {
        window.removeEventListener("mousemove", brain.handleMouseMove);
        wrapperElement.removeEventListener("click", brain.handleClick);
      }
    };
  }, [animations]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ height: "100%", position: "relative", width: "100%", ...style }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ display: "block", height: "100%", width: "100%", ...canvasStyle }}
      />
    </div>
  );
}

function createBrain(
  width: number,
  height: number,
  wrapper: HTMLElement,
  getOptions: () => BrainOptions,
) {
  const initialOptions = getOptions();
  let boundsWidth = width;
  let boundsHeight = height;
  let animation: keyof AnimatedSpriteAnimations = "idle";
  let x = boundsWidth / 2;
  let y = boundsHeight / 2;
  let targetX = x;
  let targetY = y;
  let frame = 0;
  let accum = 0;
  let idleTimer = randomIdle(initialOptions.idleMinMs, initialOptions.idleMaxMs);
  let mouseX = boundsWidth / 2;
  let mouseY = boundsHeight / 2;
  let flipped = false;

  function pickTarget(currentOptions: BrainOptions) {
    const margin = 100;
    let tx = margin + Math.random() * Math.max(boundsWidth - margin * 2, 1);
    let ty = margin + Math.random() * Math.max(boundsHeight - margin * 2, 1);
    const dx = mouseX - x;
    const dy = mouseY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (
      dist < currentOptions.mouseAttractionRadius &&
      Math.random() < currentOptions.mouseAttractionChance
    ) {
      tx = Math.max(margin, Math.min(boundsWidth - margin, mouseX + (Math.random() - 0.5) * 80));
      ty = Math.max(margin, Math.min(boundsHeight - margin, mouseY + (Math.random() - 0.5) * 80));
    }

    targetX = tx;
    targetY = ty;
  }

  return {
    state: (): BrainState => ({ animation, x, y, frame, flipped }),
    setBounds(nextWidth: number, nextHeight: number) {
      const previousWidth = boundsWidth;
      const previousHeight = boundsHeight;
      boundsWidth = nextWidth;
      boundsHeight = nextHeight;
      x = scalePosition(x, previousWidth, boundsWidth);
      y = scalePosition(y, previousHeight, boundsHeight);
      targetX = scalePosition(targetX, previousWidth, boundsWidth);
      targetY = scalePosition(targetY, previousHeight, boundsHeight);
    },
    update(delta: number) {
      const currentOptions = getOptions();
      const config = currentOptions.animations[animation] ?? currentOptions.animations.idle;
      const frameDuration = 1000 / config.fps;

      if (animation === "action") {
        accum += delta;
        if (accum >= frameDuration) {
          frame += 1;
          accum -= frameDuration;
          if (frame >= config.frames) {
            animation = "idle";
            frame = 0;
            accum = 0;
            idleTimer = randomIdle(currentOptions.idleMinMs, currentOptions.idleMaxMs);
          }
        }
        return;
      }

      accum += delta;
      if (accum >= frameDuration) {
        frame = (frame + 1) % config.frames;
        accum -= frameDuration;
      }

      if (animation === "idle") {
        idleTimer -= delta;
        if (currentOptions.animations.walk && idleTimer <= 0) {
          pickTarget(currentOptions);
          animation = "walk";
          idleTimer = randomIdle(currentOptions.idleMinMs, currentOptions.idleMaxMs);
        }
      } else {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15) {
          animation = "idle";
          frame = 0;
          accum = 0;
        } else {
          const step = currentOptions.speedPxPerSecond * (delta / 1000);
          x += (dx / dist) * step;
          y += (dy / dist) * step;
          flipped = dx < 0;
        }
      }
    },
    handleClick() {
      const currentOptions = getOptions();

      if (
        currentOptions.actionOnClick &&
        currentOptions.animations.action &&
        animation !== "action"
      ) {
        animation = "action";
        frame = 0;
        accum = 0;
      }
    },
    handleMouseMove(event: MouseEvent) {
      const rect = wrapper.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
    },
  };
}

function scalePosition(value: number, previousSize: number, nextSize: number) {
  if (previousSize <= 0) return nextSize / 2;

  return Math.min(nextSize, Math.max(0, (value / previousSize) * nextSize));
}

function randomIdle(min: number, max: number) {
  return min + Math.random() * Math.max(0, max - min);
}

function loadSprites(animations: AnimatedSpriteAnimations) {
  const entries = Object.entries(animations) as Array<
    [keyof AnimatedSpriteAnimations, SpriteAnimation | undefined]
  >;

  return Promise.all(
    entries.flatMap(([key, config]) => {
      if (!config) return [];

      return new Promise<[keyof AnimatedSpriteAnimations, LoadedSprite]>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve([key, { img, frames: config.frames, fps: config.fps }]);
        img.onerror = () => reject(new Error(`Failed to load sprite: ${config.src}`));
        img.src = config.src;
      });
    }),
  ).then(
    (results) =>
      Object.fromEntries(results) as Partial<
        Record<keyof AnimatedSpriteAnimations, LoadedSprite>
      >,
  );
}

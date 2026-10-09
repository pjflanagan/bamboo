"use client";

import { useEffect, useRef } from "react";
import styles from "./motifs.module.css";

/*
 * Ported from bamboo-web's elements/canvas/animation.js: stalks of bezier
 * segments grow from below the bottom edge. Timing matches the original:
 * stalks start in batches of three every 60ms, each grows a segment every 30ms.
 */

const STALK_WIDTH = 20;
const SEGMENT_HEIGHT = 60;
const SEGMENT_GAP = 2;
const BATCH_SIZE = 3;
const BATCH_DELAY = 60;
const SEGMENT_DELAY = 30;

type Point = { x: number; y: number };
type Segment = [Point, Point, Point, Point];
type Stalk = { start: number; segments: Segment[]; drawn: number };

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

function makeSegment({ x, y }: Point, leanRight: boolean): Segment {
  const top = y - SEGMENT_GAP;
  const nextX = leanRight ? x + randomInt(0, 2) : x + randomInt(-2, 0);
  return [
    { x, y: top },
    { x: x + randomInt(-3, 3), y: top - randomInt(16, 24) },
    { x: x + randomInt(-3, 3), y: top - 20 - randomInt(16, 24) },
    { x: nextX, y: top - 40 - randomInt(14, 28) },
  ];
}

function makeStalks(width: number, height: number): Stalk[] {
  const maxSegments = Math.max(3, Math.floor(height / SEGMENT_HEIGHT) - 5);
  const xs: number[] = [];
  for (let x = STALK_WIDTH; x < width; x += STALK_WIDTH * 2 + randomInt(-4, 4)) xs.push(x);
  // Shuffle so stalks don't grow left to right.
  xs.sort(() => Math.random() - 0.5);

  return xs.map((x, i) => {
    const leanRight = Math.random() < 0.5;
    const count = maxSegments + randomInt(-3, 3);
    const segments = [
      makeSegment({ x, y: height + Math.random() * 0.8 * SEGMENT_HEIGHT }, leanRight),
    ];
    for (let s = 1; s < count; s++) segments.push(makeSegment(segments[s - 1][3], leanRight));
    return { start: Math.floor(i / BATCH_SIZE) * BATCH_DELAY, segments, drawn: 0 };
  });
}

type Palette = { fill: string; stroke: string; glow: string; bg: string; neon: boolean };

function readPalette(element: Element): Palette {
  const style = getComputedStyle(element);
  const get = (name: string) => style.getPropertyValue(name).trim();
  return {
    fill: get("--stalk-light"),
    stroke: get("--stalk-stroke"),
    glow: get("--stalk-light"),
    bg: get("--bg"),
    neon: Number(get("--glow-strength")) > 0,
  };
}

function drawSegment(ctx: CanvasRenderingContext2D, [p1, p2, p3, p4]: Segment, palette: Palette) {
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.bezierCurveTo(p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
  };
  ctx.lineWidth = STALK_WIDTH;
  if (palette.neon) {
    // Glowing outline: a wide glowing stroke, hollowed out with the background.
    path();
    ctx.shadowBlur = 12;
    ctx.shadowColor = palette.glow;
    ctx.strokeStyle = palette.glow;
    ctx.stroke();
    path();
    ctx.shadowBlur = 0;
    ctx.lineWidth = STALK_WIDTH - 4;
    ctx.strokeStyle = palette.bg;
    ctx.stroke();
  } else {
    path();
    ctx.strokeStyle = palette.stroke;
    ctx.stroke();
  }
}

type BambooCanvasProps = {
  /** Paint a background: bamboo green in bamboo, the page color in neon. */
  filled?: boolean;
  className?: string;
};

/**
 * Animated bamboo stalks growing up from the bottom. Fills its container;
 * give the container a size. Redraws on resize and theme change, and draws
 * the finished picture at once for prefers-reduced-motion.
 */
export function BambooCanvas({ filled = false, className }: BambooCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let frame = 0;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    const run = () => {
      cancelAnimationFrame(frame);
      const { width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const palette = readPalette(canvas);
      if (filled) {
        ctx.fillStyle = palette.neon ? palette.bg : palette.fill;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      const stalks = makeStalks(width, height);
      const begin = performance.now();
      const step = (now: number) => {
        const elapsed = reducedMotion.matches ? Infinity : now - begin;
        let done = true;
        for (const stalk of stalks) {
          const due = Math.min(
            stalk.segments.length,
            Math.floor((elapsed - stalk.start) / SEGMENT_DELAY) + 1,
          );
          for (; stalk.drawn < due; stalk.drawn++) {
            drawSegment(ctx, stalk.segments[stalk.drawn], palette);
          }
          if (stalk.drawn < stalk.segments.length) done = false;
        }
        if (!done) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    run();
    const resize = new ResizeObserver(run);
    resize.observe(canvas);
    // Theme changes swap the palette: redraw.
    const theme = new MutationObserver(run);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      theme.disconnect();
    };
  }, [filled]);

  return (
    <canvas
      ref={ref}
      className={className ? `${styles.canvas} ${className}` : styles.canvas}
      aria-hidden
    />
  );
}

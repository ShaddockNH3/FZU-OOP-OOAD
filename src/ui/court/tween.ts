export type Easing = (progress: number) => number;

export const linear: Easing = (progress) => progress;
export const easeOutCubic: Easing = (progress) => 1 - (1 - progress) ** 3;
export const easeInOutQuad: Easing = (progress) =>
  progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;

export interface AnimationHandle {
  /** 播完为 true，被取消为 false。 */
  readonly done: Promise<boolean>;
  cancel(): void;
}

/**
 * 极小的补间。
 *
 * 不用 Pixi 的 ticker，也不堆 requestAnimationFrame 的嵌套回调：
 * 一个动画返回一个可取消的 Promise，调用方 `await` 完再走下一步，
 * 取消时整条链自然中断。
 */
export function animate(
  durationMs: number,
  onUpdate: (progress: number) => void,
  ease: Easing = easeOutCubic
): AnimationHandle {
  let frame = 0;
  let settled = false;
  let resolveDone: (value: boolean) => void = () => undefined;

  const done = new Promise<boolean>((resolve) => {
    resolveDone = resolve;
  });

  const finish = (value: boolean): void => {
    if (settled) return;
    settled = true;
    resolveDone(value);
  };

  if (durationMs <= 0) {
    onUpdate(1);
    finish(true);
    return { done, cancel: () => finish(false) };
  }

  const startedAt = performance.now();

  const step = (now: number): void => {
    if (settled) return;
    const progress = Math.min((now - startedAt) / durationMs, 1);
    onUpdate(ease(progress));
    if (progress >= 1) {
      finish(true);
      return;
    }
    frame = requestAnimationFrame(step);
  };

  frame = requestAnimationFrame(step);

  return {
    done,
    cancel: () => {
      cancelAnimationFrame(frame);
      finish(false);
    }
  };
}

/** 可取消的等待。 */
export function wait(durationMs: number): AnimationHandle {
  return animate(durationMs, () => undefined, linear);
}

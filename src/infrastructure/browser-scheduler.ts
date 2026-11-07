import type { Scheduler } from '@/application/ports';

/** 浏览器计时器实现：一行 setTimeout，但对应用层只是 Scheduler。 */
export class BrowserScheduler implements Scheduler {
  after(delayMs: number, task: () => void): () => void {
    const handle = window.setTimeout(task, delayMs);
    return () => window.clearTimeout(handle);
  }
}

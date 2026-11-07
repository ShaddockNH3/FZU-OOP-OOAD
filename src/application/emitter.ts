type Handler<Payload> = (payload: Payload) => void;

/**
 * 极简类型化事件总线（观察者模式）。
 *
 * 代替原来散落在 Game 上的一排 `onXxx?` 回调：订阅返回取消函数，
 * 组件卸载时能干净解绑，不会出现销毁的渲染器还在被回调。
 */
export class Emitter<Events extends object> {
  private readonly handlers = new Map<keyof Events, Set<Handler<never>>>();

  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): () => void {
    let bucket = this.handlers.get(type);
    if (!bucket) {
      bucket = new Set();
      this.handlers.set(type, bucket);
    }
    bucket.add(handler as Handler<never>);
    return () => {
      bucket?.delete(handler as Handler<never>);
    };
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    const bucket = this.handlers.get(type);
    if (!bucket) return;
    for (const handler of [...bucket]) {
      handler(payload as never);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

import { ConduitEvents } from "@theophilusdev/conduit";
import { VynClient } from "../VynClient.js";

export type VynNext = () => void | Promise<void>;

export type VynMiddleware<K extends keyof ConduitEvents> = (
  ...args: [
    ...Parameters<ConduitEvents[K]>,
    next: () => Promise<void>,
    vyn: VynClient,
  ]
) => void | Promise<void>;

export type VynEventHandler<K extends keyof ConduitEvents> = (
  ...args: [...Parameters<ConduitEvents[K]>, vyn: VynClient]
) => void | Promise<void>;

export default class VynEventBuilder<K extends keyof ConduitEvents> {
  public event: K;
  public callback: VynEventHandler<K>;
  private middlewares: VynMiddleware<K>[] = [];

  constructor(
    event: K,
    ...handlers: [...VynMiddleware<K>[], VynEventHandler<K>]
  );
  constructor(event: K, ...args: any[]) {
    this.event = event;
    this.callback = args.pop();
    this.middlewares = args;
  }

  public async execute(
    vyn: VynClient,
    ...args: Parameters<ConduitEvents[K]>
  ): Promise<void> {
    // Conduit injects next as last arg. strip it
    const conduitNext = args[args.length - 1] as unknown;
    const cleanArgs = args.slice(0, -1) as Parameters<ConduitEvents[K]>;
    let index = 0;

    const next = async (): Promise<void> => {
      const middleware = this.middlewares[index++];
      if (middleware) {
        await middleware(...cleanArgs, next, vyn);
      } else {
        await (this.callback as Function)(...cleanArgs, vyn);
        await (conduitNext as Function)();
      }
    };

    await next();
  }
}

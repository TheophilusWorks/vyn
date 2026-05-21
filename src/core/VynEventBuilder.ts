import { ConduitEvents } from "@theophilusdev/conduit";

export type VynNext = () => void | Promise<void>;

export type VynMiddleware<K extends keyof ConduitEvents> = (
  ...args: [...Parameters<ConduitEvents[K]>, next: () => Promise<void>]
) => void | Promise<void>;

export default class VynEventBuilder<K extends keyof ConduitEvents> {
  public event: K;
  public callback: ConduitEvents[K];
  private middlewares: VynMiddleware<K>[] = [];

  constructor(event: K, ...handlers: [...VynMiddleware<K>[], ConduitEvents[K]]);
  constructor(event: K, ...handlers: [...VynMiddleware<K>[], ConduitEvents[K]]);
  constructor(event: K, ...args: any[]) {
    this.event = event;
    this.callback = args.pop();
    this.middlewares = args;
  }

  public async execute(...args: Parameters<ConduitEvents[K]>): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      const middleware = this.middlewares[index++];

      if (middleware) {
        await middleware(...args, next);
      } else {
        (this.callback as Function)(...args);
      }
    };

    await next();
  }
}

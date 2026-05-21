import { VynLogger } from "./core/logger/VynLogger.js";
import { VynConfig } from "./types.js";

export class VynClient {
  private config: Readonly<Partial<VynConfig>>;
  private logger: VynLogger;

  constructor(config: Partial<VynConfig>) {
    this.config = config;
    this.logger = VynLogger.create(true, null, null, []);
  }

  public static create(config: Partial<VynConfig>): VynClient {
    return new VynClient(config);
  }

  public async init(): Promise<void> {
    this.logger.log("Hello, Vyn!", "info");
  }
}

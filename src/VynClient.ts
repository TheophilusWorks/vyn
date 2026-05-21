import { ConduitClient } from "@theophilusdev/conduit";
import { VynLogger } from "./core/logger/VynLogger.js";
import { VynCommandRegistry } from "./core/registry/VynCommandRegistry.js";
import { VynEventRegistry } from "./core/registry/VynEventRegistry.js";
import { VynConfig } from "./types.js";

export class VynClient {
  private client: ConduitClient;
  private config: Readonly<VynConfig>;
  private logger: VynLogger;

  private eventRegistry: VynEventRegistry;
  private commandRegistry: VynCommandRegistry;

  constructor(config: VynConfig) {
    this.client = new ConduitClient(config.conduitOptions);
    this.config = config;
    this.logger = VynLogger.create(true, null, null, []);
    this.commandRegistry = new VynCommandRegistry(
      this.logger,
      this.config as VynConfig,
    );
    this.eventRegistry = new VynEventRegistry(
      this.client,
      this.config as VynConfig,
      this.logger,
    );
  }

  public static create(config: VynConfig): VynClient {
    return new VynClient(config);
  }

  public async init(): Promise<void> {
    try {
      this.logger.log("Initializing VynClient", "info");
      this.eventRegistry.load();
      this.commandRegistry.load();
      this.logger.log("VynClient initialized successfully.", "ok");
    } catch (e) {
      this.logger.fatal(`Failed to initialize VynClient: ${e}`);
    }
  }

  public getCommand(cmdName: string) {
    return this.commandRegistry.getCommand(cmdName);
  }

  public getCommandByAlias(alias: string) {
    return this.commandRegistry.getCommandByAlias(alias);
  }

  public login() {
    this.client.login({ appstate: JSON.parse(this.config.credentials.facebookAppstate) });
  }
}

import { ConduitClient } from "@theophilusdev/conduit";
import { VynLogger } from "./core/logger/VynLogger.js";
import { VynCommandRegistry } from "./core/registry/VynCommandRegistry.js";
import { VynEventRegistry } from "./core/registry/VynEventRegistry.js";
import { VynConfig } from "./types.js";
import { VynDispatcher } from "./core/VynDispatcher.js";
import { VynCLI } from "./VynCLI.js";
import { GlobalFonts } from "@napi-rs/canvas";
import path from "node:path";
import { CACHE_DIR } from "./feature/constants/CACHE_DIR.js";
import { ensureDir } from "./feature/utils/ensureDir.js";

export class VynClient {
  public client: ConduitClient;
  public dispatcher: VynDispatcher;

  public config: Readonly<VynConfig>;
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
      this,
      this.config as VynConfig,
      this.logger,
    );
    this.dispatcher = new VynDispatcher(
      this,
      this.commandRegistry,
      this.config,
    );
  }

  public static create(config: VynConfig): VynClient {
    return new VynClient(config);
  }

  public async init(): Promise<void> {
    try {
      this.logger.log("Initializing VynClient", "info");

      await ensureDir(CACHE_DIR);
      GlobalFonts.registerFromPath(
        path.join(__dirname, "../assets/Monserrat-Bold.ttf"),
        "Monserrat",
      );

      await this.eventRegistry.load();
      await this.commandRegistry.load();
      await this.login();
      this.logger.log("VynClient initialized successfully.", "ok");
      this.logger.collect(this.eventRegistry.getCollection());
      this.logger.collect(this.commandRegistry.getCollection());
      this.logger.printSummary("Vyn");
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

  public getAllCommands() {
    return this.commandRegistry.getAllCommands();
  }

  public getAllCommandsByCategory() {
    return this.commandRegistry.sortCommandsByCategory();
  }

  public async login() {
    await this.client.login({
      appstate: JSON.parse(this.config.credentials.facebookAppstate),
    });

    this.logger.log("Logged in to Facebook successfully.", "ok");

    if (this.config.credentials.cliUID) {
      const cli = new VynCLI(this, this.config);
      cli.start();
    }
  }
}

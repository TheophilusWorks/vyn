import { ConduitClient } from "@theophilusdev/conduit";
import { VynConfig } from "../../types.js";
import { VynLogger } from "../logger/VynLogger.js";
import fs from "fs";
import path from "path";
import { importDefault } from "../../utils/importDefault.js";
import VynEventBuilder from "../VynEventBuilder.js";

export class VynEventRegistry {
  private client: ConduitClient;
  private config: VynConfig;
  private logger: VynLogger;

  constructor(client: ConduitClient, config: VynConfig, logger: VynLogger) {
    this.client = client;
    this.config = config;
    this.logger = logger;
  }

  public async load(): Promise<void> {
    this.logger.log("Loading all Vyn events...", "info");
    let eventFiles = fs
      .readdirSync(this.config.eventsPath)
      .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
    this.logger.log(`Found ${eventFiles.length} event files.`, "ok");

    for (const file of eventFiles) {
      this.logger.log(`Loading event from file ${file}...`, "info");

      let eventPath = path.resolve(this.config.eventsPath, file);
      let eventModule = (await importDefault(
        eventPath,
      )) as VynEventBuilder<any>;
      this.client.on(eventModule.event, (...args) =>
        eventModule.execute(...args),
      );

      this.logger.log(`Loaded event from file ${file}.`, "ok");
    }

    this.logger.log("All Vyn events loaded successfully.", "ok");
  }
}

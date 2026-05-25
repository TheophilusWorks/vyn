import { ConduitClient } from "@theophilusdev/conduit";
import { VynConfig } from "../../types.js";
import { VynLogger } from "../logger/VynLogger.js";
import fs from "fs";
import path from "path";
import { importDefault } from "../../utils/importDefault.js";
import VynEventBuilder from "../VynEventBuilder.js";
import { VynClient } from "../../VynClient.js";
import { VynLoggerNode } from "../logger/VynLoggerNode.js";

export class VynEventRegistry {
  private client: ConduitClient;
  private vyn: VynClient;
  private config: VynConfig;
  private logger: VynLogger;
  private eventNames?: string[] = [];

  constructor(
    client: ConduitClient,
    vyn: VynClient,
    config: VynConfig,
    logger: VynLogger,
  ) {
    this.client = client;
    this.config = config;
    this.logger = logger;
    this.vyn = vyn;
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

      let vyn = this.vyn;
      this.client.on(eventModule.event, (...args) =>
        eventModule.execute(vyn, ...args),
      );
      // lil hack, will delete after collection
      this.eventNames!.push(eventModule.event);

      this.logger.log(`Loaded event from file ${file}.`, "ok");
    }

    this.logger.log("All Vyn events loaded successfully.", "ok");
  }

  public getCollection(): VynLoggerNode {
    let children: VynLoggerNode[] = [];

    for (const name of this.eventNames!) {
      children.push({
        label: name,
        children: [],
      });
    }

    this.eventNames = undefined;

    return {
      label: "Events",
      children,
    };
  }
}

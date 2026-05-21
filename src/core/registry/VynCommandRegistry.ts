import path from "path";
import { VynConfig } from "../../types.js";
import { importDefault } from "../../utils/importDefault.js";
import { VynCommand } from "../command/VynCommand.js";
import { VynLogger } from "../logger/VynLogger.js";
import fs from "fs";

export class VynCommandRegistry {
  private commands: Map<string, VynCommand> = new Map();
  private aliases: Map<string, VynCommand> = new Map();

  constructor(
    private logger: VynLogger,
    private readonly config: VynConfig,
  ) {}

  get commandsLength() {
    return this.commands.size;
  }

  public getCommand(cmdName: string): VynCommand | undefined {
    return this.commands.get(cmdName);
  }

  public getCommandByAlias(alias: string): VynCommand | undefined {
    return this.aliases.get(alias);
  }

  public async load(): Promise<void> {
    this.logger.log("Loading all Vyn command categories...", "info");
    let categories = fs.readdirSync(this.config.commandsPath);
    this.logger.log(`Found ${categories.length} command categories.`, "ok");

    for (const category of categories) {
      this.logger.log(`Loading commands in category ${category}...`, "info");
      let categoryPath = path.resolve(this.config.commandsPath, category);
      let files = fs.readdirSync(path.resolve(categoryPath));

      for (const file of files) {
        let cmdPath = path.resolve(categoryPath, file);
        let cmdModule = (await importDefault(cmdPath)) as VynCommand;

        cmdModule.aliases?.forEach((alias) =>
          this.aliases.set(alias, cmdModule),
        );
        this.commands.set(cmdModule.name, cmdModule);
      }

      this.logger.log(
        `Loaded ${files.length} commands in category ${category}.`,
        "ok",
      );
    }
  }

  public async reload(): Promise<void> {
    this.logger.log("Reloading all Vyn commands...", "info");
    this.clear();
    this.load();
    this.logger.log("All Vyn commands reloaded successfully.", "ok");
  }

  public async clear(): Promise<void> {
    this.commands.clear();
    this.aliases.clear();
  }
}

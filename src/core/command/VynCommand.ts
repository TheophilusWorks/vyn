import { MessageCreatePayload } from "@theophilusdev/conduit";
import { VynArgument, VynCommandShape } from "../../types.js";

export class VynCommand {
  public name: string;
  public description: string;
  public aliases?: string[];
  public argsInfo?: VynArgument[];
  public category?: string;
  public usage?: string;
  public execute: (args: MessageCreatePayload) => Promise<void>;

  constructor(commandShape: VynCommandShape) {
    const { name, description, aliases, argsInfo, category, usage, execute } =
      commandShape;

    this.name = name;
    this.description = description;
    this.aliases = aliases;
    this.argsInfo = argsInfo;
    this.category = category;
    this.usage = usage;
    this.execute = execute;
  }
}

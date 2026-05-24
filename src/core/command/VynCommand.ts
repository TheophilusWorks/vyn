import { ExecutePayload, VynArgument, VynCommandShape } from "../../types.js";

export class VynCommand {
  public name: string;
  public description: string;
  public aliases?: string[];
  public argsInfo?: VynArgument[];
  public category?: string;
  public details?: string | string[];
  public execute: (args: ExecutePayload) => Promise<void>;

  constructor(commandShape: VynCommandShape) {
    const { name, description, aliases, argsInfo, category, details, execute } =
      commandShape;

    this.name = name;
    this.description = description;
    this.aliases = aliases;
    this.argsInfo = argsInfo;
    this.category = category;
    this.details = details;
    this.execute = execute;
  }
}

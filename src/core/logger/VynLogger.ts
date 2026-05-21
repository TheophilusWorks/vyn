import chalk from "chalk";
import gradient from "gradient-string";
import { LogLevel } from "./LogLevel.js";
import { VynLoggerNode } from "./VynLoggerNode.js";

const { gray, whiteBright, blueBright, white } = chalk;

// Level gradients
const cyanBlue = gradient(["#00FFFF", "#0080FF"]);
const rainbowLevel = gradient(["#FFD700", "#FFA500", "#FF1493"]);
const orangeFire = gradient(["#FF4500", "#FFA500", "#FFD700"]);
const bloodRed = gradient(["#8B0000", "#FF0000", "#FF4500"]);

export class VynLogger {
  private enabled: boolean;
  private scopeName: string | null;
  private rootNodes: VynLoggerNode[];
  private root: VynLogger;

  private constructor(
    enabled: boolean,
    scopeName: string | null,
    root: VynLogger | null,
    rootNodes: VynLoggerNode[],
  ) {
    this.enabled = enabled;
    this.scopeName = scopeName;
    this.rootNodes = rootNodes;
    this.root = root ?? this;
  }

  public static create(
    enabled: boolean,
    scopeName: string | null,
    root: VynLogger | null,
    rootNodes: VynLoggerNode[],
  ) {
    return new VynLogger(enabled, scopeName, root, rootNodes);
  }

  public scope(name: string): VynLogger {
    return new VynLogger(this.enabled, name, this.root, this.root.rootNodes);
  }

  public log(msg: string, level: LogLevel = "debug"): void {
    if (!this.enabled) return;
    this.print(msg, level);
  }

  public fatal(msg: string): void {
    this.print(msg, "fatal");
  }

  public collect(node: VynLoggerNode): void {
    this.root.rootNodes.push(node);
  }

  public printSummary(title: string): void {
    const tree = this.renderTree(this.root.rootNodes);
    console.log(`\n${title}\n${tree}`);
  }

  private print(msg: string, level: LogLevel): void {
    const scope = this.formatScopeName(this.scopeName);
    const line = `${this.formatLevel(level)} ${scope}${this.formatMessage(level, msg)}`;

    if (level === "error" || level === "fatal") {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  private formatLevel(level: LogLevel): string {
    let format = (l: string, color: (...args: any[]) => any) =>
      `${white("|")} ${color(l)} ${white("|")}`;
    let color = whiteBright;

    switch (level) {
      case "debug":
        color = cyanBlue as any;
        break;
      case "ok":
        color = rainbowLevel as any;
        break;
      case "info":
        color = blueBright as any;
        break;
      case "warn":
        color = orangeFire as any;
        break;
      case "error":
        color = bloodRed as any;
        break;
    }

    return format(level.toUpperCase(), color);
  }

  private formatScopeName(scope: string | null): string {
    if (!scope) return "";
    return `${gray("[")} ${whiteBright(scope)} ${gray("]")}`;
  }

  private formatMessage(level: LogLevel, msg: string): string {
    switch (level) {
      case "ok":
        return chalk.hex("#00FF00")(msg);
      case "warn":
        return chalk.hex("#FFFF00")(msg);
      case "error":
      case "fatal":
        return chalk.hex("#FF6B6B")(msg);
      case "info":
        return chalk.hex("#B0B0B0")(msg);
      default:
        return msg;
    }
  }

  private renderTree(nodes: VynLoggerNode[], prefix = ""): string {
    let output = "";

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const last = i === nodes.length - 1;
      const connector = last ? chalk.cyan.dim("└──") : chalk.cyan.dim("├──");
      const vertical = chalk.cyan.dim("│") + "   ";
      const childPrefix = prefix + (last ? "    " : vertical);

      output += `${prefix}${connector} ${whiteBright(node.label)}\n`;

      if (node.children && node.children.length > 0) {
        output += this.renderTree(node.children, childPrefix);
      }
    }

    return output;
  }
}

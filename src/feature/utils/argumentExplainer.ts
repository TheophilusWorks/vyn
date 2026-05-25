import { VynCommand } from "../../core/command/VynCommand";

export default function argumentExplainer(
  command: VynCommand,
): Map<string, string[]> {
  let buffer: Map<string, string[]> = new Map();

  for (let arg of command.argsInfo ?? []) {
    let priority = arg.required ? "Required" : "Optional";
    let type: string[] = buffer.get(arg.type) ?? [];

    type.push(`'${arg.name}' - ${arg.description} (${priority})`);

    buffer.set(arg.type, type);
  }

  return buffer;
}

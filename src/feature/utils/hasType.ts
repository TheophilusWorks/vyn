import { VynArgument, VynArgumentBaseType } from "../../types"
;
export function hasType(arg: VynArgument, type: VynArgumentBaseType | "enum"): boolean {
  const t = arg.type as VynArgumentBaseType | VynArgumentBaseType[] | "enum";
  if (Array.isArray(t)) return t.includes(type as VynArgumentBaseType);
  return t === type;
}

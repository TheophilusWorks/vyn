import {
  ConduitClientConfig,
  MessageCreatePayload,
} from "@theophilusdev/conduit";
import { VynClient } from "./VynClient";

export interface VynConfig {
  commandsPath: string;
  eventsPath: string;

  prefix: string | string[];
  adminIDs?: string[];

  credentials: {
    facebookAppstate: string;
    cliUID?: string;
    mongodbURI: string;
  };

  conduitOptions: ConduitClientConfig;
}

export interface VynCommandShape {
  name: string;
  description: string;
  argsInfo?: VynArgument[];
  aliases?: string[];
  details?: string | string[];
  category?: string; // injected by VynCommandRegistry

  execute: (args: ExecutePayload) => Promise<void>;
}

export type VynArgument = VynArgumentMetadata &
  (
    | { type: "argument" | "mentionable" | "boolean" | "number" }
    | { type: "enum"; choices: string[] }
  );

interface VynArgumentMetadata {
  name: string;
  description: string;
  required?: boolean;
}

export interface ArgumentsObject {
  getArgument: (name: string) => string | null;
  getEnum: (name: string) => string | null;
  getMentionable: (name: string) => { id: string; name: string } | null;
  getAllMentionable: () => Record<string, { id: string; name: string }> | null;
  getNumber(name: string): number | null;
  getBoolean(name: string): boolean | null;
  getRaw(): string;
}

export type ExecutePayload = MessageCreatePayload &
  ArgumentsObject & { vyn: VynClient };

export interface MessageFormat {
  header: string;
  subheader: string;
  body: string | string[];
  footer: string | string[];
}

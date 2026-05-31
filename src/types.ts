import {
  ConduitClientConfig,
  Message,
  MessageCreatePayload,
  MessageRespondPayload,
} from "@theophilusdev/conduit";
import { VynClient } from "./VynClient";

export interface VynConfig {
  commandsPath: string;
  eventsPath: string;

  prefix: string;
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
  adminOnly?: boolean;
  category?: string; // injected by VynCommandRegistry

  execute: (args: ExecutePayload) => Promise<void>;
}

export type VynArgumentBaseType = "argument" | "mentionable" | "boolean" | "number" | "replyable";

export type VynArgument = VynArgumentMetadata &
  (
    | { type: VynArgumentBaseType | VynArgumentBaseType[] }
    | { type: "enum" | ["enum"]; choices: string[] }
  );

interface VynArgumentMetadata {
  name: string;
  description: string;
  required?: boolean;
}

export interface ArgumentsObject {
  getArgument: (name: string) => string | null;
  getEnum: (name: string) => string | null;
  getReplyable: (name: string) => Message | null;
  getMentionable: (name: string) => { id: string; name: string } | null;
  getAllMentionable: () => Record<string, { id: string; name: string }> | null;
  getNumber(name: string): number | null;
  getBoolean(name: string): boolean;
  getRaw(): string;
}

export type ExecutePayload = ContextPayload &
  ArgumentsObject & { vyn: VynClient; prefix: string };

export interface MessageFormat {
  header: string;
  subheader: string;
  body: string | string[];
  footer: string | string[];
}

// specifically for command handler, not for events in general
export type ContextPayload = MessageCreatePayload | MessageRespondPayload;


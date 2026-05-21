import {
  ConduitClientConfig,
  MessageCreatePayload,
} from "@theophilusdev/conduit";

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
  usage?: string;
  category?: string; // injected by VynCommandRegistry

  execute: (args: ExecutePayload) => Promise<void>;
}

export interface VynArgument {
  type: "argument" | "mentionable";
  name: string;
  description?: string;
  required?: boolean;
}

export interface ArgumentsObject {
  getArgument: (name: string) => string | null;
  getMentionable: (index: number) => { id: string; name: string } | null;
  getAllMentionable: (index: number) => Record<string, string>;
}

export type ExecutePayload = MessageCreatePayload & ArgumentsObject;

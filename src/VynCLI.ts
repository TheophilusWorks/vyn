import readline from "readline";
import {
  MessageCreatePayload,
  MessageRespondPayload,
} from "@theophilusdev/conduit";
import { VynClient } from "./VynClient.js";
import { VynConfig } from "./types.js";

interface StoredMessage {
  id: number;
  body: string;
  messageID: string;
}

export class VynCLI {
  private rl: readline.Interface;
  private config: VynConfig;
  private vyn: VynClient;
  private messageCounter: number = 0;
  private sentMessages: Map<number, StoredMessage> = new Map();

  constructor(vyn: VynClient, config: VynConfig) {
    this.vyn = vyn;
    this.config = config;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  public start(): void {
    this.rl.setPrompt("> ");
    this.rl.prompt();

    this.rl.on("line", async (line) => {
      const body = line.trim();
      if (!body) {
        this.rl.prompt();
        return;
      }

      const replyMatch = body.match(/^reply\s+(\d+):\s*(.+)$/);

      if (replyMatch) {
        const replyId = parseInt(replyMatch[1]);
        const replyBody = replyMatch[2];
        await this.handleReply(replyId, replyBody);
      } else {
        await this.handleMessage(body);
      }

      this.rl.prompt();
    });

    this.rl.on("close", () => process.exit(0));
  }

  private async handleMessage(body: string): Promise<void> {
    const fakeCtx = this.buildMessageCreatePayload(body);
    this.vyn.client.emit("message:create", fakeCtx);
  }

  private async handleReply(replyId: number, body: string): Promise<void> {
    const stored = this.sentMessages.get(replyId);
    if (!stored) {
      process.stdout.write(`[cli] no message with id ${replyId}\n`);
      return;
    }

    const fakeCtx = this.buildMessageRespondPayload(body, stored);
    this.vyn.client.emit("message:respond", fakeCtx);
  }

  private storeSentMessage(body: string): StoredMessage {
    const id = this.messageCounter++;
    const messageID = `cli-sent-${Date.now()}-${id}`;
    const stored: StoredMessage = { id, body, messageID };
    this.sentMessages.set(id, stored);
    process.stdout.write(`[reply id: ${id}]\n`);
    return stored;
  }

  private buildReplyable() {
    return {
      send: async (msg: any) => {
        const body =
          typeof msg === "string" ? msg : (msg.body ?? JSON.stringify(msg));
        process.stdout.write(`[vyn] ${body}\n`);
        return this.storeSentMessage(body);
      },
      reply: async (msg: any) => {
        const body =
          typeof msg === "string" ? msg : (msg.body ?? JSON.stringify(msg));
        process.stdout.write(`[vyn] ${body}\n`);
        return this.storeSentMessage(body);
      },
      react: async (_emoji: string) => {},
      shareContact: async (message: string, uid: string) => {
        process.stdout.write(
          `[vyn] ${message}\n[shared contact of ${uid} can't be displayed in CLI]\n`,
        );
      },
      collect: () => {
        throw new Error("collect() not supported in CLI");
      },
      waitResponse: () => {
        throw new Error("waitResponse() not supported in CLI");
      },
    };
  }

  private buildMessageCreatePayload(body: string): MessageCreatePayload {
    const cliUID = this.config.credentials.cliUID!;
    const replyable = this.buildReplyable();

    return {
      type: "message:create",
      threadID: "0",
      messageID: `cli-${Date.now()}`,
      senderID: cliUID,
      body,
      attachments: [],
      mentions: {},
      timestamp: Date.now().toString(),
      participantIDs: [cliUID],
      isGroup: false,
      ...replyable,
    } as unknown as MessageCreatePayload;
  }

  private buildMessageRespondPayload(
    body: string,
    replyingTo: StoredMessage,
  ): MessageRespondPayload {
    const cliUID = this.config.credentials.cliUID!;
    const replyable = this.buildReplyable();

    return {
      type: "message:respond",
      threadID: "0",
      messageID: `cli-${Date.now()}`,
      senderID: cliUID,
      body,
      attachments: [],
      mentions: {},
      timestamp: Date.now().toString(),
      participantIDs: [cliUID],
      isGroup: false,
      messageReply: {
        threadID: "0",
        messageID: replyingTo.messageID,
        senderID: "0",
        body: replyingTo.body,
        attachments: [],
        mentions: {},
        timestamp: Date.now().toString(),
        participantIDs: [],
      },
      ...replyable,
    } as unknown as MessageRespondPayload;
  }
}

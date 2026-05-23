import { MessageCreatePayload } from "@theophilusdev/conduit";
import VynEventBuilder from "../../core/VynEventBuilder.js";
import { VynClient } from "../../VynClient.js";

export default new VynEventBuilder(
  "message:create",
  async (ctx: MessageCreatePayload, vyn: VynClient) => {
    try {
      await vyn.dispatcher.dispatch(ctx);
    } catch (e) {
      let err = e as Error;
      ctx.reply(`Error executing command: ${err.message}`);
    }
  },
);

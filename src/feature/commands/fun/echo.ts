import { VynCommand } from "../../../core/command/VynCommand.js";

export default new VynCommand({
  name: "echo",
  description: "Echoes the message back to the user",
  argsInfo: [
    {
      type: "argument",
      name: "msg",
      description: "The message to echo back",
      required: true
    }
  ],

  execute: async (ctx) => {
    await ctx.reply(ctx.getArgument("msg")!);
  },
});


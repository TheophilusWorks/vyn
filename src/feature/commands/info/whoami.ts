import { VynCommand } from "../../../core/command/VynCommand.js";
import { capitalize } from "../../utils/capitalize.js";
import { formatMsg } from "../../utils/formatMsg.js";

export default new VynCommand({
  name: "whoami",
  description: "Replies to you with your user info",

  execute: async (ctx) => {
    let userInfo = (await ctx.vyn.client.users.getInfo(ctx.senderID))[
      ctx.senderID
    ];

    await ctx.shareContact(
      formatMsg({
        header: "Info",
        subheader: "Your user information",
        body: [
          `You are ${userInfo.name} (${ctx.senderID})`,
          `Your gender: ${capitalize(userInfo.gender)}`,
        ],
        footer: [
          `Hello, ${userInfo.gender == "MALE" ? "Handsome" : "Beautiful"} ;)`,
          userInfo.isFriend ? "We're friends!" : "",
        ],
      }),
      ctx.senderID,
    );
  },
});

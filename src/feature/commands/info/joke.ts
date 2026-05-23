import { VynCommand } from "../../../core/command/VynCommand.js";

export default new VynCommand({
  name: "Joke",
  description: "Sends a random joke from the joke API",
  argsInfo: [
    {
      type: "argument",
      name: "category",
      description: "The category of the joke",
    },
  ],

  execute: async (ctx) => {},
});

import { VynCommand } from "../../../core/command/VynCommand.js";

export default new VynCommand({
  name: "joke",
  description: "Sends a random joke from the joke API",
  details: [
    "To list all joke categories: `%joke list-cat:true`",
    "To get a joke from a specific category: `%joke cat:<category>`",
  ],
  argsInfo: [
    {
      type: "enum",
      name: "cat",
      description: "The category of the joke",
      choices: ["programming", "misc", "dark", "pun", "spooky", "christmas"],
    },
    {
      type: "boolean",
      name: "list-cat",
      description: "The category of the joke",
    },
  ],

  execute: async (ctx) => {
    let listCategories = ctx.getBoolean("list-cat");
    let category = ctx.getEnum("cat");
  },
});

import { VynCommand } from "../../../core/command/VynCommand.js";
import { formatMsg } from "../../utils/formatMsg.js";
import { ExecutePayload } from "../../../types.js";
import { capitalize } from "../../utils/capitalize.js";
import axios from "axios";

interface JokeResponse {
  error: boolean;
  category: string;
  type: string;
  joke?: string;
  setup?: string;
  delivery?: string;
  flags: {
    nsfw: boolean;
    religious: boolean;
    political: boolean;
    racist: boolean;
    sexist: boolean;
    explicit: boolean;
  };
  safe: boolean;
  id: number;
  lang: string;
}

export default new VynCommand({
  name: "joke",
  description: "Sends a random joke from the JokeAPI",
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
    let category = capitalize(ctx.getEnum("cat") ?? "any");

    if (listCategories) {
      return listJokeCategories(ctx);
    }

    let { data, status } = await axios.get(
      `https://v2.jokeapi.dev/joke/${category}`,
    );

    if (status !== 200) {
      throw new Error(
        `Failed to fetch joke from the API. Status code: ${status}`,
      );
    }

    data = data as JokeResponse;

    if (data.error) {
      throw new Error("The JokeAPI returned an error while fetching the joke.");
    }

    if (data.type === "single") {
      singleJoke(ctx, data);
      return;
    } else {
      twoPartJoke(ctx, data);
      return;
    }
  },
});

async function singleJoke(ctx: ExecutePayload, joke: JokeResponse) {
  return ctx.reply(
    formatMsg({
      header: "Here's a joke for you!",
      subheader: joke.category,
      body: joke.joke!,
      footer: formatFlags(joke),
    }),
  );
}

async function twoPartJoke(ctx: ExecutePayload, joke: JokeResponse) {
  let msg = await ctx.reply(
    formatMsg({
      header: "Here's a joke for you!",
      subheader: joke.category,
      body: [joke.setup!, "Reply to this message to see the punchline"],
      footer: formatFlags(joke),
    }),
  );

  let res = await msg.waitResponse({
    filter: (msg) => msg.senderID === ctx.senderID,
    timeout: 60000,
  });

  return res.reply(joke.delivery!);
}

function formatFlags(joke: JokeResponse): string {
  let enabledFlags = [];

  for (let [flag, enabled] of Object.entries(joke.flags)) {
    if (!enabled) continue;
    enabledFlags.push(capitalize(flag));
  }

  return enabledFlags.length > 0
    ? `Flags: ${enabledFlags.join(" | ")}`
    : "No flags";
}

function listJokeCategories(ctx: ExecutePayload) {
  ctx.reply(
    formatMsg({
      header: "Joke Categories",
      subheader: "Here are the available joke categories:",
      body: ["christmas", "Dark", "Misc", "Programming", "Pun", "Spooky"],
      footer:
        "Type `%joke cat:<category>` to get a joke from a specific category.",
    }),
  );
}

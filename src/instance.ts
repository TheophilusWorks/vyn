import "dotenv/config";
import { VynClient } from "./VynClient.js";

export const instance = VynClient.create({
  commandsPath: "./dist/feature/commands",
  eventsPath: "./dist/feature/events",

  prefix: "%",
  adminIDs: ["61552922702107", "61589137263233"],

  conduitOptions: {
    listenEvents: true,
    logLevel: "silent",
    autoReconnect: true,
    updatePresence: true,
    stopOnSignals: true,
    online: true,

    queue: {
      messageQueue: {
        minDelayMs: 1500,
        maxDelayMs: 2500,
        switchDelayMinMs: 500,
        switchDelayMaxMs: 1000,
      },
    },
    cache: {
      cacheUsers: {
        cleanupIntervalInMS: 60 * 1000, // 1 minute
        ttlInMS: 10 * 60 * 1000, // 10 minutes
      },
    },
  },

  credentials: {
    facebookAppstate: process.env.FACEBOOK_APPSTATE || "",
    cliUID: process.env.CLI_UID || "61552922702107",
    mongodbURI: process.env.MONGODB_URI || "",
  },
});

export interface VynConfig {
  commandsPath: string;
  eventsPath: string;

  admins: { facebookID: string; discordID: string }[];
  enabledPlatforms: VynPlatform[];

  credentials: {
    facebookAppstate: string;
    discordToken: string;
    mongodbURI: string;
  };
}

export type VynPlatform = "messenger" | "discord" | "commandline";

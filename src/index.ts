import { instance } from "./instance.js";

async function main() {
  try {
    await instance.init();
  } catch (error) {
    let e = error as Error;
    console.error(e.message);
  }
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
})

main();

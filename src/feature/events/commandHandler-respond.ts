import VynEventBuilder from "../../core/VynEventBuilder";
import { handler, trycatch } from "./commandHandler-create";

export default new VynEventBuilder("message:respond", trycatch, handler);

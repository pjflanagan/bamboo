import { createLocalStore } from "./localStore";

/** What's in the reading tool, kept between visits. */
export const readerTextStore = createLocalStore<string>(
  "bamboo-reader-text",
  (raw) => (typeof raw === "string" ? raw : ""),
  "你好！歡迎來到方昕中文。",
);

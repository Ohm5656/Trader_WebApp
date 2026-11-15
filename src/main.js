import { deleteTradeImages, saveTradeImages } from "./local-media.js";

window.tradeboardCloud = {
  connect() {},
  queueSync() {},
  async uploadImages(tradeDate, files) { return saveTradeImages(tradeDate, files); },
  async clearCloud(trades) { await deleteTradeImages(trades.flatMap((trade) => trade.images || [])); },
};

await import("../app.js");

import { Router } from "express";
import { asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { actions } from "../../db/schema.js";
import { Util } from "../../util/generalUtil/util.js";

export const actionRouter = Router();

const actionsCache = Util.createStaticCache(() =>
  db
    .select()
    .from(actions)
    .orderBy(asc(actions.name)),
);

actionRouter.get("/actions", async (_req, res) => {
  const data = await actionsCache.get();

  res.set("Cache-Control", "public, max-age=3600");
  res.status(200).json(data);
});

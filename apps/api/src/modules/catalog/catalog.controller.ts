import type { RequestHandler } from "express";
import * as catalogService from "./catalog.service.js";

export const getRecipes: RequestHandler = async (_req, res) => {
    res.status(200).json(await catalogService.getRecipesByCategory());
};

export const getGatheringGroups: RequestHandler = async (_req, res) => {
    res.status(200).json(await catalogService.getGatheringGroups());
};

export const getActions: RequestHandler = async (_req, res) => {
    const data = await catalogService.getActions();

    res.set("Cache-Control", "no-cache");
    res.status(200).json(data);
};

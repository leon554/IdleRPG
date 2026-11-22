import type { RequestHandler } from "express";
import { getAuthUser } from "../../middleware/requireAuth.js";
import { withBody } from "../../validation/validate.js";
import { craftTaskSchema, gatherTaskSchema } from "./task.schemas.js";
import * as taskService from "./task.service.js";

export const createGatherTask = withBody(gatherTaskSchema, async (body, _req, res) => {
    const user = getAuthUser(res);
    const task = await taskService.createTask(
        user.id,
        { type: "gather", gatheringGroupId: body.gatheringGroupId },
        body.actionIds,
    );
    res.status(201).json(task);
});

export const createCraftTask = withBody(craftTaskSchema, async (body, _req, res) => {
    const user = getAuthUser(res);
    const task = await taskService.createTask(
        user.id,
        { type: "craft", recipeId: body.recipeId, craftCount: body.craftCount, inputs: body.inputs ?? [] },
        body.actionIds,
    );
    res.status(201).json(task);
});

export const getActiveTask: RequestHandler = async (_req, res) => {
    const user = getAuthUser(res);
    const task = await taskService.getActiveTask(user.id);
    res.status(200).json(task);
};

export const claimTask: RequestHandler = async (_req, res) => {
    const user = getAuthUser(res);
    res.status(200).json(await taskService.claimTask(user.id));
};

export const stopTask: RequestHandler = async (_req, res) => {
    const user = getAuthUser(res);
    res.status(200).json(await taskService.stopTask(user.id));
};

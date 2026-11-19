import { Router } from "express";
import { getAuthUser, requireAuth } from "../../middleware/requireAuth.js";
import { getActiveTask } from "../../services/active-task.service.js";


export const activeTaskRouter = Router()

activeTaskRouter.get("/tasks/active-task", requireAuth, async (_req, res) => {
    const user = getAuthUser(res);
    const activeTask = await getActiveTask(user.id);

    if (!activeTask) return res.status(404).json({ error: "You have no active task" });
    return res.status(200).json(activeTask);
});

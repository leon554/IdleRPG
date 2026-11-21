import { Router } from "express";
import { getAuthUser, requireAuth } from "../../middleware/requireAuth.js";
import { getActiveTask } from "../../services/active-task.service.js";
import { notFound } from "../../shared/errors.js";


export const activeTaskRouter = Router()

activeTaskRouter.get("/tasks/active-task", requireAuth, async (_req, res) => {
    const user = getAuthUser(res);
    const activeTask = await getActiveTask(user.id);

    if (!activeTask) throw notFound("no_active_task");

    if(activeTask.taskType == "gathering"){
        
    }
    
    return res.status(200).json(activeTask);
});

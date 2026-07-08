import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import appsRouter from "./apps";
import reviewsRouter from "./reviews";
import submissionsRouter from "./submissions";
import logbookRouter from "./logbook";
import feedbackRouter from "./feedback";
import adminRouter from "./admin";
import notificationsRouter from "./notifications";
import usersRouter from "./users";
import setupRouter from "./setup";
import pushRouter from "./push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(appsRouter);
router.use(reviewsRouter);
router.use(submissionsRouter);
router.use(logbookRouter);
router.use(feedbackRouter);
router.use(adminRouter);
router.use(notificationsRouter);
router.use(usersRouter);
router.use(setupRouter);
router.use(pushRouter);

export default router;

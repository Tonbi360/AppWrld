import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appsRouter from "./apps";
import reviewsRouter from "./reviews";
import submissionsRouter from "./submissions";
import logbookRouter from "./logbook";
import feedbackRouter from "./feedback";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(appsRouter);
router.use(reviewsRouter);
router.use(submissionsRouter);
router.use(logbookRouter);
router.use(feedbackRouter);
router.use(adminRouter);

export default router;

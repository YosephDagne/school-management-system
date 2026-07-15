import { Router } from "express";
import { LibraryController } from "./library.controller";
import { authMiddleware, requirePermission } from "../../middleware/auth";

const router = Router();

router.use(authMiddleware as any);

router.post("/books", requirePermission("manage_library") as any, LibraryController.createBook as any);
router.get("/books", LibraryController.getBooks as any);
router.post("/borrow", requirePermission("manage_library") as any, LibraryController.borrowBook as any);
router.post("/return/:borrowingId", requirePermission("manage_library") as any, LibraryController.returnBook as any);
router.get("/borrowings/active", requirePermission("manage_library") as any, LibraryController.getActiveBorrowings as any);

export default router;

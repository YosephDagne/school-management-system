import { Router } from "express";
import { LibraryController } from "./library.controller";
import { authMiddleware, hasPermission } from "../../middleware/auth";

const router = Router();
router.use(authMiddleware as any);

router.post("/books", hasPermission("library.create") as any, LibraryController.createBook as any);
router.get("/books", hasPermission("library.read") as any, LibraryController.getBooks as any);
router.put("/books/:id", hasPermission("library.update") as any, LibraryController.updateBook as any);
router.delete("/books/:id", hasPermission("library.delete") as any, LibraryController.deleteBook as any);
router.post("/borrow", hasPermission("library.create") as any, LibraryController.borrowBook as any);
router.post("/return/:borrowingId", hasPermission("library.update") as any, LibraryController.returnBook as any);
router.get("/borrowings/active", hasPermission("library.read") as any, LibraryController.getActiveBorrowings as any);

export default router;

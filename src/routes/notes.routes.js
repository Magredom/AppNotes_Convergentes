import { Router } from "express";

import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/notes.controller.js";

import { authRequired } from "../middlewares/validateToken.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { createNoteSchema } from "../schemas/note.schema.js";

const router = Router();

// Obtener todas las notas del usuario autenticado
router.get("/notes", authRequired, getNotes);

// Obtener una nota
router.get("/notes/:id", authRequired, getNote);

// Crear una nota
router.post(
  "/notes",
  authRequired,
  validateSchema(createNoteSchema),
  createNote
);

// Actualizar una nota
router.put(
  "/notes/:id",
  authRequired,
  updateNote
);

// Eliminar una nota
router.delete(
  "/notes/:id",
  authRequired,
  deleteNote
);

export default router;

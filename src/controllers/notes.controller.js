import Note from "../models/note.models.js";

// =====================================================
// OBTENER TODAS LAS NOTAS DEL USUARIO
// =====================================================
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(notes);
  } catch (error) {
    console.error("Error obteniendo notas:", error);

    res.status(500).json({
      message: "Error al obtener las notas",
    });
  }
};

// =====================================================
// CREAR NOTA
// =====================================================
export const createNote = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
    } = req.body;

    const newNote = new Note({
      title,
      description,
      date,
      user: req.user.id,
    });

    const savedNote = await newNote.save();

    console.log("Nota guardada:", savedNote);

    res.status(201).json(savedNote);
  } catch (error) {
    console.error("Error creando nota:", error);

    res.status(500).json({
      message: "Error al crear la nota",
    });
  }
};

// =====================================================
// OBTENER UNA NOTA
// =====================================================
export const getNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        message: "Nota no encontrada",
      });
    }

    res.status(200).json(note);
  } catch (error) {
    console.error("Error obteniendo nota:", error);

    res.status(500).json({
      message: "Error al obtener la nota",
    });
  }
};

// =====================================================
// ACTUALIZAR NOTA
// =====================================================
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      req.body,
      {
        new: true,
      }
    );

    if (!note) {
      return res.status(404).json({
        message: "Nota no encontrada",
      });
    }

    res.status(200).json(note);
  } catch (error) {
    console.error("Error actualizando nota:", error);

    res.status(500).json({
      message: "Error al actualizar la nota",
    });
  }
};

// =====================================================
// ELIMINAR NOTA
// =====================================================
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        message: "Nota no encontrada",
      });
    }

    return res.sendStatus(204);
  } catch (error) {
    console.error("Error eliminando nota:", error);

    res.status(500).json({
      message: "Error al eliminar la nota",
    });
  }
};

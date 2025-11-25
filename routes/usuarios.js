

import express from "express";
import db from "../db.js";
import bcrypt from "bcryptjs";

const router = express.Router();

/* ---------------- USUARIOS ---------------- */

/* ---------- Obtener todos los usuarios ---------- */
router.get("/", (req, res) => {
  db.query("SELECT * FROM usuarios", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

/* ---------- Obtener usuario por ID ---------- */
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM usuarios WHERE id_usuario=?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err });

    if (results.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(results[0]);
  });
});

/* ---------- Crear usuario ---------- */
router.post("/", async (req, res) => {
  const { nombres, apellido_paterno, apellido_materno, telefono, password } =
    req.body;

  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO usuarios (nombres, apellido_paterno, apellido_materno, telefono, password) VALUES (?, ?, ?, ?, ?)",
    [
      nombres,
      apellido_paterno,
      apellido_materno,
      telefono,
      hashedPassword,
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({
        id_usuario: result.insertId,
        nombres,
        apellido_paterno,
        apellido_materno,
        telefono,
      });
    }
  );
});

/* ---------- Actualizar usuario (con contraseña opcional) ---------- */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    nombres,
    apellido_paterno,
    apellido_materno,
    telefono,
    password,
  } = req.body;

  let hashedPassword = null;

  // Si envía contraseña, la actualizamos también
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  let sql = `
    UPDATE usuarios
    SET nombres=?, apellido_paterno=?, apellido_materno=?, telefono=?
  `;

  const params = [nombres, apellido_paterno, apellido_materno, telefono];

  if (password) {
    sql += `, password=?`;
    params.push(hashedPassword);
  }

  sql += ` WHERE id_usuario=?`;
  params.push(id);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Error al actualizar usuario:", err);
      return res.status(500).json({ error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Usuario actualizado correctamente",
      usuario: {
        id_usuario: id,
        nombres,
        apellido_paterno,
        apellido_materno,
        telefono,
      },
    });
  });
});

/* ---------- Eliminar usuario ---------- */
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM usuarios WHERE id_usuario=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado" });
  });
});

router.post("/guardar-token", (req, res) => {
  const { id_usuario, expo_push_token } = req.body;

  if (!id_usuario || !expo_push_token) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const sql = `
    UPDATE usuarios 
    SET expo_push_token = ?
    WHERE id_usuario = ?
  `;

  db.query(sql, [expo_push_token, id_usuario], (err, result) => {
    if (err) {
      console.error("❌ Error guardando token expo:", err);
      return res.status(500).json({ error: "Error al guardar token" });
    }

    res.json({ message: "Token guardado correctamente" });
  });
});


export default router;

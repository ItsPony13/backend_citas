import express from "express";
import db from "../db.js";

const router = express.Router();

// ==============================
// 🔹 Obtener todos los servicios de un negocio
// ==============================
router.get("/negocio/:id_negocio", (req, res) => {
  const { id_negocio } = req.params;

  const sql = `
    SELECT id_servicio, nombre_servicio, precio, duracion
    FROM servicios
    WHERE id_negocio = ?
  `;

  db.query(sql, [id_negocio], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ servicios: results });
  });
});
// ==============================
// 🔹 Obtener servicios disponibles según fecha y hora
// ==============================
router.get("/disponibles/:id_negocio", (req, res) => {
  const { id_negocio } = req.params;
  const { fecha, hora } = req.query;

  if (!fecha || !hora) {
    return res.status(400).json({ error: "Se requiere fecha y hora" });
  }

  const sql = `
    SELECT s.id_servicio, s.nombre_servicio, s.precio, s.duracion
    FROM servicios s
    WHERE s.id_negocio = ?
      AND s.id_servicio NOT IN (
        SELECT ID_servicio
        FROM citas
        WHERE ID_negocio = ?
          AND fecha = ?
          AND hora = ?
      )
  `;

  db.query(sql, [id_negocio, id_negocio, fecha, hora], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ servicios: results });
  });
});

// ==============================
// 🔹 Crear un servicio
// ==============================
router.post("/", (req, res) => {
  const { id_negocio, nombre_servicio, precio, duracion } = req.body;

  if (!id_negocio || !nombre_servicio || !precio || !duracion) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const sql = `
    INSERT INTO servicios (id_negocio, nombre_servicio, precio, duracion)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [id_negocio, nombre_servicio, precio, duracion], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Servicio creado", id_servicio: result.insertId });
  });
});

// ==============================
// 🔹 Actualizar un servicio
// ==============================
router.put("/:id_servicio", (req, res) => {
  const { id_servicio } = req.params;
  const { nombre_servicio, precio, duracion } = req.body;

  const sql = `
    UPDATE servicios
    SET nombre_servicio = ?, precio = ?, duracion = ?
    WHERE id_servicio = ?
  `;

  db.query(sql, [nombre_servicio, precio, duracion, id_servicio], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Servicio actualizado" });
  });
});

// ==============================
// 🔹 Eliminar un servicio
// ==============================
router.delete("/:id_servicio", (req, res) => {
  const { id_servicio } = req.params;

  const sql = `DELETE FROM servicios WHERE id_servicio = ?`;

  db.query(sql, [id_servicio], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Servicio eliminado" });
  });
});

export default router;
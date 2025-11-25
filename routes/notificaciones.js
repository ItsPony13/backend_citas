import express from "express";
import db from "../db.js";

const router = express.Router();

// Registrar o actualizar el push token del negocio
router.post("/registrar-token", (req, res) => {
  const { id_negocio, expo_push_token } = req.body;

  if (!id_negocio || !expo_push_token) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const sql = `
    UPDATE negocios 
    SET expo_push_token = ?
    WHERE id_negocio = ?
  `;

  db.query(sql, [expo_push_token, id_negocio], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    res.json({ message: "Token registrado correctamente" });
  });
});

export default router;

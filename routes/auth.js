import express from "express";
import connection from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

/* -----------------------------------------
   🔐 REGISTER
-------------------------------------------- */
router.post("/register", (req, res) => {
  const { nombres, apellido_paterno, apellido_materno, telefono, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  connection.query(
    "INSERT INTO usuarios (nombres, apellido_paterno, apellido_materno, telefono, password) VALUES (?, ?, ?, ?, ?)",
    [nombres, apellido_paterno, apellido_materno, telefono, hashedPassword],
    (err, result) => {
      if (err) {
        console.error("❌ Error al registrar usuario:", err);
        return res.status(500).json({ error: "Error en el servidor" });
      }

      res.json({ 
        message: "Usuario registrado exitosamente",
        id_usuario: result.insertId
      });
    }
  );
});

/* -----------------------------------------
   🔐 LOGIN
-------------------------------------------- */
router.post("/login", (req, res) => {
  const { telefono, password } = req.body;

  connection.query(
    "SELECT * FROM usuarios WHERE telefono = ? LIMIT 1",
    [telefono],
    async (err, results) => {
      if (err) {
        console.error("❌ Error al buscar usuario:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: "Usuario no encontrado" });
      }

      const user = results[0];

      // 🔎 Verificar contraseña
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }

      // 🔐 Generar token con id_usuario correcto
      const token = jwt.sign(
        { id_usuario: user.id_usuario, telefono: user.telefono },
        "secretKey",
        { expiresIn: "1h" }
      );

      // ⬅⬅⬅ AQUI ESTABA TU ERROR: ahora enviamos user completo
      res.json({
        message: "Login exitoso",
        token,
        user: {
          id_usuario: user.id_usuario,
          nombres: user.nombres,
          apellido_paterno: user.apellido_paterno,
          apellido_materno: user.apellido_materno,
          telefono: user.telefono
        }
      });
    }
  );
});

export default router;

import express from "express";
import connection from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// Obtener todos los negocios
router.get("/", (req, res) => {
  const sql = "SELECT * FROM negocios";

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener negocios:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    res.json({
      message: "Negocios obtenidos correctamente",
      negocios: results,
    });
  });
});
//INICIO DE SESIÓN Y REGISTRO DE NEGOCIOS
router.post("/register", (req, res) => {
  const { nombre_negocio, categoria, direccion, telefono, password, descripcion } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  connection.query(
    "INSERT INTO negocios (nombre_negocio, categoria, direccion, telefono, password, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
    [nombre_negocio, categoria, direccion, telefono, hashedPassword, descripcion],
    (err, result) => {
      if (err) {
        console.error("Error al registrar usuario:", err);
        return res.status(500).json({ error: "Error en el servidor" });
      }

      res.json({
        message: "Usuario registrado exitosamente",
        id_negocio: result.insertId
      });
    }
  );
});

router.post("/login", (req, res) => {
  const { telefono, password } = req.body;

  connection.query(
    "SELECT * FROM negocios WHERE telefono = ? LIMIT 1",
    [telefono],
    async (err, results) => {
      if (err) {
        console.error("Error al buscar usuario:", err);
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
        { id_negocio: user.id_negocio, telefono: user.telefono },
        "secretKey",
        { expiresIn: "1h" }
      );

      //AQUI ESTABA TU ERROR: ahora enviamos user completo
      res.json({
        message: "Login exitoso",
        token,
        user: {
          id_negocio: user.id_negocio,
          nombre_negocio: user.nombre_negocio,
          categoria: user.categoria,
          direccion: user.direccion,
          telefono: user.telefono,
          descripcion: user.descripcion
        }
      });
    }
  );
});

// Actualizar perfil del negocio
router.put("/update/:id_negocio", (req, res) => {
  const { id_negocio } = req.params;
  const { nombre_negocio, categoria, direccion, telefono, descripcion } = req.body;

  const sql = `
    UPDATE negocios 
    SET nombre_negocio = ?, categoria = ?, direccion = ?, telefono = ?, descripcion = ?
    WHERE id_negocio = ?
  `;

  connection.query(
    sql,
    [nombre_negocio, categoria, direccion, telefono, descripcion, id_negocio],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar perfil:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }

      res.json({ message: "Perfil actualizado correctamente" });
    }
  );
});

export default router;

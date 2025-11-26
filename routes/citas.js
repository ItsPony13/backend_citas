import express from "express";
import db from "../db.js";
import { enviarNotificacion } from "../utils/enviarNotificacion.js";

const router = express.Router();
async function enviarPushExpo(expoToken, titulo, cuerpo) {
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: expoToken,
      title: titulo,
      body: cuerpo,
      sound: "default",
    }),
  });
}

// ==============================
// Obtener todas las reservas de un usuario
// ==============================
router.get("/usuario/:ID_usuario", (req, res) => {
  const { ID_usuario } = req.params;

  const sql = `
    SELECT 
      c.id_cita, 
      n.nombre_negocio AS nombre_negocio, 
      s.nombre_servicio AS nombre_servicio, 
      c.fecha, 
      c.hora, 
      c.estado
    FROM citas c
    JOIN negocios n ON c.ID_negocio = n.id_negocio
    JOIN servicios s ON c.ID_servicio = s.id_servicio
    WHERE c.ID_usuario = ?
    ORDER BY c.fecha ASC, c.hora ASC
  `;

  db.query(sql, [ID_usuario], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener citas del usuario:", err);
      return res.status(500).json({ error: err });
    }

    res.json({
      message: "Reservas obtenidas correctamente",
      reservas: results,
    });
  });
});

// ==============================
// Crear una nueva cita
// ==============================
// router.post("/crear", (req, res) => {
//   const { ID_usuario, ID_negocio, ID_servicio, fecha, hora, metodo_notificacion } = req.body;

//   if (!ID_usuario || !ID_negocio || !ID_servicio || !fecha || !hora || !metodo_notificacion) {
//     return res.status(400).json({ error: "Faltan datos obligatorios para crear la cita" });
//   }

//   const sql = `
//     INSERT INTO citas 
//       (ID_usuario, ID_negocio, ID_servicio, fecha, hora, estado, metodo_notificacion, fecha_creacion)
//     VALUES (?, ?, ?, ?, ?, 'pendiente', ?, NOW())
//   `;

//   const values = [ID_usuario, ID_negocio, ID_servicio, fecha, hora, metodo_notificacion];

//   db.query(sql, values, (err, result) => {
//     if (err) {
//       console.error("❌ Error al crear la cita:", err);
//       return res.status(500).json({ error: err });
//     }

//     res.json({
//       message: "Cita creada correctamente",
//       id_cita: result.insertId,
//     });
//   });
// });
router.post("/crear", (req, res) => {
  const { ID_usuario, ID_negocio, ID_servicio, fecha, hora, metodo_notificacion } = req.body;

  if (!ID_usuario || !ID_negocio || !ID_servicio || !fecha || !hora || !metodo_notificacion) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const sql = `
    INSERT INTO citas 
      (ID_usuario, ID_negocio, ID_servicio, fecha, hora, estado, metodo_notificacion, fecha_creacion)
    VALUES (?, ?, ?, ?, ?, 'pendiente', ?, NOW())
  `;

  const values = [ID_usuario, ID_negocio, ID_servicio, fecha, hora, metodo_notificacion];

  db.query(sql, values, async (err, result) => {
    if (err) return res.status(500).json({ error: err });

    // Obtener token del negocio
    db.query(
      "SELECT expo_push_token FROM negocios WHERE id_negocio = ?",
      [ID_negocio],
      async (err, rows) => {
        if (!err && rows.length > 0 && rows[0].expo_push_token) {
          await enviarPushExpo(
            rows[0].expo_push_token,
            "Nueva cita",
            "Tienes una nueva cita pendiente."
          );
        }
      }
    );

    res.json({
      message: "Cita creada correctamente",
      id_cita: result.insertId,
    });
  });
});



// Cancelar una cita
// Cancelar una cita
router.put("/cancelar/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE citas 
    SET estado = 'cancelada'
    WHERE id_cita = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al cancelar cita:", err);
      return res.status(500).json({ error: "Error cancelando cita" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json({ message: "Cita cancelada correctamente" });
  });
});

//COMPLETAR CITAS
// router.put("/completar/:id", (req, res) => {
//   const { id } = req.params;

//   const sql = `
//     UPDATE citas 
//     SET estado = 'completada'
//     WHERE id_cita = ?
//   `;

//   db.query(sql, [id], (err, result) => {
//     if (err) {
//       console.error("❌ Error al completar cita:", err);
//       return res.status(500).json({ error: "Error completando cita" });
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: "Cita no encontrada" });
//     }

//     res.json({ message: "Cita completada correctamente" });
//   });
// });


router.put("/completar/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE citas 
    SET estado = 'completada'
    WHERE id_cita = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Error al completar cita:", err);
      return res.status(500).json({ error: "Error completando cita" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Obtener token del CLIENTE
    const sqlToken = `
      SELECT u.expo_push_token
      FROM citas c
      JOIN usuarios u ON c.ID_usuario = u.id_usuario
      WHERE c.id_cita = ?
    `;

    db.query(sqlToken, [id], async (err, rows) => {
      if (err) return console.log("Error obteniendo token:", err);

      const token = rows[0]?.expo_push_token;

      if (token) {
        await enviarNotificacion(
          token,
          "Cita completada",
          "Tu cita ha sido marcada como completada. ¡Gracias por preferirnos!"
        );
      } else {
        console.log("El usuario no tiene token de notificaciones");
      }
    });

    res.json({ message: "Cita completada correctamente" });
  });
});

router.get("/negocio/:ID_negocio", (req, res) => {
  const { ID_negocio } = req.params;

  const sql = `
    SELECT 
      c.id_cita,
      u.nombres AS cliente,
      s.nombre_servicio AS servicio,
      c.fecha,
      c.hora,
      c.estado
    FROM citas c
    JOIN usuarios u ON c.ID_usuario = u.id_usuario
    JOIN servicios s ON c.ID_servicio = s.id_servicio
    WHERE c.ID_negocio = ?
    ORDER BY c.fecha ASC, c.hora ASC
  `;

  db.query(sql, [ID_negocio], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener citas del negocio:", err);
      return res.status(500).json({ error: err });
    }

    res.json({
      message: "Citas obtenidas correctamente",
      citas: results,
    });
  });
});
// router.put("/completar/:id", (req, res) => {
//   const { id } = req.params;

//   const sql = `
//     UPDATE citas 
//     SET estado = 'completada'
//     WHERE id_cita = ?
//   `;

//   db.query(sql, [id], (err, result) => {
//     if (err) {
//       console.error("❌ Error al completar cita:", err);
//       return res.status(500).json({ error: "Error completando cita" });
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: "Cita no encontrada" });
//     }

//     // Obtener token del CLIENTE
//     const sqlToken = `
//       SELECT u.expo_push_token
//       FROM citas c
//       JOIN usuarios u ON c.ID_usuario = u.id_usuario
//       WHERE c.id_cita = ?
//     `;

//     db.query(sqlToken, [id], async (err, rows) => {
//       if (err) return console.log("❌ Error obteniendo token:", err);

//       const token = rows[0]?.expo_push_token;

//       if (token) {
//         await enviarNotificacion(
//           token,
//           "Cita completada",
//           "Tu cita ha sido marcada como completada. ¡Gracias por preferirnos!"
//         );
//       } else {
//         console.log("⚠ El usuario no tiene token de notificaciones");
//       }
//     });

//     res.json({ message: "Cita completada correctamente" });
//   });
// });


export default router;

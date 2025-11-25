import 'dotenv/config';
import express from "express";
import cors from "cors";
import connection from "./db.js";

// Rutas
// Modificacion de la rama dos
import usuariosRoutes from "./routes/usuarios.js";
import authRoutes from "./routes/auth.js";
import negociosRoutes from "./routes/negocios.js";
import serviciosRoutes from "./routes/servicios.js";
import citasRoutes from "./routes/citas.js";
import notificacionesRoutes from "./routes/notificaciones.js";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => res.send("API del restaurante funcionando"));

// Endpoints
app.use("/usuarios", usuariosRoutes);
app.use("/auth", authRoutes);
app.use("/negocios", negociosRoutes);
app.use("/servicios", serviciosRoutes);
app.use("/citas", citasRoutes);
app.use("/notificaciones", notificacionesRoutes);

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 5000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mi-mongo:27017/tareasdb';

app.use(express.json()); // Habilita la lectura de JSON en el cuerpo (body) de las peticiones

// CORS: permite que el frontend (puerto 8082) consuma la API (puerto 5000)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8082');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Registro de cada petición REST en la consola (visible con docker compose logs)
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') {
    console.log(`${req.method} ${req.originalUrl}`);
  }
  next();
});

// Modelo de tarea en MongoDB (reemplaza la simulación en memoria).
// El _id de Mongo se expone como "id" para mantener el mismo contrato JSON con el frontend
const tareaSchema = new mongoose.Schema({ texto: { type: String, required: true } });
tareaSchema.set('toJSON', {
  transform: (doc, ret) => ({ id: ret._id, texto: ret.texto })
});
const Tarea = mongoose.model('Tarea', tareaSchema);

// [GET] Obtener la lista completa de tareas
app.get('/api/tareas', async (req, res) => {
  const tareas = await Tarea.find();
  res.json(tareas);
});

// [POST] Crear una nueva tarea
app.post('/api/tareas', async (req, res) => {
  const texto = typeof req.body.texto === 'string' ? req.body.texto.trim() : '';
  if (!texto) {
    return res.status(400).json({ mensaje: "El campo 'texto' es obligatorio" });
  }
  const nuevaTarea = await Tarea.create({ texto });
  res.status(201).json(nuevaTarea);
});

// [DELETE] Eliminar TODAS las tareas
// Debe declararse antes de '/api/tareas/:id' para que "limpiar" no se interprete como un ID
app.delete('/api/tareas/limpiar', async (req, res) => {
  await Tarea.deleteMany({});
  res.json({ mensaje: "Lista de tareas vaciada correctamente" });
});

// [DELETE] Eliminar una tarea específica mediante su ID en la URL
app.delete('/api/tareas/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: "ID inválido" });
  }
  await Tarea.findByIdAndDelete(req.params.id);
  res.json({ mensaje: "Tarea eliminada correctamente" });
});

// Express 4 no captura errores de funciones async: este manejador evita que la API se caiga
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ mensaje: "Error interno del servidor" });
});

// Inserta las tareas de ejemplo solo si la colección está vacía
async function sembrarTareas() {
  if (await Tarea.countDocuments() === 0) {
    await Tarea.create([
      { texto: "Aprender conceptos básicos de Docker" },
      { texto: "Desplegar mi primer arquitectura de Microservicios" }
    ]);
  }
}

// Conecta a MongoDB (reintenta mientras el contenedor termina de arrancar) y luego levanta la API
async function iniciar() {
  while (true) {
    try {
      await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 3000 });
      break;
    } catch (err) {
      console.log('Esperando a MongoDB...');
    }
  }
  console.log('Conectado a MongoDB');
  await sembrarTareas();
  app.listen(PORT, () => console.log(`API REST corriendo en el puerto ${PORT}`));
}

iniciar();

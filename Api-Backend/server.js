const express = require('express');
const app = express();
const PORT = 5000;

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

// Simulación de Base de Datos en memoria
let tareas = [
  { id: 1, texto: "Aprender conceptos básicos de Docker" },
  { id: 2, texto: "Desplegar mi primer arquitectura de Microservicios" }
];

// [GET] Obtener la lista completa de tareas
app.get('/api/tareas', (req, res) => {
  res.json(tareas);
});

// [POST] Crear una nueva tarea
app.post('/api/tareas', (req, res) => {
  const nuevaTarea = { id: Date.now(), texto: req.body.texto };
  tareas.push(nuevaTarea);
  res.status(201).json(nuevaTarea);
});

// [DELETE] Eliminar TODAS las tareas 
// Debe declararse antes de '/api/tareas/:id' para que "limpiar" no se interprete como un ID
app.delete('/api/tareas/limpiar', (req, res) => {
  tareas = [];
  res.json({ mensaje: "Lista de tareas vaciada correctamente" });
});

// [DELETE] Eliminar una tarea específica mediante su ID en la URL
app.delete('/api/tareas/:id', (req, res) => {
  const idEliminar = parseInt(req.params.id);
  tareas = tareas.filter(t => t.id !== idEliminar);
  res.json({ mensaje: "Tarea eliminada correctamente" });
});

app.listen(PORT, () => console.log(`API REST corriendo en el puerto ${PORT}`));

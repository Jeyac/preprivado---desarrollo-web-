const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Este arreglo guarda los registros solo mientras el servidor está activo.
const inscripciones = [];

// Contador para que cada registro tenga un id único, aunque se borren registros.
let siguienteId = 1;

// Lógica de cupos (Actividad 5): el taller acepta como máximo 20 personas.
const cuposMaximos = 20;

function hayCupo() {
  return inscripciones.length < cuposMaximos;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Esta ruta ya permite consultar la lista.
app.get("/api/inscripciones", (req, res) => {
  res.json(inscripciones);
});

app.post("/api/inscripciones", (req, res) => {
  const { nombre, correo, telefono, taller, horario } = req.body;

  // Todos los campos deben existir y no estar vacíos.
  const campos = [nombre, correo, telefono, taller, horario];
  if (campos.some((campo) => typeof campo !== "string" || campo.trim() === "")) {
    return res.status(400).json({ mensaje: "Completa todos los campos." });
  }

  // El correo debe tener la forma texto@texto.texto
  const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formatoCorreo.test(correo.trim())) {
    return res.status(400).json({ mensaje: "El correo no tiene un formato válido." });
  }

  // Si ya se llenaron los cupos, no se acepta el registro.
  if (!hayCupo()) {
    return res.status(400).json({ mensaje: "Ya no hay cupos disponibles para el taller." });
  }

  const registro = {
    id: siguienteId++,
    nombre: nombre.trim(),
    correo: correo.trim(),
    telefono: telefono.trim(),
    taller: taller.trim(),
    horario: horario.trim(),
  };
  inscripciones.push(registro);
  res.status(201).json(registro);
});

// Extensión: elimina una inscripción por su id.
app.delete("/api/inscripciones/:id", (req, res) => {
  const id = Number(req.params.id);
  const posicion = inscripciones.findIndex((inscripcion) => inscripcion.id === id);

  if (posicion === -1) {
    return res.status(404).json({ mensaje: "No existe una inscripción con ese id." });
  }

  const [eliminada] = inscripciones.splice(posicion, 1);
  res.json({ mensaje: `Inscripción de ${eliminada.nombre} eliminada.` });
});

app.listen(PORT, () => {
  console.log(`Servidor disponible en http://localhost:${PORT}`);
});

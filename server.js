const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = 3000;

// Lógica de cupos (Actividad 5): el taller acepta como máximo 20 personas.
const cuposMaximos = 20;

// Valores permitidos en cada select. Deben coincidir con los <option> de index.html.
const opciones = {
  taller: [
    "HTML y CSS",
    "Diseño responsive",
    "JavaScript",
    "Node.js y Express",
    "Bases de datos con SQL",
    "Git y GitHub",
  ],
  horario: [
    "Lunes y miércoles, 8:00 a 10:00",
    "Martes y jueves, 8:00 a 10:00",
    "Lunes y miércoles, 14:00 a 16:00",
    "Martes y jueves, 14:00 a 16:00",
    "Lunes y miércoles, 18:00 a 20:00",
    "Viernes, 18:00 a 21:00",
    "Sábado, 9:00 a 12:00",
  ],
  modalidad: ["Presencial", "Virtual", "Híbrida"],
  nivel_experiencia: ["Inicial", "Intermedio", "Avanzado"],
};

const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Dígitos, espacios, guiones y un + opcional al inicio; entre 8 y 15 dígitos en total.
const formatoTelefono = /^\+?[0-9\s-]+$/;

function hayCupo() {
  const { total } = db.prepare("SELECT COUNT(*) AS total FROM inscripciones").get();
  return total < cuposMaximos;
}

// Limpia y valida los datos de POST y PUT. Devuelve { datos } o { error }.
function validarInscripcion(cuerpo) {
  const texto = (valor) => (typeof valor === "string" ? valor.trim() : "");

  const datos = {
    nombre: texto(cuerpo.nombre),
    correo: texto(cuerpo.correo).toLowerCase(),
    telefono: texto(cuerpo.telefono),
    taller: texto(cuerpo.taller),
    horario: texto(cuerpo.horario),
    modalidad: texto(cuerpo.modalidad),
    nivel_experiencia: texto(cuerpo.nivel_experiencia),
  };

  if (Object.values(datos).some((valor) => !valor)) {
    return { error: "Completa todos los campos." };
  }
  if (datos.nombre.length < 2 || datos.nombre.length > 80) {
    return { error: "El nombre debe tener entre 2 y 80 caracteres." };
  }
  if (datos.correo.length > 120 || !formatoCorreo.test(datos.correo)) {
    return { error: "Escribe un correo válido, por ejemplo ana@correo.com." };
  }
  const digitos = datos.telefono.replace(/\D/g, "").length;
  if (!formatoTelefono.test(datos.telefono) || digitos < 8 || digitos > 15) {
    return { error: "El teléfono debe tener entre 8 y 15 dígitos." };
  }
  for (const campo of Object.keys(opciones)) {
    if (!opciones[campo].includes(datos[campo])) {
      return { error: `Selecciona un valor válido en ${campo.replace("_", " de ")}.` };
    }
  }

  return { datos };
}

function leerId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Id inválido." });
    return null;
  }
  return id;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// GET: lee todas las inscripciones guardadas en la base.
app.get("/api/inscripciones", (req, res) => {
  const filas = db
    .prepare(
      "SELECT id, nombre, correo, telefono, taller, horario, " +
        "modalidad, nivel_experiencia, fecha_registro " +
        "FROM inscripciones ORDER BY id DESC"
    )
    .all();
  res.json(filas);
});

// POST: valida y guarda una inscripción nueva.
app.post("/api/inscripciones", (req, res) => {
  const { datos, error } = validarInscripcion(req.body ?? {});
  if (error) {
    return res.status(400).json({ error });
  }
  if (!hayCupo()) {
    return res.status(400).json({ error: "Ya no hay cupos disponibles para el taller." });
  }

  const resultado = db
    .prepare(
      "INSERT INTO inscripciones " +
        "(nombre, correo, telefono, taller, horario, modalidad, nivel_experiencia) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      datos.nombre, datos.correo, datos.telefono,
      datos.taller, datos.horario, datos.modalidad,
      datos.nivel_experiencia
    );

  res.status(201).json({
    mensaje: `Inscripción de ${datos.nombre} guardada.`,
    id: Number(resultado.lastInsertRowid),
  });
});

// PUT: valida y actualiza la inscripción indicada por su id.
app.put("/api/inscripciones/:id", (req, res) => {
  const id = leerId(req, res);
  if (id === null) return;

  const { datos, error } = validarInscripcion(req.body ?? {});
  if (error) {
    return res.status(400).json({ error });
  }

  const resultado = db
    .prepare(
      "UPDATE inscripciones SET nombre = ?, correo = ?, telefono = ?, " +
        "taller = ?, horario = ?, modalidad = ?, nivel_experiencia = ? " +
        "WHERE id = ?"
    )
    .run(
      datos.nombre, datos.correo, datos.telefono,
      datos.taller, datos.horario, datos.modalidad,
      datos.nivel_experiencia, id
    );

  if (resultado.changes === 0) {
    return res.status(404).json({ error: "No se encontró la inscripción." });
  }
  res.json({ mensaje: `Inscripción de ${datos.nombre} actualizada.` });
});

// DELETE: elimina la inscripción indicada por su id.
app.delete("/api/inscripciones/:id", (req, res) => {
  const id = leerId(req, res);
  if (id === null) return;

  const resultado = db.prepare("DELETE FROM inscripciones WHERE id = ?").run(id);

  if (resultado.changes === 0) {
    return res.status(404).json({ error: "No se encontró la inscripción." });
  }
  res.json({ mensaje: "Inscripción eliminada." });
});

// Reportes: conteos calculados directamente desde la base.
app.get("/api/reportes/resumen", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) AS total FROM inscripciones").get().total;

  const contarPor = (columna) =>
    db
      .prepare(
        `SELECT ${columna}, COUNT(*) AS cantidad FROM inscripciones ` +
          `GROUP BY ${columna} ORDER BY cantidad DESC, ${columna}`
      )
      .all();

  res.json({
    total,
    cupos: cuposMaximos,
    porTaller: contarPor("taller"),
    porHorario: contarPor("horario"),
    porModalidad: contarPor("modalidad"),
    porNivel: contarPor("nivel_experiencia"),
  });
});

// Si el cuerpo no es un JSON válido, se responde con un mensaje en JSON y no con HTML.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la solicitud no es un JSON válido." });
  }
  console.error(err);
  res.status(500).json({ error: "Ocurrió un error en el servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor disponible en http://localhost:${PORT}`);
});

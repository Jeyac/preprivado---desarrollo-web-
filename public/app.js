const formulario = document.querySelector("#formulario-registro");
const lista = document.querySelector("#lista-inscripciones");
const mensaje = document.querySelector("#mensaje");
const tituloFormulario = document.querySelector("#titulo-formulario");
const botonGuardar = document.querySelector("#boton-guardar");
const botonCancelar = document.querySelector("#boton-cancelar");

// Guarda el id de la inscripción que se está editando; null significa "crear nueva".
let idEnEdicion = null;

function mostrarMensaje(texto, esError = false) {
  mensaje.textContent = texto;
  mensaje.classList.toggle("mensaje-error", esError);
}

// SQLite guarda CURRENT_TIMESTAMP en hora UTC con el formato "AAAA-MM-DD HH:MM:SS".
function formatearFecha(fechaSqlite) {
  const fecha = new Date(fechaSqlite.replace(" ", "T") + "Z");
  return fecha.toLocaleString("es-GT", { dateStyle: "medium", timeStyle: "short" });
}

async function cargarInscripciones() {
  const respuesta = await fetch("/api/inscripciones");
  const filas = await respuesta.json();

  lista.replaceChildren();

  if (filas.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "vacio";
    vacio.textContent = "Aún no hay inscripciones.";
    lista.append(vacio);
    return;
  }

  // Cada participante se muestra como una tarjeta con botones para editar y eliminar.
  for (const fila of filas) {
    const item = document.createElement("li");
    item.className = "tarjeta";
    item.dataset.id = fila.id;
    if (fila.id === idEnEdicion) item.classList.add("en-edicion");

    const datos = document.createElement("div");
    datos.className = "datos";

    const nombre = document.createElement("p");
    nombre.className = "nombre";
    nombre.textContent = fila.nombre;

    const contacto = document.createElement("p");
    contacto.className = "detalle";
    contacto.textContent = `${fila.correo} · ${fila.telefono}`;

    const taller = document.createElement("p");
    taller.textContent = `${fila.taller} · ${fila.horario}`;

    const etiquetas = document.createElement("p");
    etiquetas.className = "etiquetas";
    for (const valor of [fila.modalidad, fila.nivel_experiencia]) {
      const etiqueta = document.createElement("span");
      etiqueta.className = "chip";
      etiqueta.textContent = valor;
      etiquetas.append(etiqueta);
    }

    const fecha = document.createElement("p");
    fecha.className = "detalle";
    fecha.textContent = `Registrado: ${formatearFecha(fila.fecha_registro)}`;

    datos.append(nombre, contacto, taller, etiquetas, fecha);

    const botones = document.createElement("div");
    botones.className = "botones-item";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "boton-editar";
    editar.textContent = "Editar";
    editar.setAttribute("aria-label", `Editar la inscripción de ${fila.nombre}`);
    editar.addEventListener("click", () => prepararEdicion(fila));

    const borrar = document.createElement("button");
    borrar.type = "button";
    borrar.className = "boton-eliminar";
    borrar.textContent = "Eliminar";
    borrar.setAttribute("aria-label", `Eliminar la inscripción de ${fila.nombre}`);
    borrar.addEventListener("click", () => eliminarInscripcion(fila));

    botones.append(editar, borrar);
    item.append(datos, botones);
    lista.append(item);
  }
}

// Copia los valores de la fila en el formulario y lo cambia a modo edición.
function prepararEdicion(fila) {
  idEnEdicion = fila.id;
  for (const [campo, valor] of Object.entries(fila)) {
    const control = formulario.elements.namedItem(campo);
    if (control) control.value = valor;
  }
  tituloFormulario.textContent = `Editando la inscripción de ${fila.nombre}`;
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.hidden = false;
  mostrarMensaje("");
  marcarEnEdicion();
  formulario.closest("section").scrollIntoView({ behavior: "smooth", block: "start" });
  formulario.elements.namedItem("nombre").focus({ preventScroll: true });
}

function salirDeEdicion() {
  idEnEdicion = null;
  formulario.reset();
  tituloFormulario.textContent = "Datos de inscripción";
  botonGuardar.textContent = "Registrar inscripción";
  botonCancelar.hidden = true;
  marcarEnEdicion();
}

function marcarEnEdicion() {
  for (const item of lista.querySelectorAll("li.tarjeta")) {
    item.classList.toggle("en-edicion", Number(item.dataset.id) === idEnEdicion);
  }
}

async function eliminarInscripcion(fila) {
  if (!confirm(`¿Eliminar la inscripción de ${fila.nombre}?`)) return;

  const respuesta = await fetch(`/api/inscripciones/${fila.id}`, { method: "DELETE" });
  const resultado = await respuesta.json();
  mostrarMensaje(resultado.mensaje || resultado.error, !respuesta.ok);

  if (respuesta.ok) {
    if (fila.id === idEnEdicion) salirDeEdicion();
    await cargarInscripciones();
    await cargarReportes();
  }
}

// El mismo formulario sirve para crear (POST) y para actualizar (PUT).
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!formulario.reportValidity()) return;

  const datos = Object.fromEntries(new FormData(formulario));
  const metodo = idEnEdicion ? "PUT" : "POST";
  const ruta = idEnEdicion ? `/api/inscripciones/${idEnEdicion}` : "/api/inscripciones";

  const respuesta = await fetch(ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const resultado = await respuesta.json();
  mostrarMensaje(resultado.mensaje || resultado.error, !respuesta.ok);

  // Si hubo un error, los datos se quedan en el formulario para corregirlos.
  if (respuesta.ok) {
    salirDeEdicion();
    await cargarInscripciones();
    await cargarReportes();
  }
});

botonCancelar.addEventListener("click", () => {
  salirDeEdicion();
  mostrarMensaje("Edición cancelada.");
});

// Dibuja una barra por cada grupo; el grupo con más inscripciones ocupa el 100 %.
function dibujarBarras(selector, filas, campo) {
  const contenedor = document.querySelector(selector);
  contenedor.replaceChildren();

  if (filas.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "vacio";
    vacio.textContent = "Todavía no hay inscripciones para reportar.";
    contenedor.append(vacio);
    return;
  }

  const mayor = Math.max(...filas.map((fila) => Number(fila.cantidad)), 1);

  for (const fila of filas) {
    const item = document.createElement("li");

    const etiqueta = document.createElement("p");
    etiqueta.className = "barra-etiqueta";
    const nombre = document.createElement("span");
    nombre.textContent = fila[campo];
    const cantidad = document.createElement("strong");
    cantidad.textContent = fila.cantidad;
    etiqueta.append(nombre, cantidad);

    const fondo = document.createElement("div");
    fondo.className = "barra-fondo";
    const barra = document.createElement("div");
    barra.className = "barra";
    barra.style.width = `${(Number(fila.cantidad) / mayor) * 100}%`;
    fondo.append(barra);

    item.append(etiqueta, fondo);
    contenedor.append(item);
  }
}

async function cargarReportes() {
  const respuesta = await fetch("/api/reportes/resumen");
  const datos = await respuesta.json();

  document.querySelector("#total").textContent = datos.total;
  document.querySelector("#cupos").textContent =
    `${datos.cupos - datos.total} de ${datos.cupos} cupos disponibles`;

  dibujarBarras("#reporte-talleres", datos.porTaller, "taller");
  dibujarBarras("#reporte-horarios", datos.porHorario, "horario");
  dibujarBarras("#reporte-modalidades", datos.porModalidad, "modalidad");
  dibujarBarras("#reporte-niveles", datos.porNivel, "nivel_experiencia");
}

cargarInscripciones();
cargarReportes();

const formulario = document.querySelector("#formulario-registro");
const lista = document.querySelector("#lista-inscripciones");
const mensaje = document.querySelector("#mensaje");

async function cargarInscripciones() {
  const respuesta = await fetch("/api/inscripciones");
  const inscripciones = await respuesta.json();

  lista.innerHTML = "";

  if (inscripciones.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "vacio";
    vacio.textContent = "Aún no hay inscripciones.";
    lista.append(vacio);
    return;
  }

  // Cada participante se muestra como una tarjeta con un botón para quitarlo.
  for (const inscripcion of inscripciones) {
    const item = document.createElement("li");
    item.className = "tarjeta";

    const texto = document.createElement("span");
    texto.textContent = `${inscripcion.nombre} · ${inscripcion.taller} · ${inscripcion.horario}`;

    const botonQuitar = document.createElement("button");
    botonQuitar.type = "button";
    botonQuitar.className = "boton-quitar";
    botonQuitar.textContent = "Quitar";
    botonQuitar.setAttribute("aria-label", `Quitar la inscripción de ${inscripcion.nombre}`);
    botonQuitar.addEventListener("click", () => quitarInscripcion(inscripcion.id));

    item.append(texto, botonQuitar);
    lista.append(item);
  }
}

// Extensión: pide al servidor que borre la inscripción y vuelve a dibujar la lista.
async function quitarInscripcion(id) {
  const respuesta = await fetch(`/api/inscripciones/${id}`, { method: "DELETE" });
  const resultado = await respuesta.json();
  mensaje.textContent = resultado.mensaje;
  cargarInscripciones();
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const datos = Object.fromEntries(new FormData(formulario));
  console.log(datos.nombre);

  const respuesta = await fetch("/api/inscripciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    mensaje.textContent = resultado.mensaje;
    return;
  }

  mensaje.textContent = `Inscripción registrada: ${resultado.nombre}.`;
  formulario.reset();
  cargarInscripciones();
});

cargarInscripciones();

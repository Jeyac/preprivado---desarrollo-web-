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

  // Cada participante se muestra como una tarjeta.
  for (const inscripcion of inscripciones) {
    const item = document.createElement("li");
    item.className = "tarjeta";
    item.textContent = `${inscripcion.nombre} · ${inscripcion.taller} · ${inscripcion.horario}`;
    lista.append(item);
  }
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

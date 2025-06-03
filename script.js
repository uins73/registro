document.getElementById("formularioPaciente").addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const edad = parseInt(document.getElementById("edad").value);
  const genero = document.getElementById("genero").value;
  const documento = document.getElementById("documento").value.trim();
  const sintomas = document.getElementById("sintomas").value.trim();
  const gravedad = document.getElementById("gravedad").value;

  if (!nombre || edad <= 0 || !documento || !sintomas) {
    alert("Por favor, completa todos los campos correctamente.");
    return;
  }

  const tabla = document.getElementById("tablaPacientes");
  const fila = document.createElement("tr");

  switch (gravedad) {
    case "leve":
      fila.className = "triaje-leve";
      break;
    case "moderado":
      fila.className = "triaje-moderado";
      break;
    case "urgente":
      fila.className = "triaje-urgente";
      break;
    case "critico":
      fila.className = "triaje-critico";
      break;
  }

  fila.innerHTML = `
    <td>${nombre}</td>
    <td>${edad}</td>
    <td>${genero}</td>
    <td>${documento}</td>
    <td>${sintomas}</td>
    <td>${gravedad.toUpperCase()}</td>
    <td><button class="btn btn-danger btn-sm" onclick="eliminarPaciente(this)">Eliminar</button></td>
  `;

  tabla.appendChild(fila);
  this.reset();
});

function eliminarPaciente(boton) {
  const fila = boton.parentElement.parentElement;
  fila.remove();
}

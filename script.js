document.addEventListener('DOMContentLoaded', () => {
    const pacienteForm = document.getElementById('pacienteForm');
    const tablaPacientesBody = document.getElementById('tablaPacientesBody');

    // Contadores para pacientes por gravedad
    const countCritico = document.getElementById('countCritico');
    const countUrgente = document.getElementById('countUrgente');
    const countModerado = document.getElementById('countModerado');
    const countLeve = document.getElementById('countLeve');

    // Clase Paciente (POO)
    class Paciente {
        constructor(nombre, edad, genero, documento, sintomas, gravedad, tratamiento, medicamentos, examenes) {
            this.id = Date.now() + Math.random(); // Generar ID único
            this.nombre = nombre;
            this.edad = edad;
            this.genero = genero;
            this.documento = documento;
            this.sintomas = sintomas;
            // Asegurarse de que la gravedad se guarda en minúsculas para coincidir con los values del select
            this.gravedad = gravedad.toLowerCase();
            this.tratamiento = tratamiento;
            this.medicamentos = medicamentos;
            this.examenes = examenes;
        }
    }

    // Array para almacenar los pacientes
    let pacientes = [];

    // Pacientes predeterminados (ajustados a valores en minúsculas)
    const pacientesPredeterminados = [
        new Paciente('Juan Pérez', 35, 'Hombre', '12345678', 'Fiebre alta, dolor de garganta', 'urgente', 'Reposo, analgésicos', 'Paracetamol', 'Hemograma'),
        new Paciente('María García', 62, 'Mujer', '87654321', 'Dolor en el pecho, dificultad para respirar', 'critico', 'Oxígeno, nitroglicerina', 'Aspirina', 'Electrocardiograma'),
        new Paciente('Carlos Ruiz', 28, 'Hombre', '11223344', 'Tos persistente, secreción nasal', 'leve', 'Jarabe para la tos', 'Vitamina C', 'Ninguno'),
        new Paciente('Ana López', 45, 'Mujer', '55667788', 'Dolor abdominal agudo', 'moderado', 'Dieta blanda, hidratación', 'Buscapina', 'Ecografía abdominal')
    ];
    pacientes.push(...pacientesPredeterminados); // Añadir pacientes predeterminados al array

    // ... (resto del código JavaScript, funciones de validación, etc.) ...

    // Función para mostrar alerta visual
    function mostrarAlerta(mensaje, tipo = 'info') {
        const alertPlaceholder = document.createElement('div');
        alertPlaceholder.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show fixed-top-right" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
        document.body.append(alertPlaceholder);

        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertPlaceholder.querySelector('.alert'));
            if (bsAlert) bsAlert.close();
            alertPlaceholder.remove();
        }, 5000);
    }

    // Función para registrar un nuevo paciente (mantener el .toLowerCase() para consistencia)
    pacienteForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // ... (validación de campos) ...

        const nuevoPaciente = new Paciente(
            document.getElementById('nombre').value.trim(),
            parseInt(document.getElementById('edad').value),
            document.getElementById('genero').value,
            document.getElementById('documento').value.trim(),
            document.getElementById('sintomas').value.trim(),
            // Aquí se pasa el valor directamente, ya que el constructor de Paciente lo convierte a minúsculas
            document.getElementById('gravedad').value,
            document.getElementById('tratamiento').value.trim(),
            document.getElementById('medicamentos').value.trim(),
            document.getElementById('examenes').value
        );

        pacientes.push(nuevoPaciente);
        actualizarTablaPacientes();
        pacienteForm.reset();

        pacienteForm.querySelectorAll('.form-control, .form-select, .form-check-input').forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });

        // La verificación debe ser con el valor en minúsculas ahora
        if (nuevoPaciente.gravedad === 'critico') {
            mostrarAlerta('¡ALERTA! Paciente en estado CRÍTICO registrado.', 'danger');
        }

        const listaTab = new bootstrap.Tab(document.getElementById('lista-tab'));
        listaTab.show();
    });

    // Función para ordenar y mostrar los pacientes en la tabla
    function actualizarTablaPacientes() {
        // Ordenar pacientes por gravedad (critico, urgente, moderado, leve)
        // Se ha cambiado el nombre de las claves para que coincidan con los `value` del select
        const ordenGravedad = { 'critico': 1, 'urgente': 2, 'moderado': 3, 'leve': 4 };
        pacientes.sort((a, b) => ordenGravedad[a.gravedad] - ordenGravedad[b.gravedad]);

        tablaPacientesBody.innerHTML = '';

        let criticos = 0, urgentes = 0, moderados = 0, leves = 0;

        if (pacientes.length === 0) {
            const noDataRow = tablaPacientesBody.insertRow();
            noDataRow.innerHTML = `<td colspan="10" class="text-center text-muted">No hay pacientes registrados.</td>`;
        }

        pacientes.forEach(paciente => {
            const row = tablaPacientesBody.insertRow();
            // Asignar clase de color según la gravedad (ya está en minúsculas)
            row.classList.add(`gravedad-${paciente.gravedad}`);

            // Actualizar contadores (se ajustan las condiciones a minúsculas)
            switch (paciente.gravedad) {
                case 'critico': criticos++; break;
                case 'urgente': urgentes++; break;
                case 'moderado': moderados++; break;
                case 'leve': leves++; break;
            }
            
            // Para mostrar el texto con mayúscula inicial en la tabla
            const gravedadDisplay = paciente.gravedad.charAt(0).toUpperCase() + paciente.gravedad.slice(1);

            row.innerHTML = `
                <td>${paciente.nombre}</td>
                <td>${paciente.edad}</td>
                <td>${paciente.genero}</td>
                <td>${paciente.documento}</td>
                <td>${paciente.sintomas}</td>
                <td>${gravedadDisplay}</td> <td>${paciente.tratamiento}</td>
                <td>${paciente.medicamentos}</td>
                <td>${paciente.examenes}</td>
                <td>
                    <button class="btn btn-danger btn-sm eliminar-paciente" data-id="${paciente.id}">Eliminar</button>
                </td>
            `;
        });

        countCritico.textContent = criticos;
        countUrgente.textContent = urgentes;
        countModerado.textContent = moderados;
        countLeve.textContent = leves;
    }

    // ... (resto del código JavaScript para eliminar pacientes, etc.) ...

    // Inicializar la tabla y contadores al cargar la página
    actualizarTablaPacientes();
});

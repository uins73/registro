document.addEventListener('DOMContentLoaded', () => {
    const pacienteForm = document.getElementById('pacienteForm');
    const tablaPacientesBody = document.getElementById('tablaPacientesBody');

    // Referencias a los elementos de los contadores en la pestaña de Estadísticas
    const countCritico = document.getElementById('countCritico');
    const countUrgente = document.getElementById('countUrgente');
    const countModerado = document.getElementById('countModerado');
    const countLeve = document.getElementById('countLeve');

    // Elementos para el límite de pacientes
    const limitePacientesInput = document.getElementById('limitePacientes');
    const totalPacientesActualesSpan = document.getElementById('totalPacientesActuales');
    const limiteMostradoSpan = document.getElementById('limiteMostrado');
    const btnRegistrarPaciente = document.getElementById('btnRegistrarPaciente');

    let limiteHospital = parseInt(limitePacientesInput.value); // Límite inicial

    // Clases y variables globales para los gráficos de Chart.js
    let gravedadDoughnutChart;
    let gravedadBarChart;

    // Clase Paciente (Programación Orientada a Objetos - POO)
    class Paciente {
        constructor(nombre, edad, genero, documento, sintomas, gravedad, tratamiento, medicamentos, examenes) {
            this.id = Date.now() + Math.random(); // Generar ID único
            this.nombre = nombre;
            this.edad = edad;
            this.genero = genero;
            this.documento = documento;
            this.sintomas = sintomas;
            this.gravedad = gravedad.toLowerCase();
            this.tratamiento = tratamiento;
            this.medicamentos = medicamentos;
            this.examenes = examenes;
        }
    }

    // Array para almacenar los pacientes
    let pacientes = [];

    // Pacientes predeterminados para que la tabla no empiece vacía
    const pacientesPredeterminados = [
        new Paciente('Juan Pérez', 35, 'Hombre', '12345678', 'Fiebre alta, dolor de garganta', 'urgente', 'Reposo, analgésicos', 'Paracetamol', 'Hemograma'),
        new Paciente('María García', 62, 'Mujer', '87654321', 'Dolor en el pecho, dificultad para respirar', 'critico', 'Oxígeno, nitroglicerina', 'Aspirina', 'Electrocardiograma'),
        new Paciente('Carlos Ruiz', 28, 'Hombre', '11223344', 'Tos persistente, secreción nasal', 'leve', 'Jarabe para la tos', 'Vitamina C', 'Ninguno'),
        new Paciente('Ana López', 45, 'Mujer', '55667788', 'Dolor abdominal agudo', 'moderado', 'Dieta blanda, hidratación', 'Buscapina', 'Ecografía abdominal')
    ];
    pacientes.push(...pacientesPredeterminados);

    // Función para validar un campo específico del formulario
    function validarCampo(inputElement, validationFn) {
        const value = inputElement.value.trim();
        const isValid = validationFn(value);
        if (isValid) {
            inputElement.classList.remove('is-invalid');
            inputElement.classList.add('is-valid');
        } else {
            inputElement.classList.remove('is-valid');
            inputElement.classList.add('is-invalid');
        }
        return isValid;
    }

    // Funciones de validación para cada campo
    const validarNombre = (valor) => valor.length > 0;
    const validarEdad = (valor) => parseInt(valor) > 0 && !isNaN(parseInt(valor));
    const validarGenero = (valor) => valor !== '';
    const validarDocumento = (valor) => valor.length >= 5;
    const validarSintomas = (valor) => valor.length > 0;
    const validarGravedad = (valor) => valor !== '';
    const validarTratamiento = (valor) => valor.length > 0;
    const validarMedicamentos = (valor) => valor.length > 0;
    const validarExamenes = (valor) => valor !== '';

    // Listener para validación en tiempo real
    pacienteForm.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => {
            switch (input.id) {
                case 'nombre': validarCampo(input, validarNombre); break;
                case 'edad': validarCampo(input, validarEdad); break;
                case 'genero': validarCampo(input, validarGenero); break;
                case 'documento': validarCampo(input, validarDocumento); break;
                case 'sintomas': validarCampo(input, validarSintomas); break;
                case 'gravedad': validarCampo(input, validarGravedad); break;
                case 'tratamiento': validarCampo(input, validarTratamiento); break;
                case 'medicamentos': validarCampo(input, validarMedicamentos); break;
                case 'examenes': validarCampo(input, validarExamenes); break;
            }
        });
    });

    // Función para mostrar una alerta visual (tipo "toast" de Bootstrap)
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

    // --- Lógica del Límite de Pacientes ---
    function actualizarContadorLimite() {
        totalPacientesActualesSpan.textContent = pacientes.length;
        limiteMostradoSpan.textContent = limiteHospital;

        if (pacientes.length >= limiteHospital) {
            btnRegistrarPaciente.disabled = true;
            btnRegistrarPaciente.textContent = 'Límite de pacientes alcanzado';
            mostrarAlerta('¡Advertencia! El hospital ha alcanzado su límite de pacientes.', 'warning');
        } else {
            btnRegistrarPaciente.disabled = false;
            btnRegistrarPaciente.textContent = 'Registrar Paciente';
        }
    }

    // Listener para cambiar el límite de pacientes
    limitePacientesInput.addEventListener('input', () => {
        const nuevoLimite = parseInt(limitePacientesInput.value);
        if (!isNaN(nuevoLimite) && nuevoLimite > 0) {
            limiteHospital = nuevoLimite;
            actualizarContadorLimite();
        } else {
            // Si el valor no es válido, se podría resetear o mostrar una advertencia
            limitePacientesInput.value = 1; // Forzar un valor mínimo
            limiteHospital = 1;
            actualizarContadorLimite();
        }
    });

    // Función para manejar el envío del formulario y registrar un nuevo paciente
    pacienteForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Si el límite se ha alcanzado, no permitir el registro
        if (pacientes.length >= limiteHospital) {
            mostrarAlerta('No se puede registrar el paciente: ¡Límite del hospital alcanzado!', 'danger');
            return;
        }

        // ... (validación de campos) ...
        const nombreValido = validarCampo(document.getElementById('nombre'), validarNombre);
        const edadValida = validarCampo(document.getElementById('edad'), validarEdad);
        const generoValido = validarCampo(document.getElementById('genero'), validarGenero);
        const documentoValido = validarCampo(document.getElementById('documento'), validarDocumento);
        const sintomasValidos = validarCampo(document.getElementById('sintomas'), validarSintomas);
        const gravedadValida = validarCampo(document.getElementById('gravedad'), validarGravedad);
        const tratamientoValido = validarCampo(document.getElementById('tratamiento'), validarTratamiento);
        const medicamentosValidos = validarCampo(document.getElementById('medicamentos'), validarMedicamentos);
        const examenesValidos = validarCampo(document.getElementById('examenes'), validarExamenes);

        if (!(nombreValido && edadValida && generoValido && documentoValido &&
              sintomasValidos && gravedadValida && tratamientoValido &&
              medicamentosValidos && examenesValidos)) {
            mostrarAlerta('Por favor, complete todos los campos correctamente.', 'danger');
            return;
        }

        const nuevoPaciente = new Paciente(
            document.getElementById('nombre').value.trim(),
            parseInt(document.getElementById('edad').value),
            document.getElementById('genero').value,
            document.getElementById('documento').value.trim(),
            document.getElementById('sintomas').value.trim(),
            document.getElementById('gravedad').value,
            document.getElementById('tratamiento').value.trim(),
            document.getElementById('medicamentos').value.trim(),
            document.getElementById('examenes').value
        );

        pacientes.push(nuevoPaciente);
        actualizarTablaPacientes();
        actualizarContadoresEstadisticas();
        actualizarGraficos(); // Actualizar gráficos
        actualizarContadorLimite(); // Actualizar contador de límite
        pacienteForm.reset();

        pacienteForm.querySelectorAll('.form-control, .form-select, .form-check-input').forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });

        if (nuevoPaciente.gravedad === 'critico') {
            mostrarAlerta('¡ALERTA! Paciente en estado CRÍTICO registrado.', 'danger');
        }

        const listaTab = new bootstrap.Tab(document.getElementById('lista-tab'));
        listaTab.show();
    });

    // Función para actualizar solo los contadores de pacientes por gravedad
    function actualizarContadoresEstadisticas() {
        let criticos = 0, urgentes = 0, moderados = 0, leves = 0;

        pacientes.forEach(paciente => {
            switch (paciente.gravedad) {
                case 'critico': criticos++; break;
                case 'urgente': urgentes++; break;
                case 'moderado': moderados++; break;
                case 'leve': leves++; break;
            }
        });

        countCritico.textContent = criticos;
        countUrgente.textContent = urgentes;
        countModerado.textContent = moderados;
        countLeve.textContent = leves;
    }

    // Función para ordenar y mostrar los pacientes en la tabla
    function actualizarTablaPacientes() {
        const ordenGravedad = { 'critico': 1, 'urgente': 2, 'moderado': 3, 'leve': 4 };
        pacientes.sort((a, b) => ordenGravedad[a.gravedad] - ordenGravedad[b.gravedad]);

        tablaPacientesBody.innerHTML = '';

        if (pacientes.length === 0) {
            const noDataRow = tablaPacientesBody.insertRow();
            noDataRow.innerHTML = `<td colspan="10" class="text-center text-muted py-3">No hay pacientes registrados.</td>`;
        }

        pacientes.forEach(paciente => {
            const row = tablaPacientesBody.insertRow();
            row.classList.add(`gravedad-${paciente.gravedad}`);
            
            const gravedadDisplay = paciente.gravedad.charAt(0).toUpperCase() + paciente.gravedad.slice(1);

            row.innerHTML = `
                <td>${paciente.nombre}</td>
                <td>${paciente.edad}</td>
                <td>${paciente.genero}</td>
                <td>${paciente.documento}</td>
                <td>${paciente.sintomas}</td>
                <td>${gravedadDisplay}</td>
                <td>${paciente.tratamiento}</td>
                <td>${paciente.medicamentos}</td>
                <td>${paciente.examenes}</td>
                <td>
                    <button class="btn btn-danger btn-sm eliminar-paciente" data-id="${paciente.id}">Eliminar</button>
                </td>
            `;
        });
    }

    // Función para eliminar un paciente
    tablaPacientesBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('eliminar-paciente')) {
            const pacienteId = parseFloat(e.target.dataset.id);
            pacientes = pacientes.filter(paciente => paciente.id !== pacienteId);
            actualizarTablaPacientes();
            actualizarContadoresEstadisticas();
            actualizarGraficos(); // Actualizar gráficos
            actualizarContadorLimite(); // Actualizar contador de límite
            mostrarAlerta('Paciente eliminado correctamente.', 'success');
        }
    });

    // --- Funciones para Gráficos ---

    function inicializarGraficos() {
        const ctxDoughnut = document.getElementById('gravedadDoughnutChart').getContext('2d');
        const ctxBar = document.getElementById('gravedadBarChart').getContext('2d');

        // Gráfico de Pastel (Doughnut)
        if (gravedadDoughnutChart) {
            gravedadDoughnutChart.destroy();
        }
        gravedadDoughnutChart = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: {
                labels: ['Crítico', 'Urgente', 'Moderado', 'Leve'],
                datasets: [{
                    data: [0, 0, 0, 0], // Se actualizará dinámicamente
                    backgroundColor: [
                        '#dc3545', // Rojo
                        '#fd7e14', // Naranja
                        '#ffc107', // Amarillo
                        '#28a745'  // Verde
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 10,
                        bottom: 10
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },
                    title: {
                        display: false,
                    }
                },
                // --- NUEVO: OPCIÓN PARA EL GRÁFICO DE PASTEL/DOUGHNUT ---
                elements: {
                    arc: {
                        // Aquí puedes ajustar el grosor del "doughnut" si es un problema
                        // o el borde para ver si se está cortando.
                        // borderWidth: 2 // Añadir un borde para visualización o ajustarlo
                    }
                }
            }
        });

        // Gráfico de Barras
        if (gravedadBarChart) {
            gravedadBarChart.destroy();
        }
        gravedadBarChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Crítico', 'Urgente', 'Moderado', 'Leve'],
                datasets: [{
                    label: 'Número de Pacientes',
                    data: [0, 0, 0, 0], // Se actualizará dinámicamente
                    backgroundColor: [
                        'rgba(220, 53, 69, 0.7)',
                        'rgba(253, 126, 20, 0.7)',
                        'rgba(255, 193, 7, 0.7)',
                        'rgba(40, 167, 69, 0.7)'
                    ],
                    borderColor: [
                        '#dc3545',
                        '#fd7e14',
                        '#ffc107',
                        '#28a745'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { if (value % 1 === 0) { return value; } },
                        }
                    }
                }
            }
        });
    }

    // Función para actualizar los datos de los gráficos
    function actualizarGraficos() {
        let criticos = 0, urgentes = 0, moderados = 0, leves = 0;

        pacientes.forEach(paciente => {
            switch (paciente.gravedad) {
                case 'critico': criticos++; break;
                case 'urgente': urgentes++; break;
                case 'moderado': moderados++; break;
                case 'leve': leves++; break;
            }
        });

        const data = [criticos, urgentes, moderados, leves];

        // Actualizar Gráfico de Pastel (Doughnut)
        if (gravedadDoughnutChart) { 
            gravedadDoughnutChart.data.datasets[0].data = data;
            gravedadDoughnutChart.update();
        }

        // Actualizar Gráfico de Barras
        if (gravedadBarChart) { 
            gravedadBarChart.data.datasets[0].data = data;
            gravedadBarChart.update();
        }
    }

    // --- Control de Pestañas para Gráficos ---
    const myTab = document.getElementById('myTab');
    myTab.addEventListener('shown.bs.tab', function (event) {
        if (event.target.id === 'estadisticas-tab') {
            // Esto es crucial para asegurar que Chart.js redibuje cuando la pestaña es visible
            if (gravedadDoughnutChart) {
                gravedadDoughnutChart.resize(); // Forzar el redimensionamiento
            }
            if (gravedadBarChart) {
                gravedadBarChart.resize(); // Forzar el redimensionamiento
            }
            actualizarGraficos(); // Asegurar que los datos estén al día
        }
    });

    // --- Inicialización al cargar la página ---
    inicializarGraficos();
    actualizarTablaPacientes();
    actualizarContadoresEstadisticas();
    actualizarGraficos();
    actualizarContadorLimite();
});

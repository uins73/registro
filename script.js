document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a los elementos del DOM para el Login/Registro ---
    const loginSection = document.getElementById('login-section');
    const appContent = document.getElementById('app-content');
    const authTitle = document.getElementById('authTitle'); // Nuevo
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');
    const btnLogout = document.getElementById('btnLogout');

    // Referencias para el Registro (Nuevas)
    const registerForm = document.getElementById('registerForm');
    const registerUsernameInput = document.getElementById('registerUsername');
    const registerPasswordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const registerError = document.getElementById('registerError');
    const registerSuccess = document.getElementById('registerSuccess');
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');

    // --- Credenciales de ejemplo (Para un sistema real, esto sería validado en un servidor) ---
    // Removido USERNAME y PASSWORD fijos. Ahora se cargarán desde localStorage.
    let users = JSON.parse(localStorage.getItem('users')) || [{ username: 'admin', password: 'password123' }];
    // Si no hay usuarios, agregamos el predeterminado.

    // Declarar las variables que se referencian en showApp() para que tengan un ámbito global en DOMContentLoaded
    let pacienteForm;
    let tablaPacientesBody;
    let countCritico;
    let countUrgente;
    let countModerado;
    let countLeve;
    let limitePacientesInput;
    let totalPacientesActualesSpan;
    let limiteMostradoSpan;
    let btnRegistrarPaciente;
    let limiteHospital;
    let gravedadDoughnutChart;
    const myTab = document.getElementById('myTab');

    class Paciente {
        constructor(nombre, edad, genero, documento, sintomas, gravedad, tratamiento, medicamentos, examenes) {
            this.id = Date.now() + Math.random();
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

    let pacientes = [];

    const pacientesPredeterminados = [
        new Paciente('Juan Pérez', 35, 'Hombre', '12345678', 'Fiebre alta, dolor de garganta', 'urgente', 'Reposo, analgésicos', 'Paracetamol', 'Hemograma'),
        new Paciente('María García', 62, 'Mujer', '87654321', 'Dolor en el pecho, dificultad para respirar', 'critico', 'Oxígeno, nitroglicerina', 'Aspirina', 'Electrocardiograma'),
        new Paciente('Carlos Ruiz', 28, 'Hombre', '11223344', 'Tos persistente, secreción nasal', 'leve', 'Jarabe para la tos', 'Vitamina C', 'Ninguno'),
        new Paciente('Ana López', 45, 'Mujer', '55667788', 'Dolor abdominal agudo', 'moderado', 'Dieta blanda, hidratación', 'Buscapina', 'Ecografía abdominal')
    ];

    // --- Funciones para verificar el estado de la sesión y mostrar/ocultar secciones ---
    function checkSession() {
        const loggedIn = localStorage.getItem('loggedIn');
        if (loggedIn === 'true') {
            showApp();
        } else {
            showLogin();
        }
    }

    function showApp() {
        loginSection.classList.add('d-none');
        appContent.classList.remove('d-none');

        // --- ESTO ES CRUCIAL: OBTENER LAS REFERENCIAS DEL DOM AQUÍ ---
        pacienteForm = document.getElementById('pacienteForm');
        tablaPacientesBody = document.getElementById('tablaPacientesBody');
        countCritico = document.getElementById('countCritico');
        countUrgente = document.getElementById('countUrgente');
        countModerado = document.getElementById('countModerado');
        countLeve = document.getElementById('countLeve');
        limitePacientesInput = document.getElementById('limitePacientes');
        totalPacientesActualesSpan = document.getElementById('totalPacientesActuales');
        limiteMostradoSpan = document.getElementById('limiteMostrado');
        btnRegistrarPaciente = document.getElementById('btnRegistrarPaciente');

        limiteHospital = parseInt(limitePacientesInput.value);

        // --- Cargar pacientes o usar predeterminados ---
        const pacientesGuardados = JSON.parse(localStorage.getItem('pacientes'));
        if (pacientesGuardados && pacientesGuardados.length > 0) {
            pacientes = pacientesGuardados;
        } else {
            pacientes = [...pacientesPredeterminados];
        }

        // --- LÓGICA DE INICIALIZACIÓN DE LA APLICACIÓN ---
        actualizarTablaPacientes();
        actualizarContadoresEstadisticas();
        actualizarContadorLimite();

        if (!gravedadDoughnutChart) {
            inicializarGraficos();
        }
        actualizarGraficos();

        const registroTab = new bootstrap.Tab(document.getElementById('registro-tab'));
        registroTab.show();

        // --- RE-ADJUNTAR LISTENERS (para la app principal) ---
        // Se aseguran de que los listeners estén en los elementos correctos después de obtener las referencias
        pacienteForm.querySelectorAll('input, select, textarea').forEach(input => {
            input.removeEventListener('input', handleValidation);
            input.addEventListener('input', handleValidation);
        });
        limitePacientesInput.removeEventListener('input', handleLimiteChange);
        limitePacientesInput.addEventListener('input', handleLimiteChange);
        pacienteForm.removeEventListener('submit', handleSubmitForm);
        pacienteForm.addEventListener('submit', handleSubmitForm);
        tablaPacientesBody.removeEventListener('click', handleDeletePaciente);
        tablaPacientesBody.addEventListener('click', handleDeletePaciente);
        tablaPacientesBody.removeEventListener('click', handleDownloadPaciente);
        tablaPacientesBody.addEventListener('click', handleDownloadPaciente);
        myTab.removeEventListener('shown.bs.tab', handleTabShow);
        myTab.addEventListener('shown.bs.tab', handleTabShow);
    }

    function showLogin() {
        loginSection.classList.remove('d-none');
        appContent.classList.add('d-none');
        localStorage.removeItem('loggedIn');
        // Limpiar campos de login
        usernameInput.value = '';
        passwordInput.value = '';
        loginError.classList.add('d-none');
        // Asegurarse de que el formulario de login esté visible al salir
        loginForm.classList.remove('d-none');
        registerForm.classList.add('d-none');
        authTitle.textContent = 'Iniciar Sesión';
        // Limpiar campos de registro
        registerUsernameInput.value = '';
        registerPasswordInput.value = '';
        confirmPasswordInput.value = '';
        registerError.classList.add('d-none');
        registerSuccess.classList.add('d-none');
        // Guardar pacientes antes de cerrar sesión
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
    }

    // --- Manejo del Login ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;

        // Validar contra la lista de usuarios
        const userFound = users.find(user => user.username === username && user.password === password);

        if (userFound) {
            localStorage.setItem('loggedIn', 'true');
            showApp();
        } else {
            loginError.classList.remove('d-none');
        }
    });

    // --- Manejo del Logout ---
    btnLogout.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres cerrar la sesión?')) {
            showLogin();
        }
    });

    // --- Lógica para alternar entre formularios de Login y Registro ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('d-none');
        registerForm.classList.remove('d-none');
        authTitle.textContent = 'Crear Cuenta';
        loginError.classList.add('d-none'); // Ocultar errores de login al cambiar
        registerSuccess.classList.add('d-none'); // Ocultar éxito si se mostró antes
        registerError.classList.add('d-none'); // Ocultar errores de registro
        // Limpiar campos de login al cambiar
        usernameInput.value = '';
        passwordInput.value = '';
        // Resetear validación visual de campos de registro
        registerUsernameInput.classList.remove('is-valid', 'is-invalid');
        registerPasswordInput.classList.remove('is-valid', 'is-invalid');
        confirmPasswordInput.classList.remove('is-valid', 'is-invalid');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('d-none');
        loginForm.classList.remove('d-none');
        authTitle.textContent = 'Iniciar Sesión';
        registerError.classList.add('d-none'); // Ocultar errores de registro al cambiar
        registerSuccess.classList.add('d-none'); // Ocultar éxito si se mostró antes
        loginError.classList.add('d-none'); // Ocultar errores de login
        // Limpiar campos de registro al cambiar
        registerUsernameInput.value = '';
        registerPasswordInput.value = '';
        confirmPasswordInput.value = '';
        // Resetear validación visual de campos de login
        usernameInput.classList.remove('is-valid', 'is-invalid');
        passwordInput.classList.remove('is-valid', 'is-invalid');
    });

    // --- Manejo del Registro ---
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newUsername = registerUsernameInput.value.trim();
        const newPassword = registerPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Limpiar mensajes anteriores
        registerError.classList.add('d-none');
        registerSuccess.classList.add('d-none');

        // Validaciones del formulario de registro
        let isValidRegisterForm = true;

        const validateRegisterUsername = (val) => val.length >= 3 && !/\s/.test(val); // No espacios
        const validateRegisterPassword = (val) => val.length >= 6;
        const validateConfirmPassword = (pass1, pass2) => pass1 === pass2;

        isValidRegisterForm = validarCampo(registerUsernameInput, validateRegisterUsername) && isValidRegisterForm;
        isValidRegisterForm = validarCampo(registerPasswordInput, validateRegisterPassword) && isValidRegisterForm;
        
        // Validación específica para confirmar contraseña
        if (!validateConfirmPassword(newPassword, confirmPassword)) {
            confirmPasswordInput.classList.add('is-invalid');
            confirmPasswordInput.classList.remove('is-valid');
            isValidRegisterForm = false;
        } else {
            confirmPasswordInput.classList.remove('is-invalid');
            confirmPasswordInput.classList.add('is-valid');
        }

        if (!isValidRegisterForm) {
            registerError.textContent = 'Por favor, complete todos los campos de registro correctamente.';
            registerError.classList.remove('d-none');
            return;
        }

        // Verificar si el usuario ya existe
        const userExists = users.some(user => user.username === newUsername);
        if (userExists) {
            registerError.textContent = 'El usuario ya existe. Por favor, elija otro nombre de usuario.';
            registerError.classList.remove('d-none');
            return;
        }

        // Si todo es válido, registrar nuevo usuario
        users.push({ username: newUsername, password: newPassword });
        localStorage.setItem('users', JSON.stringify(users)); // Guardar nuevos usuarios
        registerSuccess.classList.remove('d-none'); // Mostrar mensaje de éxito
        registerError.classList.add('d-none');

        // Opcional: limpiar campos después del registro exitoso
        registerUsernameInput.value = '';
        registerPasswordInput.value = '';
        confirmPasswordInput.value = '';
        // Resetear la validación visual
        registerUsernameInput.classList.remove('is-valid', 'is-invalid');
        registerPasswordInput.classList.remove('is-valid', 'is-invalid');
        confirmPasswordInput.classList.remove('is-valid', 'is-invalid');

        // Opcional: cambiar automáticamente a la pantalla de login después de un registro exitoso
        setTimeout(() => {
            showLoginLink.click();
        }, 2000); // Cambia a login después de 2 segundos
    });

    // --- Funciones de Validación (Se mantienen iguales) ---
    function handleValidation() {
        switch (this.id) {
            case 'nombre': validarCampo(this, validarNombre); break;
            case 'edad': validarCampo(this, validarEdad); break;
            case 'genero': validarCampo(this, validarGenero); break;
            case 'documento': validarCampo(this, validarDocumento); break;
            case 'sintomas': validarCampo(this, validarSintomas); break;
            case 'gravedad': validarCampo(this, validarGravedad); break;
            case 'tratamiento': validarCampo(this, validarTratamiento); break;
            case 'medicamentos': validarCampo(this, validarMedicamentos); break;
            case 'examenes': validarCampo(this, validarExamenes); break;
            // Nuevas validaciones para el formulario de registro
            case 'registerUsername': validarCampo(this, (val) => val.length >= 3 && !/\s/.test(val)); break;
            case 'registerPassword': validarCampo(this, (val) => val.length >= 6); break;
            case 'confirmPassword':
                const regPass = registerPasswordInput.value;
                const confPass = this.value;
                validarCampo(this, (val) => regPass === confPass);
                break;
        }
    }
    // ... (el resto de tus funciones: validarCampo, mostrarAlerta, actualizarContadorLimite, etc.) ...
    // Asegúrate de que todas las funciones que definiste previamente estén aquí,
    // incluyendo las funciones de descarga y las de los gráficos.
    // Solo estoy mostrando los cambios relevantes para el login/registro.

    const validarCampo = (inputElement, validationFn) => {
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
    };
    const validarNombre = (valor) => valor.length > 0;
    const validarEdad = (valor) => parseInt(valor) > 0 && !isNaN(parseInt(valor));
    const validarGenero = (valor) => valor !== '';
    const validarDocumento = (valor) => valor.length >= 5;
    const validarSintomas = (valor) => valor.length > 0;
    const validarGravedad = (valor) => valor !== '';
    const validarTratamiento = (valor) => valor.length > 0;
    const validarMedicamentos = (valor) => valor.length > 0;
    const validarExamenes = (valor) => valor !== '';

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

    function handleLimiteChange() {
        const nuevoLimite = parseInt(limitePacientesInput.value);
        if (!isNaN(nuevoLimite) && nuevoLimite > 0) {
            limiteHospital = nuevoLimite;
            actualizarContadorLimite();
        } else {
            limitePacientesInput.value = 1;
            limiteHospital = 1;
            actualizarContadorLimite();
        }
    }

    function handleSubmitForm(e) {
        e.preventDefault();

        if (pacientes.length >= limiteHospital) {
            mostrarAlerta('No se puede registrar el paciente: ¡Límite del hospital alcanzado!', 'danger');
            return;
        }

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
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
        actualizarTablaPacientes();
        actualizarContadoresEstadisticas();
        actualizarGraficos();
        actualizarContadorLimite();
        pacienteForm.reset();

        pacienteForm.querySelectorAll('.form-control, .form-select, .form-check-input').forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });

        if (nuevoPaciente.gravedad === 'critico') {
            mostrarAlerta('¡ALERTA! Paciente en estado CRÍTICO registrado.', 'danger');
        }

        const listaTab = new bootstrap.Tab(document.getElementById('lista-tab'));
        listaTab.show();
    }

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
                    <button class="btn btn-info btn-sm descargar-paciente me-1" data-id="${paciente.id}">Descargar</button>
                    <button class="btn btn-danger btn-sm eliminar-paciente" data-id="${paciente.id}">Eliminar</button>
                </td>
            `;
        });
    }

    function handleDeletePaciente(e) {
        if (e.target.classList.contains('eliminar-paciente')) {
            const pacienteId = parseFloat(e.target.dataset.id);
            pacientes = pacientes.filter(paciente => paciente.id !== pacienteId);
            localStorage.setItem('pacientes', JSON.stringify(pacientes));
            actualizarTablaPacientes();
            actualizarContadoresEstadisticas();
            actualizarGraficos();
            actualizarContadorLimite();
            mostrarAlerta('Paciente eliminado correctamente.', 'success');
        }
    }

    // --- FUNCIÓN: Descargar paciente en formato TXT (sin cambios) ---
    function descargarPaciente(paciente) {
        let pacienteTxt = `--- Información del Paciente ---\n\n`;
        pacienteTxt += `ID: ${paciente.id}\n`;
        pacienteTxt += `Nombre: ${paciente.nombre}\n`;
        pacienteTxt += `Edad: ${paciente.edad}\n`;
        pacienteTxt += `Género: ${paciente.genero}\n`;
        pacienteTxt += `Documento: ${paciente.documento}\n`;
        pacienteTxt += `Síntomas: ${paciente.sintomas}\n`;
        pacienteTxt += `Gravedad: ${paciente.gravedad.charAt(0).toUpperCase() + paciente.gravedad.slice(1)}\n`;
        pacienteTxt += `Tratamiento: ${paciente.tratamiento}\n`;
        pacienteTxt += `Medicamentos: ${paciente.medicamentos}\n`;
        pacienteTxt += `Exámenes: ${paciente.examenes}\n\n`;
        pacienteTxt += `------------------------------\n`;

        const blob = new Blob([pacienteTxt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `informacion_paciente_${paciente.nombre.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarAlerta(`Información de ${paciente.nombre} descargada en formato TXT.`, 'info');
    }

    // --- EVENT LISTENER: Manejar clic en botón de descarga (sin cambios) ---
    function handleDownloadPaciente(e) {
        if (e.target.classList.contains('descargar-paciente')) {
            const pacienteId = parseFloat(e.target.dataset.id);
            const pacienteAdescargar = pacientes.find(p => p.id === pacienteId);
            if (pacienteAdescargar) {
                descargarPaciente(pacienteAdescargar);
            }
        }
    }

    function inicializarGraficos() {
        const ctxDoughnut = document.getElementById('gravedadDoughnutChart').getContext('2d');

        if (gravedadDoughnutChart) {
            gravedadDoughnutChart.destroy();
        }
        gravedadDoughnutChart = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: {
                labels: ['Crítico', 'Urgente', 'Moderado', 'Leve'],
                datasets: [{
                    data: [0, 0, 0, 0],
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
                        top: 30,
                        bottom: 10
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'center',
                        labels: {
                            font: {
                                size: 14
                            },
                            boxWidth: 20,
                            padding: 20
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Gravedad de Pacientes',
                        position: 'top',
                        align: 'center',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 25
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed;
                                }
                                return label + ' pacientes';
                            }
                        }
                    }
                },
                elements: {
                    arc: {
                        borderWidth: 0,
                        spacing: 0
                    }
                },
                cutout: '70%',
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
    }

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

        if (gravedadDoughnutChart) {
            gravedadDoughnutChart.data.datasets[0].data = data;
            gravedadDoughnutChart.update();
        }
    }

    function handleTabShow(event) {
        if (event.target.id === 'estadisticas-tab') {
            if (gravedadDoughnutChart) {
                gravedadDoughnutChart.resize();
            }
            actualizarGraficos();
        }
    }

    // --- LÓGICA DE INICIALIZACIÓN PRINCIPAL ---
    checkSession();
});

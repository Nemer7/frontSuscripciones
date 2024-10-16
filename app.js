// URL base para la API
const API_BASE_URL = 'http://localhost:8080/api/planes';

document.addEventListener("DOMContentLoaded", function() {
    let selectedPlan = null;
    const planCards = document.querySelectorAll(".plan-card");
    const subscribeButton = document.getElementById("subscribe");
    const renewButton = document.getElementById("renew");
    const userNameInput = document.getElementById("name");
    const customForm = document.getElementById("customForm");
    const consultarSuscripcionesButton = document.getElementById("consultarSuscripciones");
    const clonarSuscripcionButton = document.getElementById("clonarSuscripcion");

    // Función para hacer llamadas a la API
    async function apiCall(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error en la llamada a la API:", error);
            throw error;
        }
    }

    planCards.forEach(card => {
        card.addEventListener("click", function() {
            selectedPlan = this.id;
            planCards.forEach(c => c.classList.remove("selected"));
            this.classList.add("selected");
        });
    });

    function validateUserName() {
        if (!userNameInput.value.trim()) {
            alert("Por favor, ingresa tu nombre antes de continuar.");
            return false;
        }
        return true;
    }

    function validatePlanSelection() {
        if (!selectedPlan) {
            alert("Por favor, selecciona un plan de suscripción.");
            return false;
        }
        return true;
    }

    async function subscribeToPlan(planType, userName) {
        try {
            let response;
            const params = new URLSearchParams({ nombreUsuario: userName });
            
            switch (planType) {
                case 'basic':
                    response = await apiCall(`${API_BASE_URL}/basico?${params}`, 'POST');
                    break;
                case 'standard':
                    response = await apiCall(`${API_BASE_URL}/estandar?${params}`, 'POST');
                    break;
                case 'premium':
                    response = await apiCall(`${API_BASE_URL}/premium?${params}`, 'POST');
                    break;
                case 'custom':
                    const customPlan = getCustomPlanDetails();
                    const customParams = new URLSearchParams({ ...customPlan, nombreUsuario: userName });
                    response = await apiCall(`${API_BASE_URL}/personalizado?${customParams}`, 'POST');
                    break;
                default:
                    throw new Error("Tipo de plan no válido");
            }
            console.log("Respuesta de suscripción:", response);
            alert(`Te has suscrito exitosamente al plan ${planType}.`);
        } catch (error) {
            console.error("Error al suscribirse:", error);
            alert("Hubo un error al intentar suscribirse. Por favor, intenta de nuevo.");
        }
    }

    function getCustomPlanDetails() {
        return {
            calidad: document.getElementById('calidadVideo').value,
            dispositivos: parseInt(document.getElementById('dispositivosPermitidos').value),
            anuncios: document.getElementById('incluyeAnuncios').checked,
            contenidoExclusivo: document.getElementById('contenidoExclusivo').checked,
            almacenamientoExtra: parseInt(document.getElementById('almacenamientoExtra').value)
        };
    }

    subscribeButton.addEventListener("click", async function() {
        if (validateUserName() && validatePlanSelection()) {
            await subscribeToPlan(selectedPlan, userNameInput.value.trim());
        }
    });

    renewButton.addEventListener("click", async function() {
        if (validateUserName() && validatePlanSelection()) {
            try {
                const userName = userNameInput.value.trim();
                let planDetails;
                if (selectedPlan === 'custom') {
                    planDetails = getCustomPlanDetails();
                } else {
                    planDetails = getPlanDetails(selectedPlan);
                }
                const params = new URLSearchParams({ nombreUsuario: userName, ...planDetails });
                const response = await apiCall(`${API_BASE_URL}/modificarPlan?${params}`, 'POST');
                console.log("Respuesta de renovación:", response);
                alert(`Has renovado exitosamente tu suscripción al plan ${selectedPlan}.`);
            } catch (error) {
                console.error("Error al renovar la suscripción:", error);
                alert("Hubo un error al intentar renovar la suscripción. Por favor, intenta de nuevo.");
            }
        }
    });

    function getPlanDetails(planType) {
        switch (planType) {
            case 'basic':
                return { calidad: "SD", dispositivos: 1, anuncios: true, contenidoExclusivo: false, almacenamientoExtra: 0 };
            case 'standard':
                return { calidad: "HD", dispositivos: 2, anuncios: false, contenidoExclusivo: false, almacenamientoExtra: 20 };
            case 'premium':
                return { calidad: "4K", dispositivos: 4, anuncios: false, contenidoExclusivo: true, almacenamientoExtra: 50 };
            default:
                throw new Error("Tipo de plan no válido");
        }
    }

    // Función para consultar el precio del plan personalizado
    async function consultarPrecioPlan() {
        if (selectedPlan === 'custom') {
            const customPlan = getCustomPlanDetails();
            try {
                const params = new URLSearchParams(customPlan);
                const precio = await apiCall(`${API_BASE_URL}/consultaPrecioPlan?${params}`);
                document.getElementById('precioEstimado').textContent = `Precio estimado: $${precio}`;
            } catch (error) {
                console.error("Error al consultar el precio:", error);
                document.getElementById('precioEstimado').textContent = "Error al consultar el precio";
            }
        }
    }

    // Agregar evento para consultar precio al cambiar opciones del plan personalizado
    customForm.addEventListener('change', consultarPrecioPlan);

    // Función para consultar suscripciones
    async function consultarSuscripciones() {
        try {
            const suscripciones = await apiCall(`${API_BASE_URL}/consultaPlanes`);
            mostrarTablaSuscripciones(suscripciones);
        } catch (error) {
            console.error("Error al consultar suscripciones:", error);
            alert("Hubo un error al consultar las suscripciones. Por favor, intenta de nuevo.");
        }
    }

    // Función para mostrar la tabla de suscripciones
    function mostrarTablaSuscripciones(suscripciones) {
        const tablaHTML = `
        <table class="modal-table">
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Tipo de Plan</th>
                    <th>Calidad</th>
                    <th>Dispositivos</th>
                    <th>Anuncios</th>
                    <th>Contenido Exclusivo</th>
                    <th>Almacenamiento Extra</th>
                </tr>
            </thead>
            <tbody>
                ${suscripciones.map(s => `
                    <tr>
                        <td>${s.nombreUsuario}</td>
                        <td>${s.tipoPlan}</td>
                        <td>${s.calidad}</td>
                        <td>${s.dispositivos}</td>
                        <td>${s.anuncios ? 'Sí' : 'No'}</td>
                        <td>${s.contenidoExclusivo ? 'Sí' : 'No'}</td>
                        <td>${s.almacenamientoExtra} GB</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        `;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = tablaHTML;

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Cerrar';
        closeButton.className = 'close-button';
        closeButton.onclick = () => document.body.removeChild(modal);

        modal.appendChild(closeButton);
        document.body.appendChild(modal);
    }

    // Evento para consultar suscripciones
    consultarSuscripcionesButton.addEventListener('click', consultarSuscripciones);

    // Función para clonar suscripción
    async function clonarSuscripcion() {
        const usuarioReferencia = prompt("Ingrese el nombre del usuario de referencia:");
        const usuarioNuevo = prompt("Ingrese el nombre del nuevo usuario:");

        if (usuarioReferencia && usuarioNuevo) {
            try {
                const params = new URLSearchParams({
                    nombreUsuarioReferencia: usuarioReferencia,
                    nombreUsuarioNuevo: usuarioNuevo
                });
                const response = await apiCall(`${API_BASE_URL}/clonar?${params}`, 'POST');
                console.log("Respuesta de clonación:", response);
                alert(`Se ha clonado exitosamente la suscripción de ${usuarioReferencia} para ${usuarioNuevo}.`);
            } catch (error) {
                console.error("Error al clonar la suscripción:", error);
                alert("Hubo un error al intentar clonar la suscripción. Por favor, intenta de nuevo.");
            }
        } else {
            alert("Se requieren ambos nombres de usuario para clonar la suscripción.");
        }
    }

    // Evento para clonar suscripción
    clonarSuscripcionButton.addEventListener('click', clonarSuscripcion);
});
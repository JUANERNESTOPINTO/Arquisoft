/**
 * Aplicación Principal
 * Gestiona la interfaz de usuario y la lógica de búsqueda
 */

// Datos de ejemplo de pedidos
const mockOrders = [
    { id: 'PED001', cliente: 'Juan Pérez', estado: 'Entregado', fecha: '2025-11-01', total: '$450.00' },
    { id: 'PED002', cliente: 'María García', estado: 'En proceso', fecha: '2025-11-05', total: '$320.50' },
    { id: 'PED003', cliente: 'Carlos López', estado: 'Pendiente', fecha: '2025-11-08', total: '$780.00' },
    { id: 'PED004', cliente: 'Ana Martínez', estado: 'Entregado', fecha: '2025-11-10', total: '$210.00' },
    { id: 'PED005', cliente: 'Pedro Sánchez', estado: 'Cancelado', fecha: '2025-11-11', total: '$95.50' },
    { id: 'PED006', cliente: 'Laura Rodríguez', estado: 'En proceso', fecha: '2025-11-12', total: '$540.00' },
    { id: 'PED007', cliente: 'Diego Fernández', estado: 'Entregado', fecha: '2025-11-12', total: '$630.75' }
];

// Inicializar el validador
const validator = new DataIntegrityValidator();

// Elementos del DOM
let searchInput;
let searchButton;
let validationStatus;
let detectionDetails;
let resultsContainer;

// Elementos de estadísticas
let totalSearchesElement;
let validSearchesElement;
let blockedSearchesElement;
let validationRateElement;

/**
 * Inicializa la aplicación
 */
function init() {
    // Obtener referencias a elementos del DOM
    searchInput = document.getElementById('searchInput');
    searchButton = document.getElementById('searchButton');
    validationStatus = document.getElementById('validationStatus');
    detectionDetails = document.getElementById('detectionDetails');
    resultsContainer = document.getElementById('resultsContainer');
    
    totalSearchesElement = document.getElementById('totalSearches');
    validSearchesElement = document.getElementById('validSearches');
    blockedSearchesElement = document.getElementById('blockedSearches');
    validationRateElement = document.getElementById('validationRate');

    // Agregar event listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Validar en tiempo real mientras el usuario escribe
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.length > 0) {
            performValidation(e.target.value, false);
        } else {
            hideValidationStatus();
        }
    });

    console.log('Aplicación inicializada correctamente');
}

/**
 * Maneja el evento de búsqueda
 */
function handleSearch() {
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        alert('Por favor ingrese un término de búsqueda');
        return;
    }

    // Realizar validación completa
    const validationResult = performValidation(searchTerm, true);
    
    if (validationResult.isValid) {
        // Realizar búsqueda si la validación pasó
        performSearch(validationResult.input);
    } else {
        // Limpiar resultados si la búsqueda fue bloqueada
        showNoResults('Búsqueda bloqueada por razones de seguridad');
    }
    
    // Actualizar estadísticas
    updateStats();
}

/**
 * Realiza la validación del input
 * @param {string} input - Texto a validar
 * @param {boolean} showDetails - Mostrar detalles de detección
 * @returns {Object} Resultado de la validación
 */
function performValidation(input, showDetails) {
    const result = validator.validate(input);
    
    // Mostrar estado de validación
    showValidationStatus(result);
    
    // Mostrar detalles si hay amenazas y se requiere
    if (result.threats.length > 0 && showDetails) {
        showDetectionDetails(result.threats);
    } else {
        hideDetectionDetails();
    }
    
    return result;
}

/**
 * Muestra el estado de validación
 * @param {Object} result - Resultado de la validación
 */
function showValidationStatus(result) {
    const statusIcon = validationStatus.querySelector('.status-icon');
    const statusMessage = validationStatus.querySelector('.status-message');
    
    validationStatus.classList.remove('hidden', 'valid', 'invalid');
    
    if (result.isValid) {
        validationStatus.classList.add('valid');
        statusIcon.textContent = '✓';
        statusMessage.textContent = result.message;
    } else {
        validationStatus.classList.add('invalid');
        statusIcon.textContent = '✗';
        statusMessage.textContent = result.message;
    }
}

/**
 * Oculta el estado de validación
 */
function hideValidationStatus() {
    validationStatus.classList.add('hidden');
    hideDetectionDetails();
}

/**
 * Muestra los detalles de las amenazas detectadas
 * @param {Array} threats - Lista de amenazas
 */
function showDetectionDetails(threats) {
    const detailsContent = detectionDetails.querySelector('.details-content');
    
    let html = '<ul>';
    threats.forEach(threat => {
        html += `
            <li>
                <strong>${threat.type}</strong> (Severidad: ${threat.severity})<br>
                ${threat.description}
            </li>
        `;
    });
    html += '</ul>';
    
    detailsContent.innerHTML = html;
    detectionDetails.classList.remove('hidden');
}

/**
 * Oculta los detalles de detección
 */
function hideDetectionDetails() {
    detectionDetails.classList.add('hidden');
}

/**
 * Realiza la búsqueda en los pedidos
 * @param {string} searchTerm - Término de búsqueda sanitizado
 */
function performSearch(searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const results = mockOrders.filter(order => {
        return order.id.toLowerCase().includes(lowerSearchTerm) ||
               order.cliente.toLowerCase().includes(lowerSearchTerm) ||
               order.estado.toLowerCase().includes(lowerSearchTerm);
    });

    displayResults(results);
}

/**
 * Muestra los resultados de la búsqueda
 * @param {Array} results - Lista de pedidos encontrados
 */
function displayResults(results) {
    if (results.length === 0) {
        showNoResults('No se encontraron pedidos que coincidan con la búsqueda');
        return;
    }

    let html = `
        <table class="order-table">
            <thead>
                <tr>
                    <th>ID Pedido</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    results.forEach(order => {
        const estadoClass = getEstadoClass(order.estado);
        html += `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.cliente}</td>
                <td><span class="badge ${estadoClass}">${order.estado}</span></td>
                <td>${order.fecha}</td>
                <td><strong>${order.total}</strong></td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <p style="margin-top: 15px; color: #666;">
            Se encontraron ${results.length} resultado${results.length !== 1 ? 's' : ''}
        </p>
    `;

    resultsContainer.innerHTML = html;
}

/**
 * Muestra mensaje cuando no hay resultados
 * @param {string} message - Mensaje a mostrar
 */
function showNoResults(message) {
    resultsContainer.innerHTML = `<p class="no-results">${message}</p>`;
}

/**
 * Obtiene la clase CSS según el estado del pedido
 * @param {string} estado - Estado del pedido
 * @returns {string} Clase CSS
 */
function getEstadoClass(estado) {
    switch (estado.toLowerCase()) {
        case 'entregado':
            return 'badge-success';
        case 'en proceso':
            return 'badge-warning';
        case 'pendiente':
            return 'badge-info';
        case 'cancelado':
            return 'badge-danger';
        default:
            return '';
    }
}

/**
 * Actualiza las estadísticas en la interfaz
 */
function updateStats() {
    const stats = validator.getStats();
    
    totalSearchesElement.textContent = stats.total;
    validSearchesElement.textContent = stats.valid;
    blockedSearchesElement.textContent = stats.blocked;
    validationRateElement.textContent = stats.validationRate + '%';
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

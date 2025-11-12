/**
 * Validador de Integridad de Datos
 * Detecta y previene ataques de data tampering en búsquedas
 */

class DataIntegrityValidator {
    constructor() {
        // Patrones de ataque comunes
        this.patterns = {
            sqlInjection: [
                /('|(\\')|(;)|(--)|(\bOR\b)|(\bAND\b)|(\bUNION\b)|(\bSELECT\b)|(\bDROP\b)|(\bINSERT\b)|(\bUPDATE\b)|(\bDELETE\b)|(\bEXEC\b)|(\bEXECUTE\b))/gi,
                /(\bxp_)|(\bsp_)|(\b0x[0-9a-f]+\b)/gi
            ],
            xss: [
                /<script[^>]*>.*?<\/script>/gi,
                /<iframe[^>]*>.*?<\/iframe>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<img[^>]*src[^>]*>/gi,
                /<object[^>]*>.*?<\/object>/gi,
                /<embed[^>]*>/gi
            ],
            pathTraversal: [
                /\.\.\//g,
                /\.\.%2f/gi,
                /\.\.\\/g,
                /%2e%2e%2f/gi
            ],
            commandInjection: [
                /[;|&$`]/g,
                /(\$\()|(\`)/g,
                /\|\|/g,
                /&&/g
            ],
            ldapInjection: [
                /\*/g,
                /[()]/g
            ]
        };
        
        // Contador de validaciones
        this.stats = {
            total: 0,
            valid: 0,
            blocked: 0
        };
    }

    /**
     * Valida la entrada del usuario contra múltiples patrones de ataque
     * @param {string} input - Texto de entrada del usuario
     * @returns {Object} Resultado de la validación
     */
    validate(input) {
        this.stats.total++;
        
        if (!input || input.trim() === '') {
            return {
                isValid: true,
                message: 'Búsqueda válida',
                threats: []
            };
        }

        const threats = [];
        
        // Validar SQL Injection
        for (const pattern of this.patterns.sqlInjection) {
            if (pattern.test(input)) {
                threats.push({
                    type: 'SQL Injection',
                    severity: 'CRÍTICA',
                    description: 'Se detectaron patrones de inyección SQL que podrían comprometer la base de datos'
                });
                break;
            }
        }

        // Validar XSS
        for (const pattern of this.patterns.xss) {
            if (pattern.test(input)) {
                threats.push({
                    type: 'Cross-Site Scripting (XSS)',
                    severity: 'ALTA',
                    description: 'Se detectaron scripts maliciosos que podrían ejecutarse en el navegador'
                });
                break;
            }
        }

        // Validar Path Traversal
        for (const pattern of this.patterns.pathTraversal) {
            if (pattern.test(input)) {
                threats.push({
                    type: 'Path Traversal',
                    severity: 'ALTA',
                    description: 'Se detectaron intentos de acceder a directorios del sistema'
                });
                break;
            }
        }

        // Validar Command Injection
        for (const pattern of this.patterns.commandInjection) {
            if (pattern.test(input)) {
                threats.push({
                    type: 'Command Injection',
                    severity: 'CRÍTICA',
                    description: 'Se detectaron comandos del sistema que podrían ser ejecutados'
                });
                break;
            }
        }

        // Validar LDAP Injection
        for (const pattern of this.patterns.ldapInjection) {
            if (pattern.test(input)) {
                threats.push({
                    type: 'LDAP Injection',
                    severity: 'MEDIA',
                    description: 'Se detectaron caracteres especiales que podrían manipular consultas LDAP'
                });
                break;
            }
        }

        const isValid = threats.length === 0;
        
        if (isValid) {
            this.stats.valid++;
        } else {
            this.stats.blocked++;
        }

        return {
            isValid,
            message: isValid ? 
                '✓ Búsqueda válida - No se detectaron amenazas' : 
                '✗ Búsqueda bloqueada - Se detectaron patrones de ataque',
            threats,
            input: this.sanitize(input)
        };
    }

    /**
     * Sanitiza la entrada del usuario
     * @param {string} input - Texto de entrada
     * @returns {string} Texto sanitizado
     */
    sanitize(input) {
        if (!input) return '';
        
        // Escape de caracteres HTML
        const div = document.createElement('div');
        div.textContent = input;
        let sanitized = div.innerHTML;
        
        // Eliminar caracteres especiales peligrosos
        sanitized = sanitized.replace(/[<>'"`;()]/g, '');
        
        return sanitized.trim();
    }

    /**
     * Obtiene las estadísticas de validación
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            validationRate: this.stats.total > 0 ? 
                ((this.stats.total / this.stats.total) * 100).toFixed(1) : 100
        };
    }

    /**
     * Reinicia las estadísticas
     */
    resetStats() {
        this.stats = {
            total: 0,
            valid: 0,
            blocked: 0
        };
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataIntegrityValidator;
}

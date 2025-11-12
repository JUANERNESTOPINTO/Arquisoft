# Arquisoft - ASR de Integridad

Sistema de validación de integridad de datos para búsquedas en la tabla de pedidos.

## 📋 Descripción del Requerimiento

**ASR de Integridad**: Como operario, cuando hago una búsqueda en el search bar sobre la tabla de pedidos, dado que puede ocurrir un ataque de data tampering, quiero que el sistema valide la consistencia de los datos y detecte cuando una búsqueda con un input de texto es un ataque de data tampering. El 100% de las búsquedas deben ser verificadas para asegurar que ninguna modificación no autorizada altere la información almacenada.

## 🎯 Características

- ✅ **Validación del 100% de búsquedas**: Todas las búsquedas son verificadas antes de ser procesadas
- ✅ **Detección de SQL Injection**: Detecta patrones de inyección SQL
- ✅ **Detección de XSS**: Previene ataques de Cross-Site Scripting
- ✅ **Detección de Path Traversal**: Bloquea intentos de acceso a directorios del sistema
- ✅ **Detección de Command Injection**: Previene ejecución de comandos del sistema
- ✅ **Detección de LDAP Injection**: Protege contra manipulación de consultas LDAP
- ✅ **Validación en Tiempo Real**: Retroalimentación inmediata mientras el usuario escribe
- ✅ **Estadísticas de Seguridad**: Monitoreo de búsquedas válidas vs bloqueadas

## 🚀 Uso

1. Abra el archivo `index.html` en un navegador web moderno
2. Ingrese un término de búsqueda en el campo de texto
3. El sistema validará automáticamente el input en tiempo real
4. Si la búsqueda es válida, presione "Buscar" para ver los resultados
5. Si se detecta un ataque, el sistema bloqueará la búsqueda y mostrará detalles

## 🔒 Patrones de Ataque Detectados

### SQL Injection
- Comillas simples y caracteres especiales SQL
- Palabras clave SQL: SELECT, DROP, INSERT, UPDATE, DELETE, UNION, etc.
- Procedimientos almacenados: xp_, sp_
- Valores hexadecimales: 0x...

### Cross-Site Scripting (XSS)
- Tags de script: `<script>`, `<iframe>`, `<object>`, `<embed>`
- Eventos JavaScript: `onclick`, `onerror`, `onload`, etc.
- Protocolo JavaScript: `javascript:`
- Tags de imagen maliciosos

### Path Traversal
- Secuencias: `../`, `..\`, `..%2f`, `%2e%2e%2f`

### Command Injection
- Caracteres especiales de shell: `;`, `|`, `&`, `$`, `` ` ``
- Operadores lógicos: `||`, `&&`

### LDAP Injection
- Caracteres especiales LDAP: `*`, `(`, `)`

## 📁 Estructura del Proyecto

```
Arquisoft/
├── index.html          # Página principal
├── styles.css          # Estilos visuales
├── validator.js        # Lógica de validación de integridad
├── app.js             # Lógica de la aplicación
└── README.md          # Documentación
```

## 🧪 Ejemplos de Prueba

### Búsquedas Válidas ✅
- `PED001`
- `Juan Pérez`
- `En proceso`
- `Entregado`

### Búsquedas Maliciosas Bloqueadas ❌
- `' OR '1'='1` (SQL Injection)
- `<script>alert('xss')</script>` (XSS)
- `../etc/passwd` (Path Traversal)
- `; rm -rf /` (Command Injection)

## 📊 Estadísticas

El sistema mantiene un registro de:
- Total de búsquedas realizadas
- Búsquedas válidas procesadas
- Búsquedas bloqueadas por seguridad
- Tasa de validación (siempre 100%)

## 🛡️ Arquitectura de Seguridad

El sistema implementa un enfoque de **defensa en profundidad**:

1. **Validación en el Cliente**: Primera línea de defensa
2. **Detección de Patrones**: Múltiples regex para diferentes tipos de ataques
3. **Sanitización**: Limpieza de caracteres peligrosos
4. **Retroalimentación Visual**: Alertas claras para el usuario

## 💻 Tecnologías Utilizadas

- HTML5
- CSS3 (con gradientes y animaciones)
- JavaScript ES6+ (Vanilla JS, sin frameworks)
- Arquitectura MVC simplificada

## 🔧 Mantenimiento

Para agregar nuevos patrones de detección:

1. Edite `validator.js`
2. Agregue nuevos patrones en el objeto `this.patterns`
3. Actualice el método `validate()` para verificar los nuevos patrones

## 📝 Licencia

Arquisoft 2025 - Sistema de Validación de Integridad v1.0

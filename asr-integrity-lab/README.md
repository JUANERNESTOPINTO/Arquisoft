# ASR de Integridad – Laboratorio de Búsqueda Segura

Este laboratorio implementa un **ASR de Integridad** para búsquedas sobre una tabla de pedidos. 
Objetivo: *"El 100% de las búsquedas deben ser verificadas para asegurar que ninguna modificación no autorizada altere la información almacenada, y detectar inputs de búsqueda maliciosos (data tampering)."*

## Arquitectura (alto nivel)
- **API Gateway (HTTP API)** expone `GET /search?q=...`
- **AWS WAF v2** con reglas administradas (CRS, SQLi, BadInputs) y una regex custom → bloquea/etiqueta intentos maliciosos
- **Lambda Search** (Python) valida el input, busca en **DynamoDB Orders**, **verifica HMAC** por cada ítem retornado, registra eventos
- **Secrets Manager** almacena `INTEGRITY_SECRET` para HMAC
- **SNS** `IntegrityAlerts` notifica detecciones de tampering
- **CloudWatch Logs/Metrics**: `SearchesVerified` (1 por búsqueda), `IntegrityMismatch` (>=0), `InputTamperingDetected` (>=0)
- **Lambda Seed**: siembra datos válidos con HMAC
- **Frontend opcional** (S3/CloudFront o local): simple `index.html` con barra de búsqueda
- **JMeter** prueba 1) búsquedas válidas 2) payloads maliciosos 3) caso de dato alterado

## Cómo desplegar (resumen)
1. **Pre-requisitos**: Terraform ≥1.5, AWS CLI configurado, Python 3.11 local para empaquetar lambdas (zip embebido en Terraform).
2. Ir a `infra/terraform` y ejecutar:
   ```bash
   terraform init
   terraform apply -auto-approve
   ```
3. Copiar el `api_url` del output.
4. Ejecutar el **seed** (Terraform crea la Lambda y un *one-shot*): 
   ```bash
   aws lambda invoke --function-name asr-integrity-seed --payload '{"action":"seed"}' /tmp/seed.out
   ```
5. (Opcional) servir `frontend/index.html` localmente y configurar `API_URL` en el archivo.
6. Probar manualmente: `curl "$API_URL/search?q=order-1"`
7. **JMeter**: abrir `jmeter/IntegritySearchTest.jmx`, setear la propiedad `api_url` y correr el plan. Verificar assertions.

## Evidencias para el ASR
- **100% verificadas**: revisar métrica `SearchesVerified == total_requests` en CloudWatch Metrics/Logs.
- **Tampering del input**: WAF bloquea (HTTP 403) o Lambda devuelve 400 y registra `InputTamperingDetected`.
- **Integridad del dato**: forzar un mismatch (ej., editar un item sin recalcular HMAC) → `IntegrityMismatch` > 0, alerta en SNS, respuesta **NO** incluye items inválidos.

## Limpieza
```bash
cd infra/terraform
terraform destroy -auto-approve
```

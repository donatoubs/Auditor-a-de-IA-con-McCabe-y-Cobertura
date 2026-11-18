# Sistema de citas médicas — Auditoría de IA con McCabe y Cobertura

Aplicación académica con Node.js, Express, SQLite y Alpine.js. Incluye reglas de negocio, pruebas Jest, medición de cobertura con c8 y documentación de auditoría.

## Requisitos

- Node.js 20 o superior
- npm
- Git (para publicar el proyecto)

## Instalación

```bash
npm install
```

## Ejecutar la aplicación

```bash
npm start
```

Abrir http://localhost:3000

La base de datos SQLite se crea automáticamente en `data/appointments.sqlite`. Para una ejecución temporal o un despliegue real, configura `DATABASE_FILE` según el entorno.

## Ejecutar las pruebas

```bash
npm test
```

## Medir cobertura

```bash
npm run coverage
```

El resumen aparece en la terminal. El informe HTML se genera en `coverage/index.html`. No se debe asumir que la cobertura es 100 %: registra los valores que produzca tu ejecución real.

## Reglas de negocio implementadas

1. **Edad:** 0–17 años = pediátrico y requiere representante; 18 años o más = adulto.
2. **Horario:** lunes a viernes, 08:00–17:00, slots de 30 minutos, únicamente en el futuro.
3. **Choque:** bloquea mismo médico + mismo inicio si la cita previa no está cancelada.
4. **Cancelación tardía:** menos de 24 horas antes; penalización ilustrativa de $25, salvo emergencia.

El PDF menciona las reglas, pero no especifica todos sus parámetros. Los valores anteriores son supuestos académicos explícitos y deben confirmarse con el docente si se exige fidelidad a una política real.

## Auditoría de McCabe

Consulta [`docs/AUDITORIA_MCCABE.md`](docs/AUDITORIA_MCCABE.md). El PDF usa `V(G)=P+1` y para su ejemplo didáctico de dos condiciones compuestas declara V(G)=3. En el CFG convencional de una función con un solo `if` compuesto, McCabe suele contar un nodo de decisión y obtener V(G)=2. El proyecto documenta la diferencia para evitar confundir complejidad ciclomática con cobertura de condiciones.

## Prueba por mutación manual

1. Abre `src/rules.js`.
2. Dentro de `calculateCancellationPenalty`, cambia temporalmente `if (isLate && !isEmergency)` por `if (isLate || !isEmergency)`.
3. Ejecuta `npm test`; al menos las pruebas de cancelación temprana deberían detectar el cambio.
4. Restaura `&&`.
5. Ejecuta de nuevo `npm test` y confirma que pase.
6. Captura ambas ejecuciones para la evidencia.

No entregues el código con la mutación activada.

## Estructura

```text
src/
  app.js       API REST y validación de solicitudes
  config.js    supuestos y parámetros de negocio
  db.js        esquema SQLite
  rules.js     reglas puras para auditar y probar
  server.js    arranque del servidor
public/
  index.html   interfaz Alpine.js
tests/
  api.test.js  pruebas de integración de API
  rules.test.js pruebas unitarias de reglas
docs/
  AUDITORIA_MCCABE.md
  REFLEXION_METACOGNITIVA.md
```

## Limitaciones conocidas

- Demostración académica, no apta para datos clínicos reales.
- Sin autenticación, roles, controles de privacidad, auditoría de usuarios ni despliegue seguro.
- La zona horaria de las reglas horarias depende del proceso Node.js; para producción debe fijarse la zona horaria de negocio.
- El control de doble reserva está implementado a nivel de aplicación; para un entorno concurrente de producción se recomienda reforzarlo con restricciones transaccionales apropiadas.
- Alpine.js se carga desde CDN, por lo que la interfaz requiere conexión a internet para cargar esa dependencia.

## Publicar en GitHub

Crea un repositorio vacío en https://github.com/new. Desde esta carpeta ejecuta:

```bash
git init
git add .
git commit -m "Implementar sistema de citas y auditoría QA"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/auditoria-ia-mccabe-cobertura.git
git push -u origin main
```

Sustituye `TU_USUARIO` por tu usuario y la URL por la dirección real de tu repositorio. Si Git pide autenticación, sigue el flujo de inicio de sesión de GitHub. Nunca subas tokens, contraseñas ni archivos `.env`.

## Lista de entrega

- [ ] La app inicia y permite reservar/cancelar citas.
- [ ] `npm test` pasa.
- [ ] `npm run coverage` genera el reporte.
- [ ] Se ejecutó y documentó la prueba por mutación.
- [ ] Se completó la reflexión metacognitiva.
- [ ] Se agregaron capturas con resultados reales.
- [ ] Se subió todo a GitHub y se comprobó el enlace.

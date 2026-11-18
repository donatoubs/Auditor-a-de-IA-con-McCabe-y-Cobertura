# Auditoría de caja blanca: McCabe y cobertura

## Base del análisis

El material de clase define la complejidad ciclomática como el número de caminos linealmente independientes y presenta las fórmulas:

- `V(G) = E - N + 2`
- `V(G) = P + 1`
- `V(G) = regiones del grafo`

El taller de la página 8 modela `cancelacionTardia && !esEmergencia` con dos predicados y obtiene `V(G)=3`. Para reproducir el enfoque didáctico, las condiciones booleanas se analizan individualmente y se exigen casos que ejerciten su efecto independiente.

**Nota técnica:** en un CFG convencional, la expresión compuesta dentro de un solo `if` normalmente representa un nodo de decisión y da complejidad ciclomática 2 para esa función. El valor 3 puede usarse como criterio de cobertura de condiciones compuesto en el taller, pero no debe confundirse con el conteo clásico de nodos de decisión. En este repositorio se documentan ambas interpretaciones.

## Reglas del sistema y supuestos explícitos

El PDF pide un sistema de citas médicas y nombra cuatro reglas: edad pediátrica frente a adulta, restricción de horarios, prevención de doble reserva y penalización por cancelación tardía (`< 24 h`). No detalla valores concretos para todas las reglas. Para hacer ejecutable la app se adoptaron estos supuestos:

1. **Edad:** paciente de 0–17 años se clasifica como pediátrico y requiere nombre de representante; a partir de 18 años es adulto.
2. **Horario:** lunes a viernes, de 08:00 a 17:00, en intervalos de 30 minutos; una cita debe terminar antes o a las 17:00 y estar en el futuro.
3. **Choque:** no se permite reservar el mismo inicio para el mismo médico si existe una cita activa. Las citas canceladas no bloquean.
4. **Cancelación:** menos de 24 horas antes de la cita se considera tardía. Penalización ilustrativa de $25 si no es emergencia; emergencia exime la penalización.
5. **Tiempo:** los timestamps API se convierten a ISO UTC; las reglas horarias usan la zona horaria del proceso Node.js. Para despliegue real, debe fijarse una zona horaria de negocio.
6. **Alcance:** la aplicación es una demostración académica, no un sistema clínico listo para producción.

## CFG simplificado de la penalización

```text
Inicio
  |
¿Fechas válidas y tipo de emergencia válido?
  | no -> devolver error
  | sí
¿Cancelación posterior a la cita?
  | sí -> devolver error
  | no
¿Horas restantes < 24?
  | no -> fee = 0
  | sí
¿Es emergencia?
  | sí -> fee = 0
  | no -> fee = 25
  |
Fin
```

Para el subproblema principal de la clase, la tabla de decisión es:

| cancelacionTardia | esEmergencia | ¿Penalización? | Resultado |
|---|---|---|---:|
| false | false | No | $0 |
| true | false | Sí | $25 |
| true | true | No | $0 |

La tabla anterior permite demostrar el efecto independiente de la tardanza y la excepción de emergencia. La cobertura MC/DC debe argumentarse a partir de los casos; `c8` no certifica MC/DC automáticamente.

## Inventario de decisiones para auditar

| Función | Decisiones relevantes | Riesgo que se prueba |
|---|---|---|
| `calculateAge` | fecha inválida, nacimiento futuro, cumpleaños no ocurrido | clasificación de edad incorrecta |
| `validatePatientAge` | menor/pediátrico, representante presente, adulto | aceptar menor sin representante |
| `validateOperatingHours` | fecha válida, fin de semana, horario, slot, cita futura | reservar fuera del horario |
| `hasAppointmentConflict` | entrada array, mismo médico, mismo instante, cita cancelada | doble reserva |
| `calculateCancellationPenalty` | tipo emergencia, fechas válidas, cita pasada, menos de 24h, emergencia | cobro indebido o exención incorrecta |

## Estrategia de pruebas

- Jest ejecuta pruebas unitarias de las reglas y pruebas de integración de la API.
- Las aserciones comparan resultados concretos con `toBe`, `toEqual` o `toMatchObject`.
- c8 mide sentencias, ramas, funciones y líneas instrumentadas.
- La prueba por mutación sugerida consiste en cambiar `&&` por `||` en la regla de penalización y verificar que la suite falle. Debe restaurarse el código original tras la comprobación.
- La cobertura no reemplaza la revisión de los oráculos, los datos de prueba ni los supuestos de negocio.

## Criterio de refactorización

El material de clase recomienda solicitar refactorización cuando `V(G) > 10`. Este valor se utiliza como umbral de revisión orientativo, no como garantía de calidad. Si una función supera ese umbral, se debe revisar su CFG, separar responsabilidades y repetir las pruebas después de refactorizar.

## Evidencias que se deben agregar antes de entregar

1. Captura de `npm test` con el resultado real.
2. Captura de `npm run coverage` y sus porcentajes reales.
3. Captura de una prueba fallida al aplicar la mutación `&&` → `||`.
4. Captura de las pruebas pasando después de restaurar el código.
5. URL del repositorio remoto.

No escribir porcentajes de cobertura en el informe hasta ejecutar los comandos en el entorno del estudiante.

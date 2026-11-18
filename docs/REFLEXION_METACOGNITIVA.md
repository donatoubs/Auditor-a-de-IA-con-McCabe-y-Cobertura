# Reflexión metacognitiva

## 1. ¿Conozco el número exacto de caminos lógicos V(G) antes de leer los tests generados por la IA?

La auditoría debe comenzar con el análisis de la estructura y el cálculo de McCabe, antes de aceptar los tests propuestos por una IA. Así, los casos se diseñan a partir de la lógica y no solo de la sugerencia automática. En el caso didáctico de la regla `cancelacionTardia && !esEmergencia`, el PDF trata las dos condiciones por separado y pide tres caminos; en un CFG clásico, un solo `if` compuesto tiene complejidad 2. Es importante declarar el criterio usado.

## 2. ¿El 100 % de cobertura que reporta la herramienta incluye aserciones (oráculos) fuertes?

No necesariamente. Una herramienta de cobertura mide ejecución de código, no si se verificó el resultado correcto. Por eso se emplean aserciones estrictas en Jest y se revisa cada resultado esperado.

## 3. ¿Están evaluadas todas las condiciones lógicas, o solo las líneas de código superficiales?

Se diseñaron pruebas para las ramas de las reglas de negocio y casos que muestran el efecto de condiciones booleanas. La cobertura de ramas se obtiene mediante c8; la demostración de MC/DC se realiza revisando la tabla de casos, pues c8 no la mide directamente.

## 4. ¿He forzado intencionalmente fallos (mutaciones) para verificar si los tests de la IA los detectan?

La verificación consiste en modificar temporalmente el operador `&&` por `||` en la penalización. El caso sin cancelación tardía debe fallar porque el resultado dejaría de ser el esperado. La evidencia debe tomarse de la ejecución real; después se restaura el código y se comprueba que la suite pase.

## 5. ¿Es la complejidad del código generado tan alta que la acción correcta es refactorizar en lugar de testear?

El material recomienda refactorizar si `V(G) > 10`. El umbral sirve como señal para inspeccionar funciones complejas. Refactorizar no elimina la necesidad de pruebas: las pruebas deben ejecutarse antes y después para comprobar que el comportamiento se conserva.

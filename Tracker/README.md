# Sincronizador de Hilos de Gmail (Tracker)

## Descripción General

Este proyecto de Google Apps Script automatiza la sincronización de hilos de conversación de Gmail con una hoja de cálculo de Google Sheets. Su propósito principal es rastrear interacciones de clientes que han sido etiquetadas con `Inquiry` o `Complaint`, asegurando que la hoja de cálculo (`inbound_tracker`) sea siempre un reflejo exacto del estado de las etiquetas en Gmail.

El sistema realiza una sincronización completa en cada ejecución: añade hilos nuevos, actualiza los existentes y, lo más importante, elimina aquellos a los que se les ha quitado la etiqueta, manteniendo los datos limpios y fiables.

## Características

-   **Sincronización Completa:** Una única función se encarga de añadir, actualizar y eliminar filas para reflejar perfectamente el estado de Gmail.
-   **Extracción de Datos Clave:** Captura información esencial como el asunto, fechas de primer y último mensaje, remitente, tiempos de respuesta de CX y categoriza las etiquetas.
-   **Alta Eficiencia:** Utiliza un método de comparación en memoria que minimiza las llamadas a la API de Google, resultando en ejecuciones rápidas y que no exceden los límites de tiempo.
-   **Ejecución Segura:** Implementa el `LockService` de Google para gestionar la concurrencia, lo que previene conflictos y corrupción de datos si dos ejecuciones se disparan al mismo tiempo.

## ¿Cómo funciona?

El script opera a través de una única función de sincronización (`syncInboundTracker`) que sigue estos pasos:

1.  **Consulta a Gmail:** Primero, obtiene una lista completa de los IDs de todos los hilos que actualmente tienen las etiquetas configuradas (ej. `inquiry-` o `complaint-`). Esta es la "fuente de la verdad".
2.  **Lectura de la Hoja:** Lee todos los IDs de los hilos que ya están registrados en la hoja de cálculo.
3.  **Fase 1: Actualizar y Crear:** Compara la lista de Gmail con la de la hoja.
    -   Si un hilo de Gmail ya existe en la hoja, actualiza su fila con los datos más recientes.
    -   Si un hilo de Gmail no existe en la hoja, lo añade como una nueva fila al final.
4.  **Fase 2: Borrar:** Compara las listas de nuevo. Si un ID que está en la hoja ya no se encuentra en la lista de hilos válidos de Gmail, significa que su etiqueta fue removida. El script identifica esa fila como obsoleta y la elimina de forma segura.

## Configuración

El script está diseñado para ser muy fácil de configurar:

1.  **Configuración de Etiquetas:** Toda la configuración se encuentra centralizada en el archivo `Config.js`. Puedes modificar la lista `LABELS_TO_QUERY` para cambiar las etiquetas que el script debe rastrear.
2.  **Creación de la Hoja:** No es necesario crear la hoja de cálculo manualmente. El script creará automáticamente una hoja llamada `inbound_tracker` si no la encuentra.

## Uso y Ejecución Automática (Triggers)

Para automatizar el script, solo necesitas configurar **un único trigger** basado en tiempo.

1.  En el editor de Apps Script, ve a la sección **Activadores** (ícono de reloj ⏰).
2.  Crea un nuevo activador.
3.  En "Seleccionar función que se debe ejecutar", elige **`runSyncWithLock`**.
4.  Configura el tipo de evento como "Basado en tiempo" y la frecuencia que desees (ej. "Cada hora").

La función `runSyncWithLock` es la única que necesitas para el trigger, ya que gestiona la sincronización completa y el bloqueo de seguridad.

## Descripción de los Archivos

-   **`Main.js`**: Contiene la lógica principal de sincronización (`syncInboundTracker`) y la función de ejecución segura para el trigger (`runSyncWithLock`).
-   **`Config.js`**: Archivo de configuración central para definir el nombre de la hoja, las etiquetas a buscar y otros parámetros.
-   **`GmailService.js`**: Módulo que encapsula toda la comunicación con la API de Gmail.
-   **`SheetService.js`**: Módulo que gestiona todas las interacciones con la hoja de cálculo (leer, escribir, actualizar y borrar).
-   **`Utils.js`**: Contiene funciones de ayuda para cálculos de fechas y formato.

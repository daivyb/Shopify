# Gestor de Drafts de Órdenes para Shopify

## Descripción General

Este proyecto de Google Apps Script automatiza la creación de borradores de pedidos (Draft Orders) en Shopify. Está diseñado para el equipo de ventas de "Algae Cooking Club" para agilizar la creación de pedidos a partir de datos estructurados en una hoja de cálculo de Google Sheets.

El script lee filas de una hoja de cálculo, busca los IDs de las variantes de producto correspondientes en Shopify y crea borradores de pedidos individuales o agrupados.

## Características

- **Creación de Drafts desde Google Sheets:** Lee directamente desde una hoja de cálculo para crear borradores de pedidos.
- **Creación individual y agrupada:** Permite crear un borrador de pedido por cada fila o agrupar varias filas en un solo borrador de pedido.
- **Búsqueda de variantes de producto:** Obtiene automáticamente el ID de la variante de producto en Shopify a partir de un SKU o nombre.
- **Integración con Shopify:** Se conecta a la API de Shopify para crear los borradores de pedidos.

## ¿Cómo funciona?

1.  El script se ejecuta manualmente/trigger desde el editor de Google Apps Script.
2.  Lee los datos de una hoja de cálculo de Google especificada (`sheetRead.js`).
3.  Para cada artículo, obtiene el ID de la variante de Shopify usando la función `getVariantID.js`.
4.  Crea un borrador de pedido individual (`singleDraft.js`) o un borrador de pedido agrupado para un cliente (`placeGroupedDraft.js`).
5.  Utiliza el servicio de propiedades (`getPropertiesService.js`) para gestionar claves de API y otras configuraciones.

## Descripción de los Archivos

-   **`appsscript.json`**: El archivo de manifiesto del proyecto. Define permisos y configuración.
-   **`.clasp.json`**: Archivo de configuración para la herramienta de línea de comandos `clasp`.
-   **`sheetRead.js`**: Contiene la lógica para leer los datos de la hoja de cálculo de Google.
-   **`getVariantID.js`**: Función para obtener el ID de una variante de producto desde Shopify.
-   **`singleDraft.js`**: Script para crear un borrador de pedido individual por cada línea de la hoja de cálculo.
-   **`placeGroupedDraft.js`**: Script para crear un borrador de pedido que agrupa varios artículos para un solo cliente.
-   **`getPropertiesService.js`**: Gestiona el acceso a las propiedades del script, como las claves de API.

## Configuración

1.  **Clonar el Repositorio**: Clona este repositorio en tu máquina local.
2.  **Google Apps Script**: Sube los archivos a un nuevo proyecto de Google Apps Script utilizando `clasp`.
3.  **Configurar Propiedades del Script**:
    -   En el editor de Apps Script, ve a **Configuración del proyecto > Propiedades del secuencia de comandos**.
    -   Agrega las propiedades necesarias: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_HOSTNAME` y el `SHEET_ID` de la hoja de cálculo que se va a leer.
4.  **Permisos**: Ejecuta una de las funciones manualmente para autorizar los permisos necesarios para Google Sheets y servicios externos (Shopify).

## Uso

Para ejecutar el script, puedes:

-   **Manualmente**: Abrir el proyecto en el editor de Google Apps Script y ejecutar la función `singleDraft` o `placeGroupedDraft` según sea necesario.

# Gestor de Plantillas de Mensajes con Gemini para Shopify

## Descripción General

Este proyecto de Google Apps Script automatiza la generación de borradores de respuestas personalizadas en Gmail, utilizando la inteligencia artificial de Google Gemini y plantillas gestionadas en Notion. Está diseñado para optimizar el proceso de atención al cliente de Shopify, permitiendo al equipo responder de manera más rápida y consistente a diversas consultas y problemas de los clientes.

El script analiza los correos electrónicos entrantes, clasifica su intención, enriquece el contexto con datos detallados de Shopify (clientes, pedidos, estados de envío y de cumplimiento por cada envío) y utiliza Gemini para seleccionar la plantilla de respuesta más adecuada. Finalmente, personaliza la plantilla y crea un borrador de correo electrónico listo para ser enviado.

## Características

-   **Generación Inteligente de Borradores:** Utiliza la IA de Gemini para seleccionar la plantilla de respuesta más apropiada basada en el contenido del correo del cliente y el contexto del pedido de Shopify.
-   **Personalización Dinámica:** Rellena automáticamente las plantillas con datos específicos del cliente y del pedido (nombre, número de pedido, artículos, estado de envío, etc.).
-   **Gestión de Plantillas en Notion:** Permite al equipo de soporte mantener y actualizar fácilmente las plantillas de respuesta en una base de datos de Notion.
-   **Contexto Enriquecido de Shopify:** Integra información detallada de clientes y pedidos de Shopify para decisiones más informadas y respuestas más precisas.
-   **Manejo de Escenarios Complejos:** Capacidad para diferenciar entre problemas de entrega (ej. paquete demorado vs. entregado pero no recibido) y adaptar la respuesta.
-   **Flujo de Trabajo Automatizado:** Desde la clasificación del correo hasta la creación del borrador, el proceso está diseñado para minimizar la intervención manual.

## ¿Cómo funciona?

El script opera a través de la función principal `createDraftReplies`, que orquesta el siguiente flujo de trabajo:

1.  **Configuración Inicial**: Al inicio, el script obtiene todas las etiquetas de clasificación configuradas en Notion y todas las ubicaciones de Shopify (almacenes, tiendas).
2.  **Búsqueda de Correos**: Identifica hilos de correo en Gmail que tienen la etiqueta `GeminiLabeled` y que aún no han sido procesados (`-label:GeminiMessage`).
3.  **Clasificación del Correo**: Utiliza un clasificador interno para determinar la categoría principal del correo (ej. `Complaint/Shipping Issue`). Si no se clasifica, el hilo se ignora.
4.  **Filtrado por Configuración**: Solo procesa hilos cuya etiqueta de clasificación esté configurada en Notion.
5.  **Obtención de Datos de Shopify**:
    *   Busca los detalles del cliente en Shopify usando el email del remitente.
    *   Si encuentra al cliente, obtiene los detalles de su último pedido, incluyendo información de envío y, crucialmente, los detalles del **último evento de seguimiento** del transportista.
6.  **Construcción del Prompt para Gemini**: Se genera un prompt detallado para Gemini que incluye:
    *   El cuerpo del correo del cliente.
    *   Todas las plantillas de respuesta disponibles para la categoría clasificada.
    *   Información completa del cliente y del último pedido de Shopify, incluyendo el estado general de cumplimiento del pedido.
    *   Detalles de **cada envío (fulfillment)**, incluyendo su estado, fechas de entrega y estimadas (en formato Shopify), y los días de retraso/transcurridos desde la entrega.
    *   Detalles del **último evento de seguimiento** del transportista (estado, mensaje, ubicación).
    *   Una lista de **todas las ubicaciones de Shopify** de la empresa.
    *   Reglas explícitas para la selección de plantillas, como priorizar respuestas proactivas para pedidos de un solo artículo o identificar devoluciones a almacenes.
7.  **Selección de Plantilla por Gemini**: Gemini analiza el prompt y devuelve el ID de la plantilla más adecuada.
8.  **Personalización y Creación de Borrador**: La plantilla seleccionada se personaliza con los datos del cliente y del pedido, y se crea un borrador de respuesta en el hilo de correo de Gmail.
9.  **Etiquetado Final**: El hilo de correo se marca con la etiqueta `GeminiMessage` para indicar que ha sido procesado.

## Configuración

1.  **Clonar el Repositorio**: Clona este repositorio en tu máquina local.
2.  **Google Apps Script**: Sube los archivos a un nuevo proyecto de Google Apps Script utilizando `clasp`.
3.  **Claves de API y URLs**:
    *   En el editor de Google Apps Script, ve a **Configuración del proyecto > Propiedades del secuencia de comandos**.
    *   Agrega las siguientes propiedades:
        *   `GEMINI_API_KEY`: Tu clave de API de Google AI Studio para Gemini.
        *   `NOTION_API_KEY`: Tu clave de integración de Notion.
        *   `MASTER_DATABASE_ID`: El ID de tu base de datos maestra de Notion que contiene las configuraciones de plantillas.
        *   `SHOPIFY_API_ACCESS_TOKEN`: Tu token de acceso a la API de Shopify Admin con los scopes necesarios (ej. `read_orders`, `read_customers`, `read_locations`).
        *   `SHOPIFY_SHOP_URL`: La URL de tu tienda Shopify (ej. `tu-tienda.myshopify.com`).
4.  **Permisos**: Ejecuta la función `createDraftReplies` manualmente desde el editor una vez para autorizar los permisos necesarios para Gmail, Google Docs (si aplica), y servicios externos (Shopify, Notion, Gemini).
5.  **Activación de Servicios Avanzados**: Asegúrate de que el servicio avanzado de Gmail esté activado en tu proyecto de Apps Script (Servicios > Servicio avanzado de Gmail API).

## Uso

Para ejecutar el generador de borradores, puedes:

-   **Manualmente**: Abrir el proyecto en el editor de Google Apps Script y ejecutar la función `createDraftReplies`.
-   **Automáticamente**: Configurar un disparador basado en tiempo (por ejemplo, cada 15 minutos) para que la función `createDraftReplies` se ejecute periódicamente.

## Marcadores de Posición (Placeholders)

Para que la personalización funcione, es esencial que las plantillas en Notion usen marcadores de posición con el formato `{{nombre_del_campo}}`. Estos serán reemplazados por datos de Shopify o extraídos del correo.

| Marcador de Posición (`Placeholder`) | Valor de Reemplazo                                                               | Ejemplo                                              |
| ------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `{{customer_name}}`                  | Primer nombre del cliente.                                                       | `John`                                               |
| `{{customer_full_name}}`             | Nombre y apellido del cliente.                                                   | `John Doe`                                           |
| `{{customer_email}}`                 | Correo electrónico del cliente.                                                  | `john.doe@example.com`                               |
| `{{order_id}}`                       | Número del último pedido del cliente.                                            | `1051`                                               |
| `{{order_date}}`                     | Fecha en que se creó el pedido.                                                  | `October 10, 2025`                                         |
| `{{tracking_number}}`                | Número de seguimiento y URL del envío.                                           | `1Z999AA10123456789 (https://www.ups.com/track?...)` |
| `{{order_items}}`                    | Lista de artículos en el pedido.                                                 | `1x Awesome T-Shirt, 2x Cool Mug`                    |
| `{{delivery_status}}`                | Estado del envío (ej. `in_transit`, `delivered`).                                | `in_transit`                                         |
| `{{carrier_name}}`                   | Nombre de la empresa de transporte.                                              | `UPS`                                                |
| `{{expected_delivery_date}}`         | Fecha de entrega estimada proporcionada por el transportista, en formato legible y localizado. | `October 17, 2025`                     |
| `{{delivery_location}}`              | Primera línea de la dirección de envío.                                          | `123 Main St`                                        |
| `{{delivery_date}}`                  | Fecha en que se entregó el paquete, en formato legible y localizado.             | `October 15, 2025`                                         |
| `{{shipping_address}}`               | Dirección de envío completa.                                                     | `123 Main St, Anytown, CA 12345, USA`                 |
| `{{delivery_delay_days}}`            | Días de retraso entre la fecha estimada y la real **para cada envío**.           | `3`                                                  |
| `{{days_since_delivery}}`            | Días transcurridos desde la entrega del paquete **para cada envío**.             | `2`                                                  |
| `{{product_details}}`                | Detalles de los productos (cantidad, nombre y SKU).                              | `1x Awesome T-Shirt (SKU: TSH-BL-L)`                 |
| `{{product_quantity}}`               | Cantidades de los artículos del pedido.                                          | `1, 2`                                               |
| `{{product_name}}`                   | Nombres de los artículos del pedido.                                             | `Awesome T-Shirt, Cool Mug`                          |
| `{{unfulfilled_items}}`              | Lista de artículos pendientes de envío (cantidad, nombre y SKU).                 | `1x Awesome T-Shirt (SKU: TSH-BL-L)`                 |

## Datos Obtenidos de la API de Shopify

A continuación se detallan los campos específicos extraídos de la API de Shopify y el objeto del cual provienen.

| Campo                   | Objeto de Origen      | Descripción Breve                                                 |
| ----------------------- | --------------------- | ----------------------------------------------------------------- |
| `id`                    | `Customer`            | ID único del cliente.                                             |
| `first_name`            | `Customer`            | Nombre del cliente.                                               |
| `last_name`             | `Customer`            | Apellido del cliente.                                             |
| `email`                 | `Customer`            | Correo del cliente.                                               |
| `tracking_number`       | `Fulfillment`         | Número de seguimiento del envío.                                  |
| `tracking_url`          | `Fulfillment`         | URL de seguimiento del envío.                                     |
| `tracking_company`      | `Fulfillment`         | Nombre de la empresa de transporte.                               |
| `shipment_status`       | `Fulfillment`         | Estado detallado del envío (`in_transit`, `delivered`, etc.).     |
| `delivered_at`          | `Fulfillment`         | Fecha de entrega. (Campo calculado por el script a partir de los eventos de seguimiento). |
| `estimated_delivery_at` | `Fulfillment Event`   | Fecha estimada de entrega (obtenida de los eventos del envío).    |
| `status`                | `Fulfillment Event`   | Estado del envío en un evento específico (ej. `delivered`).       |
| `message`               | `Fulfillment Event`   | Mensaje descriptivo del evento del transportista.                 |
| `happened_at`           | `Fulfillment Event`   | Fecha y hora en que ocurrió el evento de seguimiento.             |
| `city`                  | `Fulfillment Event`   | Ciudad donde ocurrió el evento de seguimiento.                    |
| `province`              | `Fulfillment Event`   | Provincia/Estado donde ocurrió el evento de seguimiento.          |
| `country`               | `Fulfillment Event`   | País donde ocurrió el evento de seguimiento.                      |
| `zip`                   | `Fulfillment Event`   | Código Postal donde ocurrió el evento de seguimiento.             |
| `max_delivery_date_time`| `FulfillmentOrder`    | Fecha máxima de entrega (obtenida desde `delivery_method`).       |
| `name`                  | `Line Item`           | Nombre del producto.                                              |
| `quantity`              | `Line Item`           | Cantidad del producto.                                            |
| `sku`                   | `Line Item`           | SKU (Stock Keeping Unit) del producto.                            |
| `fulfillable_quantity`  | `Line Item`           | Cantidad de un artículo que aún no se ha enviado.                 |
| `city`                  | `Location`            | Ciudad de una ubicación de la empresa.                            |
| `province`              | `Location`            | Provincia/Estado de una ubicación de la empresa.                  |
| `country`               | `Location`            | País de una ubicación de la empresa.                              |
| `zip`                   | `Location`            | Código Postal de una ubicación de la empresa.                     |
| `id`                    | `Order`               | ID único del pedido.                                              |
| `order_number`          | `Order`               | Número de pedido visible para el cliente.                         |
| `created_at`            | `Order`               | Fecha de creación del pedido.                                     |
| `financial_status`      | `Order`               | Estado financiero del pedido.                                     |
| `fulfillment_status`    | `Order`               | Estado de preparación del pedido (`partial`, `fulfilled`, etc.).  |
| `shipping_address`      | `Order`               | Objeto con la dirección de envío completa.                        |
| `line_items`            | `Order`               | Lista de productos (artículos de línea) en el pedido.             |
| `fulfillments`          | `Order`               | Lista de envíos asociados al pedido.                              |
| `fulfillment_orders`    | `Order`               | Lista de pedidos de preparación.                                  |
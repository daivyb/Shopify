## Flujo de Trabajo Inteligente

El script sigue un proceso automatizado y optimizado:

1.  **Búsqueda Selectiva**: Encuentra correos con la etiqueta `GeminiLabeled` que hayan sido recibidos **a partir del día actual**, ignorando correos antiguos. Además, excluye los que ya tienen la etiqueta `GeminiMessage` para no procesarlos dos veces.
2.  **Clasificación**: Utiliza el archivo `classifier.js` para identificar la categoría del correo, el cual contiene una lista de etiquetas predefinidas (ej. `Complaint/Shipping Issue`).
    *   **Si se encuentra una etiqueta coincidente**: El script usa esa categoría para continuar el flujo.
    *   **Si no se encuentra ninguna etiqueta coincidente**: El script ignora el correo y no realiza ninguna acción.
3.  **Extracción de Contenido**: **Toma** el hilo de correo y lee únicamente el **primer mensaje**, truncándolo a **1024 caracteres**.
4.  **Consulta a Notion**: **Toma** la categoría identificada del correo y consulta la base de datos de Notion para obtener **todas** las plantillas de respuesta disponibles para esa categoría.
5.  **Enriquecimiento de Datos**: Busca al cliente en Shopify usando su email. Si se encuentra, obtiene los detalles de su **último pedido**, incluyendo el estado de preparación (`fulfillment_status`) y, más importante, los datos de envío del paquete (`fulfillment`).
6.  **Selección con IA (Contexto Mejorado)**: Se construye un prompt para Gemini que incluye:
    *   El cuerpo del correo del cliente.
    *   Las plantillas candidatas de Notion.
    *   **Información crucial del pedido de Shopify**:
        *   **Estado Detallado del Envío**: El estado real del paquete (`shipment_status`, ej: `in_transit`, `delivered`, `failure`).
        *   **Transportista**: El nombre de la empresa de paquetería.
        *   **Número de Seguimiento**.
        *   **Días de Retraso**: Diferencia en días entre la entrega real y la estimada.
        *   **Días Transcurridos desde la Entrega**: Días que han pasado desde que el paquete se marcó como entregado.
    *   Esta información detallada es **esencial** para que Gemini pueda distinguir entre escenarios complejos (ej. un paquete demorado vs. uno marcado como entregado pero no recibido) y elija la plantilla más adecuada.
7.  **Personalización**: Una vez que Gemini selecciona la mejor plantilla, el script reemplaza los placeholders (ej. `{{customer_name}}`, `{{tracking_number}}`) usando los datos de Shopify obtenidos previamente.
8.  **Creación de Borrador**: Genera un borrador de respuesta en el hilo de correo original con el mensaje ya personalizado.
9.  **Etiquetado Final**: Aplica la etiqueta `GeminiMessage` para marcar el hilo como procesado.

## Marcadores de Posición (Placeholders)

Para que la personalización funcione, es esencial que las plantillas en Notion usen marcadores de posición con el formato `{{nombre_del_campo}}`. Estos serán reemplazados por datos de Shopify o extraídos del correo.

| Marcador de Posición (`Placeholder`) | Valor de Reemplazo                                                               | Ejemplo                                              |
| ------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `{{customer_name}}`                  | Primer nombre del cliente.                                                       | `John`                                               |
| `{{customer_full_name}}`             | Nombre y apellido del cliente.                                                   | `John Doe`                                           |
| `{{customer_email}}`                 | Correo electrónico del cliente.                                                  | `john.doe@example.com`                               |
| `{{order_id}}`                       | Número del último pedido del cliente.                                            | `1051`                                               |
| `{{order_date}}`                     | Fecha en que se creó el pedido.                                                  | `10/10/2025`                                         |
| `{{tracking_number}}`                | Número de seguimiento y URL del envío.                                           | `1Z999AA10123456789 (https://www.ups.com/track?...)` |
| `{{order_items}}`                    | Lista de artículos en el pedido.                                                 | `1x Awesome T-Shirt, 2x Cool Mug`                    |
| `{{delivery_status}}`                | Estado del envío (ej. `in_transit`, `delivered`).                                | `in_transit`                                         |
| `{{carrier_name}}`                   | Nombre de la empresa de transporte.                                              | `UPS`                                                |
| `{{expected_delivery_date}}`         | Fecha de entrega estimada proporcionada por el transportista.                    | `viernes, 17 de octubre de 2025`                     |
| `{{delivery_location}}`              | Primera línea de la dirección de envío.                                          | `123 Main St`                                        |
| `{{delivery_date}}`                  | Fecha en que se entregó el paquete.                                              | `15/10/2025`                                         |
| `{{shipping_address}}`               | Dirección de envío completa.                                                     | `123 Main St, Anytown, CA 12345, USA`                 |
| `{{delivery_delay_days}}`            | Días de retraso entre la fecha estimada y la real.                               | `3`                                                  |
| `{{days_since_delivery}}`            | Días transcurridos desde la entrega del paquete.                                 | `2`                                                  |
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
| `id`                    | `Order`               | ID único del pedido.                                              |
| `order_number`          | `Order`               | Número de pedido visible para el cliente.                         |
| `created_at`            | `Order`               | Fecha de creación del pedido.                                     |
| `financial_status`      | `Order`               | Estado financiero del pedido.                                     |
| `fulfillment_status`    | `Order`               | Estado de preparación del pedido (`partial`, `fulfilled`, etc.).  |
| `shipping_address`      | `Order`               | Objeto con la dirección de envío completa.                        |
| `line_items`            | `Order`               | Lista de productos (artículos de línea) en el pedido.             |
| `fulfillments`          | `Order`               | Lista de envíos asociados al pedido.                              |
| `fulfillment_orders`    | `Order`               | Lista de pedidos de preparación.                                  |
| `tracking_number`       | `Fulfillment`         | Número de seguimiento del envío.                                  |
| `tracking_url`          | `Fulfillment`         | URL de seguimiento del envío.                                     |
| `tracking_company`      | `Fulfillment`         | Nombre de la empresa de transporte.                               |
| `shipment_status`       | `Fulfillment`         | Estado detallado del envío (`in_transit`, `delivered`, etc.).     |
| `delivered_at`          | `Fulfillment`         | Fecha en que se entregó el envío.                                 |
| `estimated_delivery_at` | `Fulfillment Event`   | Fecha estimada de entrega (obtenida de los eventos del envío).    |
| `max_delivery_date_time`| `FulfillmentOrder`    | Fecha máxima de entrega (obtenida desde `delivery_method`).       |
| `name`                  | `Line Item`           | Nombre del producto.                                              |
| `quantity`              | `Line Item`           | Cantidad del producto.                                            |
| `sku`                   | `Line Item`           | SKU (Stock Keeping Unit) del producto.                            |
| `fulfillable_quantity`  | `Line Item`           | Cantidad de un artículo que aún no se ha enviado.                 |
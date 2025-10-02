# Estructura de Datos de Shopify

Este documento describe toda la información que se extrae de Shopify según lo definido en `personalizer.js`. Se utiliza un cliente y un pedido de ejemplo para ilustrar los datos.

---

## 📂 Datos del Cliente (`customer`)

| Campo | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `first_name` | Nombre de pila del cliente. | `Ana` |
| `last_name` | Apellido del cliente. | `Pérez` |
| `email` | Correo electrónico del cliente. | `ana.perez@email.com` |

---

## 📦 Datos del Último Pedido (`latestOrder`)

### Información General

| Campo | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `order_number` | Número identificador del pedido. | `1054` |
| `created_at` | Fecha y hora de creación del pedido. | `2023-10-27T10:30:00-05:00` |

### Artículos del Pedido (`line_items`)

*Cada pedido puede tener uno o más artículos.*

| Campo | Descripción | Ejemplo (Artículo 1) |
| :--- | :--- | :--- |
| `quantity` | Cantidad del producto solicitado. | `1` |
| `name` | Nombre del producto. | `Camiseta Clásica - Azul` |
| `sku` | Código de referencia del producto (SKU). | `CAM-AZ-M` |

### Dirección de Envío (`shipping_address`)

| Campo | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `address1` | Línea 1 de la dirección. | `Calle Falsa 123` |
| `address2` | Línea 2 de la dirección (apto, etc.). | `Apto 4B` |
| `city` | Ciudad. | `Ciudad Ejemplo` |
| `province` | Provincia o estado. | `Provincia Central` |
| `zip` | Código postal. | `12345` |
| `country` | País. | `País Ficticio` |

### Información de Cumplimiento y Envío (`fulfillments`)

*NOTA: El script actual solo procesa la información del primer envío (`fulfillments[0]`). No está preparado para manejar pedidos con envíos divididos (múltiples `fulfillments`).*

| Campo | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `tracking_number`| Número de seguimiento del envío. | `1Z999AA10123456784` |
| `tracking_url` | URL para rastrear el envío. | `https://www.carrier.com/track/1Z9...` |
| `tracking_company`| Nombre de la empresa de transporte. | `Carrier Express` |
| `shipment_status`| Estado actual del envío. | `in_transit` |
| `estimated_delivery_at`| Fecha estimada de entrega por la paquetería. | `2023-11-05T18:00:00-05:00` |
| `delivered_at` | Fecha y hora real de la entrega (obtenida de los eventos del envío). | `2023-11-04T14:00:00-05:00` |

---

## ⚙️ Datos Derivados (Calculados por el Script)

*Estos valores no vienen directamente de Shopify, sino que son calculados por el script para usarse en las plantillas y en el prompt de Gemini.*

| Placeholder | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `{{delivery_delay_days}}` | Calcula la diferencia en días entre la fecha de entrega real (`delivered_at`) y la estimada (`estimated_delivery_at`). | `2` |
| `{{days_since_delivery}}` | Calcula la diferencia en días entre la fecha actual y la fecha de entrega real (`delivered_at`). | `5` |

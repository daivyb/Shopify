## Flujo de Trabajo Inteligente

El script sigue un proceso automatizado y optimizado:

1.  **Búsqueda Selectiva**: Encuentra correos con la etiqueta `GeminiLabeled` que hayan sido recibidos **a partir del día actual**, ignorando correos antiguos. Además, excluye los que ya tienen la etiqueta `GeminiMessage` para no procesarlos dos veces.
2.  **Clasificación**: Lee la etiqueta de categoría del correo (ej. `Complaint/Shipping Issue`).
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

## 6. Plantillas de Respuesta con Placeholders (Ejemplos)

Aquí se muestran las plantillas de respuesta con los placeholders que serán reemplazados automáticamente por la información de Shopify o del correo electrónico.

### Complaint: Supply Issue

#### Context: Leaking/Lid open

**Respuesta 1:**
Hi {{customer_name}},

Thank you for reaching out to us.

We truly understand your concern regarding the condition of your product from order #{{order_id}}. To better assist you, could you please provide a photo of the bottle that leaked? This will help us evaluate the situation and take the necessary steps to resolve it.

Looking forward to your response.

Thank you!

**Respuesta 2:**
Hi {{customer_name}},

Thanks so much for sending the photos!

I’m so sorry to hear about the issue with your order #{{order_id}}. We definitely want to make things right for you. I’ve already processed a replacement for the damaged bottle, and it’ll be on its way shortly. You can track its progress here: {{tracking_url}} (Tracking number: {{tracking_number}}). As we are unable to accept returns on food products, feel free to keep or dispose of the damaged product. You can still use the oil as long as the safety seal is intact, but please consider the condition of the bottle when deciding whether to use it.


Apologies again for the inconvenience and thank you for your understanding as we resolve this!

Please let me know if this resolves the issue, or if there's anything else I can help with.


**Respuesta 3:**
Hi {{customer_name}},

Thanks so much for sending the photos!

I'm truly sorry for the frustration and inconvenience you've experienced with your order #{{order_id}}. This is absolutely not the experience we aim to provide.

Due to FDA regulations, we’re unable to accept returns of consumable products. However, I’ve gone ahead and issued a full refund for both bottles—no return needed. Feel free to keep them or share them with someone else.

In most cases, customers receive their refunds within 10 business days, though processing times may vary depending on your bank.


Please let me know if this resolves the issue, or if there's anything else I can help with.

#### Context: Missing Item/Wrong Item

***Respuesta 1**
Hi {{customer_name}},

I’m truly sorry for the mix-up with your order #{{order_id}}. It looks like there was an error with the carrier.

No worries, we’ll make this right. Before we process a replacement, could you please let us know which item(s) were missing? Once we know, your replacement will be on its way shortly. There’s no need to return the additional product, as we are not accepting returns at this time.

Thank you again for your patience.

***Respuesta 2**
Hi {{customer_name}},

I’m truly sorry for the mix-up with your order #{{order_id}}. It looks like there was a mispick at our warehouse / It looks like there was an error with the carrier.

It looks like you were supposed to receive the following item(s):
{{order_items}}

No worries we’ll make this right. I’ve gone ahead and processed a replacement order for the missing item(s), and it should be on its way to you shortly. You can track its progress here: {{tracking_url}} (Tracking number: {{tracking_number}}). There’s no need to return the additional product, as we are not accepting returns at this time.

Thank you again for your patience.

**Respuesta 3:**
Hi {{customer_name}},

Thank you for your response,

As a result, I’ve gone ahead and issued a refund for your order #{{order_id}}.

In most cases, customers receive their refunds within 10 business days, though processing times may vary depending on your bank.

We appreciate your understanding, and once again, I apologize for the inconvenience.


#### Context: Damaged Item:Dented


**Respuesta 1:**
Hi {{customer_name}},

I’m so sorry to hear about the issue with your order #{{order_id}}. We sincerely apologize for the inconvenience this has caused. To assist you as quickly as possible, could you please send us a photo of the product in question?
This will allow us to properly validate the issue and take the next steps.

Thank you for your understanding, and we’re committed to resolving this for you promptly. If you have any other questions, feel free to reach out.

**Respuesta 2:**
Hi {{customer_name}},

Thanks for sending over the picture!

[[We apologize for the inconvenience regarding your order #{{order_id}}.]]

I’ve gone ahead and processed a replacement, and it should be on its way to you soon. You can track its progress here: {{tracking_url}} (Tracking number: {{tracking_number}}). You can still use the oil as long as the safety seal is intact, but please consider the condition of the bottle when deciding whether to use it.

Please let me know if this resolves the issue, or if there's anything else I can help with.

**Respuesta 3:**
Hi {{customer_name}},

Thanks so much for sending the photos!

I'm truly sorry for the frustration and inconvenience you've experienced with your order #{{order_id}}. This is absolutely not the experience we aim to provide.

Due to FDA regulations, we’re unable to accept returns of consumable products. However, I’ve gone ahead and issued a refund for both bottles—no return needed. Feel free to keep them or share them with someone else.

In most cases, customers receive their refunds within 10 business days, though processing times may vary depending on your bank.


Please let me know if this resolves the issue, or if there's anything else I can help with.


#### Context: Damaged Item:Security Seal 

**Respuesta 1:**
Hi {{customer_name}},

I’m so sorry to hear about the issue with your order #{{order_id}}. We sincerely apologize for the inconvenience this has caused. To assist you as quickly as possible, could you please send us a photo of the product in question?
This will allow us to properly validate the issue and take the next steps.

Thank you for your understanding, and we’re committed to resolving this for you promptly. If you have any other questions, feel free to reach out.


**Respuesta 2:**
Hi {{customer_name}},

[[Thanks for sending over the picture!]]

[[We apologize for the inconvenience regarding your order #{{order_id}}.]]

I’ve gone ahead and processed a replacement, and it should be on its way to you soon. You can track its progress here: {{tracking_url}} (Tracking number: {{tracking_number}}). The oil is safe to use as long as the safety seal is fully intact. This situation can sometimes occur due to the sealing process or internal pressure during shipping, but rest assured the product has not been tampered with.

Please let me know if this resolves the issue, or if there's anything else I can help with.


### Complaint: Shipping Issue

#### Context: Delayed Shipping Date (Expected to be delivered)

**Respuesta 1:**
Hi {{customer_name}},

I'm so sorry your delivery is having issues with {{carrier_name}}, sometimes this happens and eventually they do find a way to your address. We will be sure to help you get your package, unfortunately we don't have direct control over shipping.

I’ve checked the tracking number ({{carrier_name}} {{tracking_number}}), and it shows that the package is expected to be delivered on {{expected_delivery_date}} to:

{{shipping_address}}

If your package still does not arrive, we can send you a replacement order free of charge, or a refund on your purchase. However, we kindly ask for your patience as {{carrier_name}} works to resolve the issue.

Thanks for your understanding, and we hope we can get you your products soon!

**Respuesta 2:**
Hi {{customer_name}},

I’m so sorry for the delay with your order {{order_id}}. It appears that the package has been stuck in the system longer than expected.

To make sure you don’t have to wait any longer, I’ll be processing a replacement order for you right away.

Thank you so much for your patience during this. Don’t hesitate to reach out!

#### Contexto2: Delivery Discrepancy (Status: Few days delivered)

**Respuesta 1:**
Hi {{customer_name}},

Thank you for reaching out. I'm sorry to hear about the issue with your order {{order_id}}, but rest assured, we’ll work to resolve this.
I’ve checked the tracking number ({{carrier_name}} {{tracking_number}}), and it shows that the package was delivered to {{delivery_location}} on {{delivery_date}} in {{delivery_address}}.

Could it be that a family member or neighbor received the package on your behalf? Sometimes, {{carrier_name}} marks a package as delivered a bit early, and it arrives within the next 24 hours.

We also recommend contacting your local {{carrier_name}} office, as they may be able to provide additional details about the delivery.
If you're still unable to locate your package, please let us know, and we’ll figure out the next steps!

**Respuesta 2:**
Hi {{customer_name}},

I’m so sorry to hear that. We understand how frustrating this can be.

We’d be happy to send a replacement to the same shipping address as your last order:
{{shipping_address}}

Please let us know if this address is correct or if there’s any other way we can assist you.

Thank you for your understanding,

#### Contexto: Never Delivered (Focus in Carrier)-Return to warehouse

**Respuesta 1:**
Hi {{customer_name}},

I'm so sorry your order {{order_id}} didn’t arrive as expected. There may have been an issue with the carrier {{carrier_name}} due to a possible error in the shipping address or limited access to the delivery location. To ensure a successful delivery, could you please confirm your shipping address? 

The shipment included {{product_details}}, and it was sent to the following address:

{{shipping_address}}

No worries, we’ll make this right. Before I place the replacement order, we’ll wait to receive your updated address to proceed accordingly.

Thank you again for your patience and understanding.

**Respuesta 2:**
Hi {{customer_name}}!

I’ve gone ahead and processed a replacement order for the missing items ({{product_quantity}} {{product_name}}), and it should be on its way to you shortly. If you’d like, feel free to check back with me in a couple of days, and I’ll be happy to provide you with the tracking number {{tracking_number}}.

Thank you again for your patience and understanding.

P.S.: We are using the following shipping address: {{shipping_address}}

#### Contexto: Package not delivered (Status: A lot of days delivered in Shopify)

**Respuesta 1:**
Hi {{customer_name}},

I'm so sorry your order {{order_id}} didn’t arrive as expected. There may have been an issue with the carrier {{carrier_name}} due to a possible error in the shipping address. To ensure a successful delivery, could you please provide your shipping address so we can verify it on our end?

The shipment included {{product_details}}.

No worries, we’ll make this right. Before I place the replacement order, we’ll wait to receive your updated address to proceed accordingly.

While we recommend contacting your local {{carrier_name}} office, as they may be able to provide additional details about the delivery.

Thank you again for your patience and understanding.

**Respuesta 2:**
Hi {{customer_name}},

I'm truly sorry your order {{order_id}} didn’t arrive as expected.

I’ve gone ahead and processed a replacement order for the missing items ({{product_quantity}} {{product_name}}), and it should be on its way to you shortly. If you’d like, feel free to check back with me in a couple of days, and I’ll be happy to provide you with the tracking number {{tracking_number}}.

Thank you again for your patience and understanding.

P.S.: We are using the following shipping address: {{shipping_address}}

#### Contexto: Delivered to Another Address

**Respuesta 1:**
Hi {{customer_name}}!

I'm truly sorry your order {{order_id}} didn’t arrive as expected. There may have been an issue with the carrier {{carrier_name}} due to a possible error in the shipping address. To ensure a successful delivery, could you please provide your shipping address so we can verify it on our end?

The shipment included {{product_details}}, and it was sent to the following address: {{shipping_address}}

No worries, we’ll make this right. Before I place the replacement order, we’ll wait to receive your updated address to proceed accordingly.

While we recommend contacting your local {{carrier_name}} office, as they may be able to provide additional details about the delivery.

Thank you again for your patience and understanding.

**Respuesta 2:**
Hi {{customer_name}},

Thank you for reaching out. I'm sorry to hear about the issue with your order {{order_id}}, but rest assured, we’ll work to resolve this.

Since the package was delivered to the wrong address, we’ve gone ahead and processed a replacement order for you. It will be sent to the correct address:

{{shipping_address}}

We appreciate your patience, and we’ll do everything we can to ensure this one arrives without any further issues.


## 7. Consideraciones Importantes sobre Plantillas

Para que la personalización funcione correctamente, es **esencial** que las plantillas almacenadas en Notion contengan placeholders con el formato `{{nombre_del_campo}}`. Estos placeholders serán reemplazados automáticamente por los datos extraídos de Shopify o del correo electrónico.

**Ejemplos de Placeholders que puedes usar:**

*   `{{customer_name}}`: Primer nombre del cliente.
*   `{{customer_full_name}}`: Nombre completo del cliente.
*   `{{customer_email}}`: Correo electrónico del cliente.
*   `{{order_id}}`: Número de pedido de Shopify.
*   `{{order_date}}`: Fecha de creación del pedido.
*   `{{tracking_number}}`: Número de seguimiento del último envío.
*   `{{tracking_url}}`: URL de seguimiento del último envío.
*   `{{delivery_status}}`: Estado actual de la entrega del pedido (ej. DELIVERED, IN_TRANSIT, PENDING).
*   `{{carrier_name}}`: Nombre de la empresa de transporte (ej. USPS, FedEx).
*   `{{expected_delivery_date}}`: Fecha estimada de entrega del pedido.
*   `{{delivery_location}}`: Ubicación específica donde se entregó el paquete (ej. buzón, puerta principal).
*   `{{delivery_date}}`: Fecha en que se entregó el paquete.
*   `{{delivery_address}}`: Dirección completa de entrega del paquete.
*   `{{delivery_delay_days}}`: Número de días de retraso en la entrega (comparado con la fecha estimada).
*   `{{days_since_delivery}}`: Número de días que han pasado desde la fecha de entrega real.
*   `{{product_details}}`: Detalles de los productos incluidos en el envío (nombre, cantidad, etc.).
*   `{{product_quantity}}`: Cantidad de un producto específico.
*   `{{product_name}}`: Nombre de un producto específico.

Asegúrate de que tus plantillas incluyan estos placeholders donde desees que aparezca la información dinámica.

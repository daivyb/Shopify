// Devuelve la lista de tags y descripciones para uso externo
function getTagReferences() {
  return TAGS;
}
// Referencia de tags y descripciones para clasificación
const TAGS = [
  {
    tag: 'Inquiry/Sales',
    description: 'Consultas y solicitudes relacionadas con compras al por mayor, pedidos de grandes cantidades y coordinación de ventas directas o muestras. Solo se consideran retailers y personas en representacion de la empresa/marca donde el especialista debera forwardear al equipo de ventas.'
  },
  {
    tag: 'Inquiry/Product Info',
    description: 'Preguntas sobre ingredientes, composición, beneficios y contras para la salud, propiedades del producto y su uso en diferentes contextos culinarios donde el especialista debera generar una respuesta informativa.'
  },
  {
    tag: 'Inquiry/Modification Request',
    description: 'Solicitudes de modificación y cancelación de ordenes o suscripciones de compra recurrente donde el especialista debera proceder a modificar la orden en Shopify.'
  },
  {
    tag: 'Inquiry/International Inquiry',
    description: 'Consultas sobre disponibilidad internacional y compras al por mayor o menor fuera de Estados Unidos. Solo se consideran retailers y clientes internacionales donde el especialista debera forwardear al equipo de ventas.'
  },
  {
    tag: 'Inquiry/Other Inquiry',
    description: 'Preguntas generales sobre el servicio, opciones de envío y soporte para el cliente de Algae Cooking Club. Solo se considera a clientes que buscan alguna informacion adicional donde el especialista debera generar una respuesta analitica.'
  },
  {
    tag: 'Inquiry/PR',
    description: 'Comunicaciones relacionadas con relaciones públicas, eventos, colaboraciones y oportunidades de patrocinio donde el especialista debera forwardear al equipo de marketing.'
  },
  {
    tag: 'Inquiry/Status Update',
    description: 'Solicitudes sobre el estado de la orden de un cliente que realizo la compra a traves de Shopify donde el especialista debera brindar informacion segun la informacion de seguimiento que revisara con el carrier. '
  },
  {
    tag: 'Complaint/Platform Issue',
    description: 'Problemas relacionados con el uso de la tienda en Shopify (compra de productos fuera de stock, entre otros) y dificultades para cancelar suscripciones donde el especialista debera actuar a traves de Shopify para apoyar al cliente.'
  },
  {
    tag: 'Complaint/Supply Issue',
    description: 'Incidencias como productos dañados o faltantes, botellas con fugas, envases defectuosos o problemas de calidad en la entrega donde el especialista debera actuar creando un replacement/refund/cancel a traves de Shopify.'
  },
  {
    tag: 'Complaint/Other Complaint Issue',
    description: 'Problemas diversos con pedidos, entregas incorrectas, cargos no autorizados y errores en la gestión de órdenes.'
  },
  {
    tag: 'Complaint/Stock Issue',
    description: 'Quejas por la demora en la entrega del producto o envios en dos o mas partes por falta de stock donde el especialista debera revisar el inventario en Shopify o 3PL.'
  },
  {
    tag: 'Complaint/Shipping Issue',
    description: 'Problemas con el envío, pedidos perdidos, retrasos, falta de información de seguimiento y dificultades para recibir los productos donde el especialista debera verificar la informacion de seguimiento para ver si genera un replacement/refund.'
  },
  {
    tag: 'Complaint/Product Issue',
    description: 'Quejas sobre la calidad del producto respecto a lo que se esperaba donde el especialista debera generar un mensaje explicando las caracteristicas y recomendaciones en el uso optimo del producto.'
  },
   {
    tag: 'Faire',
    description: 'Correos automaticos solo de la plataforma Faire sobre nuevas ordenes de wholesale, notificaciones sobre el envio, depositos y problemas en la orden donde el especialista no genera ninguna accion solo revisa el detalle.'
  },
   {
    tag: 'Shopify Orders',
    description: 'Correos automaticos solo de Shopify como invoices y seguimiento de una orden. El correo contiene en la conversacion a letscook@algaecookingclub.com quien inicio la conversacion, no se considera reply o forward por un cliente porque el cliente puede estar usando dicha informacion automatica para dar contexto a su solicitud. El especialista no genera ninguna accion solo revisa el detalle.'
  },
   {
    tag: 'Airgoods',
    description: 'Correos automaticos solo de Airgoods sobre nuevas ordenes de wholesale, notificaciones sobre el envio, depositos y problemas en la orden donde el especialista no genera ninguna accion solo revisa el detalle.'
  },
  {
    tag: 'Unclassified',
    description: 'Correos de agradecimiento de clientes o servicios por parte de empresas/marcas que buscan lograr una llamada, mensaje o reunion para ofrecer su servicio de pago. Asi como otros correos de spam (automaticos), por ejemplo, el emisor Recharge HQ y otros. Son irrelevantes porque no generan una accion en el especialista de atencion al cliente ni tampoco debe revisar el detalle.'
  },
];

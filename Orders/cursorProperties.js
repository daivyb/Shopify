function setOrdersCursor(cursor) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("ORDERS_CURSOR", cursor);
}

function getOrdersCursor() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty("ORDERS_CURSOR");
}

// function resetOrdersCursor() {
//   const props = PropertiesService.getScriptProperties();
//   props.deleteProperty("ORDERS_CURSOR");
// }

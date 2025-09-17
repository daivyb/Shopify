function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    SHOP_URL: props.getProperty('SHOP_URL'),
    ACCESS_TOKEN: props.getProperty('ACCESS_TOKEN')
  };
}

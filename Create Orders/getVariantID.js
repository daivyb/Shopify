function getVariantIdFromProduct(title) {
  const { SHOP_URL, ACCESS_TOKEN } = getConfig();

  const query = {
    query: `
    {
      products(first: 1, query: "title:'${title}'") {
        edges {
          node {
            title
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  sku
                }
              }
            }
          }
        }
      }
    }
    `
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "X-Shopify-Access-Token": ACCESS_TOKEN },
    payload: JSON.stringify(query)
  };

  try {
    const response = UrlFetchApp.fetch(SHOP_URL, options);
    const data = JSON.parse(response.getContentText());
    const variants = data.data.products.edges[0].node.variants.edges;

    // Buscar por título
    const variant1 = variants.find(v => v.node.title.toLowerCase() === "1 bottle");
    if (variant1) return variant1.node.id;

    // O como alternativa, buscar por SKU que termine en '1x'
    const variantBySku = variants.find(v => v.node.sku && v.node.sku.endsWith("1x"));
    if (variantBySku) return variantBySku.node.id;

    // Si no encontró, devolver la primera como antes
    return variants[0].node.id;
  } catch (e) {
    Logger.log(`Error al obtener variantId para '${title}': ${e}`);
    return null;
  }
}

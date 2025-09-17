function createOrder(orderData) {
  const { SHOP_URL, ACCESS_TOKEN } = getConfig();

  const lineItems = orderData.items.map(item => {
    const variantId = getVariantIdFromProduct(item.title);
    if (!variantId) {
      Logger.log(`Omitiendo producto sin variantId: ${item.title}`);
      return null;
    }
    return {
      variantId: variantId,
      quantity: item.quantity
    };
  }).filter(Boolean);
      
  if (lineItems.length === 0) {
    Logger.log(`Pedido omitido, sin productos válidos para: ${orderData.email}`);
    return null;
  }

  const mutation = {
    query: `
      mutation orderCreate($order: OrderCreateOrderInput!) {
        orderCreate(order: $order) {
          order {
            id
            name
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: {
      order: {
        email: orderData.email,
        phone: orderData.phone,
        tags: ["cx", "Samples"],
        billingAddress: {
          address1: orderData.address1,
          address2: orderData.address2,
          city: orderData.city,
          provinceCode: orderData.province,
          countryCode: orderData.country,
          zip: orderData.zip,
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          company: orderData.company
        },
        shippingAddress: {
          address1: orderData.address1,
          address2: orderData.address2,
          city: orderData.city,
          provinceCode: orderData.province,
          countryCode: orderData.country,
          zip: orderData.zip,
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          company: orderData.company
        },
        lineItems: lineItems,
        financialStatus: "PAID",
        note: `Order for company: ${orderData.company}`,
        shippingLines: [
          { 
            title: "Standard Shipping",
            priceSet: {
              shopMoney: {
                amount: 0.00,
                currencyCode: "USD"
              }
            },
          }
        ]
      }
    }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "X-Shopify-Access-Token": ACCESS_TOKEN },
    payload: JSON.stringify(mutation)
  };

  try {
    const resp = UrlFetchApp.fetch(SHOP_URL, options);
    const data = JSON.parse(resp.getContentText());

    if (data.errors) {
        Logger.log(`Shopify API Error: ${JSON.stringify(data.errors)}`);
        return null;
    }

    if (data.data && data.data.orderCreate && data.data.orderCreate.userErrors.length > 0) {
      Logger.log("Errores: " + JSON.stringify(data.data.orderCreate.userErrors));
      return null;
    } else if (data.data && data.data.orderCreate && data.data.orderCreate.order) {
      const orderName = data.data.orderCreate.order.name;
      Logger.log(`Orden creada: ${orderName}`);
      return orderName;
    } else {
        Logger.log(`Unexpected response from Shopify: ${JSON.stringify(data)}`);
        return null;
    }
  } catch (e) {
    Logger.log(`Error en orderCreate: ${e}`);
    return null;
  }
}

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
      mutation orderCreate($input: OrderInput!) {
        orderCreate(input: $input) {
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
      input: {
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
          lastName: orderData.lastName
        },
        shippingAddress: {
          address1: orderData.address1,
          address2: orderData.address2,
          city: orderData.city,
          provinceCode: orderData.province,
          countryCode: orderData.country,
          zip: orderData.zip,
          firstName: orderData.firstName,
          lastName: orderData.lastName
        },
        lineItems: lineItems,
        financialStatus: "PAID",
        note: `Order for company: ${orderData.company}`,
        shippingLine: {
          price: "0.00",
          title: "Standard Shipping"
        }
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

    if (data.data.orderCreate.userErrors.length) {
      Logger.log("Errores: " + JSON.stringify(data.data.orderCreate.userErrors));
      return null;
    } else {
      const orderName = data.data.orderCreate.order.name;
      Logger.log(`Orden creada: ${orderName}`);
      return orderName;
    }
  } catch (e) {
    Logger.log(`Error en orderCreate: ${e}`);
    return null;
  }
}

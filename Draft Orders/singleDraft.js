function createDraftOrder(orderData) {
  const { SHOP_URL, ACCESS_TOKEN } = getConfig();

  // Definir bundles y productos individuales (por tener alias en el sheet)
  const bundleMap = {
    "AllPurpose1Bottle": ["Chef-Grade Algae Cooking Oil (Gifting)"],
    "ACC-1xChili_1xMushroom-Bundle": ["Shiitake Mushroom Oil (Gifting)", "Gochugaru Chili Oil (Gifting)"],
    "ACC-Bundle-Small": ["Chef-Grade Algae Cooking Oil (Gifting)", "Shiitake Mushroom Oil (Gifting)", "Gochugaru Chili Oil (Gifting)"],
    "ACC-Squeeze-Trio": ["Shiitake Mushroom Oil (Gifting)", "Gochugaru Chili Oil (Gifting)", "Chef-Grade Algae Cooking Oil 7oz (Gifting)"]
  };

  // Crea considerando Bundles y No Bundles.
  const lineItems = orderData.items.flatMap(item => {
    const titles = bundleMap[item.title] || [item.title];

    return titles.map(title => {
      const variantId = getVariantIdFromProduct(title);
      if (!variantId) {
        Logger.log(`Omitiendo producto sin variantId: ${title}`);
        return null;
      }
      return { 
        variantId: variantId,
        quantity: item.quantity
      };
    })
    .filter(Boolean);
  });
      
if (lineItems.length === 0) {
  Logger.log(`Pedido omitido, sin productos válidos para: ${orderData.email}`);
  return null; // no continúa si no hay productos válidos
}

  const mutation = {
    query: `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            name
            invoiceUrl
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
        tags: orderData.type,
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
          provinceCode: orderData.province, // código ISO
          countryCode: orderData.country,  // código ISO
          zip: orderData.zip,
          firstName: orderData.firstName,
          lastName: orderData.lastName
        },
        lineItems: lineItems,
        appliedDiscount: {
          value: 100,
          valueType: "PERCENTAGE"
        },
        useCustomerDefaultAddress: false
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

    if (data.data.draftOrderCreate.userErrors.length) {
      Logger.log("Errores: " + JSON.stringify(data.data.draftOrderCreate.userErrors));
    } else {
      Logger.log(`Draft creada: ${data.data.draftOrderCreate.draftOrder.name}`);
    }
    return data;
  } catch (e) {
    Logger.log(`Error en draftOrderCreate: ${e}`);
    return null;
  }
}


// function testCreateDraftOrder() {
//   const testOrder = {
//     firstName: "Mardi",
//     lastName: "Phillips",
//     address1: "19 Waratah Way",
//     address2: "",
//     postalcode: "3690",
//     country: "AU",        // código ISO
//     state: "VIC",      // código ISO para Victoria
//     city: "Wodonga",
//     email: "letscook@algaecookingclub.com",
//     phone: "",            // si no hay teléfono
//     type: "Seeding",
//     items: [
//       {
//         title: "AllPurpose1Bottle",
//         quantity: 1
//       }
//     ]
//   };

//   const result = createDraftOrder(testOrder);
// }
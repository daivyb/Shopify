function fetchOrdersWithLineItems() {
  const { SHOP_URL, ACCESS_TOKEN } = getConfig();
  const savedCursor = getOrdersCursor();

  const query = `
    query ($numOrders: Int!, $cursor: String, $lineItemsFirst: Int!, $lineItemsCursor: String) {
      orders(first: $numOrders, after: $cursor) {
        edges {
          cursor
          node {
            id
            name
            channelInformation {
              channelDefinition { subChannelName }
            }
            createdAt
            updatedAt
            closedAt
            cancelledAt
            email
            tags
            shippingAddress {
              company
              name
              phone
              country
              countryCodeV2
              province
              provinceCode
              city
              zip
            }
            statusPageUrl
            displayFulfillmentStatus
            displayFinancialStatus
            totalRefundedSet {
              shopMoney { amount currencyCode }
            }
            fulfillments {
              inTransitAt
              trackingInfo { company number url }
              location { name }
            }
            subtotalPriceSet {
              shopMoney { amount currencyCode }
            }
            totalDiscountsSet {
              shopMoney { amount currencyCode }
            }
            totalShippingPriceSet {
              shopMoney { amount currencyCode }
            }
            totalPriceSet {
              shopMoney { amount currencyCode }
            }

            lineItems(first: $lineItemsFirst, after: $lineItemsCursor) {
              edges {
                cursor
                node {
                  id
                  title
                  quantity
                  currentQuantity
                  unfulfilledQuantity
                  originalUnitPriceSet {shopMoney { amount currencyCode }}
                  originalTotalSet {shopMoney { amount currencyCode }}
                  discountedUnitPriceSet {shopMoney { amount currencyCode }}
                  discountedTotalSet {shopMoney { amount currencyCode }}
                  totalDiscountSet {shopMoney { amount currencyCode }}
                  sku
                  variant {
                    id
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
    `;

  const variables = {
    numOrders: 50,
    cursor: savedCursor || null,
    lineItemsFirst: 50,
    lineItemsCursor: null
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "X-Shopify-Access-Token": ACCESS_TOKEN },
    payload: JSON.stringify({ query, variables })
  };

  const resp = UrlFetchApp.fetch(SHOP_URL, options);
  const data = JSON.parse(resp.getContentText());
  const orders = data.data.orders.edges;
  const pageInfo = data.data.orders.pageInfo;
  
  // Iterar en cada orden
  orders.forEach(orderEdge => {
    const order = orderEdge.node;
    
    // ==== LINE ITEMS ====
    let lineItemsEdges = order.lineItems.edges;
    let lineItemsPageInfo = order.lineItems.pageInfo;

    while (lineItemsPageInfo.hasNextPage) {
      variables.lineItemsCursor = lineItemsPageInfo.endCursor;
      options.payload = JSON.stringify({ query, variables });
      const respLine = UrlFetchApp.fetch(SHOP_URL, options);
      const dataLine = JSON.parse(respLine.getContentText());
      const newEdges = dataLine.data.orders.edges[0].node.lineItems.edges;
      lineItemsPageInfo = dataLine.data.orders.edges[0].node.lineItems.pageInfo;
      lineItemsEdges = lineItemsEdges.concat(newEdges);
    }
    order.lineItems.edges = lineItemsEdges; // reemplazamos con todos los lineItems

  });

  //if (orders.length > 0) setOrdersCursor(pageInfo.endCursor);

  return orders; // <--- Devolver las órdenes completas
}


// function testFetchOrders() {
//   const orders = fetchOrdersWithLineItems();

//   if (orders.length > 0) {
//     // Mostrar la primera orden completa en el log
//     const firstOrder = orders[0].node;
//     Logger.log(JSON.stringify(firstOrder, null, 2)); // formatea el JSON para mejor lectura
//   } else {
//     Logger.log("No orders found");
//   }
// }

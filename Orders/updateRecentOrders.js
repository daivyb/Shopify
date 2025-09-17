function updateOrdersByUpdatedAt() {
  const { SHOP_URL, ACCESS_TOKEN } = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Orders");
  if (!sheet) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Crear un mapa OrderID -> fila y guardar updatedAt actual
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  const orderMap = {};
  const updatedAtMap = {};
  data.forEach((row, i) => {
    const orderId = row[1];
    if (!orderMap[orderId]) {
      orderMap[orderId] = [];
    }
    orderMap[orderId].push(i + 2);
    const currentUpdatedAt = new Date(row[6]);
    if (!updatedAtMap[orderId] || currentUpdatedAt < updatedAtMap[orderId]) {
      updatedAtMap[orderId] = currentUpdatedAt;
    }
  });

  let cursor = null;
  let hasNextPage = true;
  const numOrdersPerPage = 50;
  //
  while (hasNextPage) {
    // Query GraphQL
    const query = `
      query ($numOrders: Int!, $cursor: String, $lineItemsFirst: Int!, $lineItemsCursor: String) {
        orders(first: $numOrders, after: $cursor, sortKey: UPDATED_AT, reverse: true) {
          edges {
            cursor
            node {
              id
              name
              channelInformation { channelDefinition { subChannelName } }
              createdAt
              updatedAt
              closedAt
              cancelledAt
              email
              tags
              shippingAddress { company name phone country countryCodeV2 province provinceCode city zip }
              statusPageUrl
              displayFulfillmentStatus
              displayFinancialStatus
              totalRefundedSet { shopMoney { amount currencyCode } }
              fulfillments { inTransitAt trackingInfo { company number url } location { name } }
              subtotalPriceSet { shopMoney { amount currencyCode } }
              totalDiscountsSet { shopMoney { amount currencyCode } }
              totalShippingPriceSet { shopMoney { amount currencyCode } }
              totalPriceSet { shopMoney { amount currencyCode } }
              lineItems(first: $lineItemsFirst, after: $lineItemsCursor) {
                edges {
                  cursor
                  node {
                    id title quantity currentQuantity unfulfilledQuantity
                    originalUnitPriceSet { shopMoney { amount currencyCode } }
                    originalTotalSet { shopMoney { amount currencyCode } }
                    discountedUnitPriceSet { shopMoney { amount currencyCode } }
                    discountedTotalSet { shopMoney { amount currencyCode } }
                    sku
                    variant { id }
                  }
                }
                pageInfo { hasNextPage endCursor }
              }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`;

    const variables = {
      numOrders: numOrdersPerPage,
      cursor: cursor,
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
    const orders = data?.data?.orders?.edges || [];
    // const pageInfo = data?.data?.orders?.pageInfo || {};

    // Procesar lineItems paginados
    orders.forEach(orderEdge => {
      const order = orderEdge.node;
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
      order.lineItems.edges = lineItemsEdges;
    });

    orders.forEach(orderEdge => {
      const order = orderEdge.node;
      const orderId = order.id;
      const updatedAt = new Date(order.updatedAt);

      if (orderMap[orderId] && updatedAt > updatedAtMap[orderId]) {
        const newRows = getOrdersForSheet([orderEdge]);
        const rowNums = orderMap[orderId];

        // Sobrescribir las filas existentes
        for (let i = 0; i < rowNums.length; i++) {
          if (newRows[i]) {
            sheet.getRange(rowNums[i], 1, 1, newRows[i].length).setValues([newRows[i]]);
          } else {
            // Si hay menos filas nuevas que existentes, limpiar las filas sobrantes
            sheet.getRange(rowNums[i], 1, 1, sheet.getLastColumn()).clearContent();
          }
        }

        // Si hay más filas nuevas que existentes, agregarlas al final
        if (newRows.length > rowNums.length) {
          const remainingRows = newRows.slice(rowNums.length);
          sheet.getRange(sheet.getLastRow() + 1, 1, remainingRows.length, remainingRows[0].length).setValues(remainingRows);
        }

        Logger.log(`Orden actualizada: ${order.name} (OrderID: ${orderId})`);
      }
    });

    if (orders.length > 0) {
      const lastOrder = orders[orders.length - 1];
      cursor = lastOrder.cursor;
      hasNextPage = !!cursor;
    } else {
      hasNextPage = false;
    }
  }

  Logger.log("Órdenes existentes actualizadas según updatedAt.");
}

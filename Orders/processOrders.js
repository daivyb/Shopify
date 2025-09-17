function getOrdersForSheet(ordersData) {
  if (!ordersData || ordersData.length === 0) return [];

  const rows = [];

  ordersData.forEach((edge) => {
    const order = edge.node;
    const channelInformation = order.channelInformation?.channelDefinition?.subChannelName || "";
    const totalRefunded = order.totalRefundedSet?.shopMoney?.amount || "";
    const subTotalPrice = order.subtotalPriceSet?.shopMoney?.amount || "";
    const totalDiscount = order.totalDiscountsSet?.shopMoney?.amount || "";
    const totalPrice = order.totalPriceSet?.shopMoney?.amount || "";
    const shipping = order.shippingAddress || {};
    const tags = (order.tags || []).join("\n");
    const totalShippingPrice = order.totalShippingPriceSet?.shopMoney?.amount || "";

    // === Fulfillments en columnas ===
    const maxFulfillments = 1; // Cantidad de fulfillments (Max 2)
    const fulfillmentColumns = [];

    for (let i = 0; i < maxFulfillments; i++) {
      const f = order.fulfillments?.[i] || {};
      const t = f.trackingInfo?.[0] || {}; // solo el primer tracking por fulfillment
      fulfillmentColumns.push(
        f.inTransitAt || "",
        t.company || "",
        t.number || "",
        t.url || "",
        f.location?.name || ""
      );
    }


    order.lineItems.edges.forEach((li) => {
      const item = li.node;
      rows.push([
        order.name,
        order.id,
        channelInformation,
        order.email,
        tags,
        order.createdAt,
        order.updatedAt,
        order.closedAt,
        order.cancelledAt,
        order.statusPageUrl,
        order.displayFulfillmentStatus,
        order.displayFinancialStatus,
        totalRefunded,
        ...fulfillmentColumns,
        shipping.company || "",
        shipping.name || "",
        shipping.phone || "",
        shipping.country || "",
        shipping.countryCodeV2 || "",
        shipping.province || "",
        shipping.provinceCode || "",
        shipping.city || "",
        shipping.zip || "",
        subTotalPrice,
        totalDiscount,
        totalShippingPrice,
        totalPrice,
        item.sku || "",
        item.title || "",
        item.quantity || "",
        item.currentQuantity || "",
        item.unfulfilledQuantity || "",
        item.originalUnitPriceSet?.shopMoney?.amount || "",
        item.originalTotalSet?.shopMoney?.amount || "",
        item.discountedUnitPriceSet?.shopMoney?.amount || "",
        item.discountedTotalSet?.shopMoney?.amount || "",
        item.variant?.id || ""
      ]);
    });
  });

  return rows;
}


// function testGetOrdersForSheet() {
//   // JSON de ejemplo
//   const ordersData = [
//     {
//       node: {
//         name: "#36426",
//         id: "gid://shopify/Order/7139478012197",
//         email: "v4bD3UWHA2IKJMNEHXP4HGWFL2524@scs.tiktokw.us",
//         tags: ["Shipped by TikTok", "TikTokOrderID:577092126219211281"],
//         createdAt: "2025-09-01T12:27:06Z",
//         closedAt: "2025-09-01T12:27:08Z",
//         cancelledAt: null,
//         statusPageUrl: "https://shop.algaecookingclub.com/.../authenticate?key=...",
//         displayFulfillmentStatus: "FULFILLED",
//         displayFinancialStatus: "PAID",
//         totalRefundedSet: { shopMoney: { amount: "0.0" } },
//         fulfillments: [
//           {
//             inTransitAt: null,
//             trackingInfo: [],
//             location: { name: "9800 Wilshire Blvd" }
//           }
//         ],
//         shippingAddress: {
//           company: null,
//           name: "Frank Galiano",
//           phone: "(+1)973*****15",
//           country: "United States",
//           province: "New Jersey",
//           city: "Me******",
//           zip: "08840"
//         },
//         currentSubtotalPriceSet: { shopMoney: { amount: "20.00" } },
//         currentTotalDiscountsSet: { shopMoney: { amount: "0.00" } },
//         totalShippingPriceSet: { shopMoney: { amount: "5.00" } },
//         currentTotalPriceSet: { shopMoney: { amount: "25.00" } },
//         lineItems: {
//           edges: [
//             {
//               node: {
//                 sku: "SKU123",
//                 title: "Producto Test",
//                 quantity: 1,
//                 currentQuantity: 1,
//                 unfulfilledQuantity: 0,
//                 originalUnitPriceSet: { shopMoney: { amount: "20.00" } },
//                 originalTotalSet: { shopMoney: { amount: "20.00" } },
//                 discountedUnitPriceSet: { shopMoney: { amount: "20.00" } },
//                 discountedTotalSet: { shopMoney: { amount: "20.00" } },
//                 variant: { id: "gid://shopify/ProductVariant/987654" }
//               }
//             }
//           ]
//         }
//       }
//     }
//   ];
//   const rows = getOrdersForSheet(ordersData);
//   Logger.log(JSON.stringify(rows, null, 2));
// }


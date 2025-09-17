function processGroupedDraftOrders() {
  const rows = getSheetData();

  const grouped = {};

  rows.forEach(row => {
    const key = [
      "letscook@algaecookingclub.com",
      row.FirstName,
      row.LastName,
      row.Address1,
      row.Address2,
      row.City,
      row.State,
      row.Country,
      row.PostalCode,
      row.Phone,
      "Seeding",
      row.ShippingSpeed
    ].join("||");

    if (!grouped[key]) {
      grouped[key] = {
        email: "letscook@algaecookingclub.com",
        phone: row.Phone,
        address1: row.Address1,
        address2: row.Address2,
        city: row.City,
        province: row.State,
        country: row.Country,
        zip: row.PostalCode,
        firstName: row.FirstName,
        lastName: row.LastName,
        type: "Seeding",
        shippingSpeed: row.ShippingSpeed,
        items: []
      };
    }

    grouped[key].items.push({
      title: row.Product,
      quantity: Number(row.Quantity) || 1
    });
  });

  Object.values(grouped).forEach(orderData => {
    const result = createDraftOrder(orderData);
    if (result) {
      Logger.log(`Draft creada para: letscook@algaecookingclub.com con ${orderData.items.length} producto(s)`);
    }
  });
}

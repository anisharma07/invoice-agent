const meta = {
  name: "Tablet-Tax-Invoice-2",
  domain: "invoice",
  category: "tax_invoice",
  deviceType: "tablet",
};
// the logo/signature/any image cell should be converted to html format in savestr
// Items attribute is iterable
// Cell mappings only defines the cells which are editable
// other cells are static and should be generated accordingly in the template
const CellMappings = {
  logo: {
    sheet1: "F5",
  },
  signature: {
    sheet1: "D38",
  },
  text: {
    sheet1: {
      Heading: "B2",
      Date: "D20",
      InvoiceNumber: "C18",
      From: {
        Name: "C12",
        StreetAddress: "C13",
        CityStateZip: "C14",
        Phone: "C15",
        Email: "C16",
      },
      BillTo: {
        Name: "C5",
        StreetAddress: "C6",
        CityStateZip: "C7",
        Phone: "C8",
        Email: "C9",
      },
      Items: {
        Name: "Items",
        Heading: "Items",
        Subheading: "Item",
        Rows: {
          start: 23,
          end: 35,
        },
        Columns: {
          Description: "C",
          Amount: "F",
        },
      },
    },
  },
}
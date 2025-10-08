// ================================= CONFIGURATION =================================
const CONFIG = {
  SHEET_NAME: 'inbound_tracker',
  CX_EMAIL: 'letscook@algaecookingclub.com',
  LABELS_TO_QUERY: [
    'label:complaint-customer-issue',
    'label:complaint-other-complaint-issue',
    'label:complaint-platform-issue',
    'label:complaint-product-issue',
    'label:complaint-shipping-issue',
    'label:complaint-stock-issue',
    'label:complaint-supply-issue',
    'label:inquiry-international-inquiry',
    'label:inquiry-modification-request',
    'label:inquiry-other-inquiry',
    'label:inquiry-product-info',
    'label:inquiry-status-update'
  ],
  SEARCH_QUERY_AFTER: 'after:2024/12/01',
  REQUIRED_LABEL_PREFIXES: ['inquiry-', 'complaint-'],
  HEADER_ROW: [
    'ID', 'Subject', 'First Message Date', 'Last Message Date', 'Total Response Time (hrs)',
    'Message Count', 'Sender Email', 'Thread Link', 'Labels', 'Category', 'Subcategory',
    'Outcome', 'Pending', 'Week', 'Month', 'Day', 'CX Response Time (hrs)', 'responseGroup'
  ]
};
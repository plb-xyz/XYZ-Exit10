<template></template>

<style>
/* Debug helper: give the table a visible outline so you can confirm CSS is loading */
.pt-month-table {
  outline: 2px dashed rgba(159,0,245,.35);
  outline-offset: 4px;
}

/* Zebra striping (Vuetify v-data-table) */
.pt-month-table table tbody tr:nth-child(odd) > td {
  background-color: #ffffff !important;
}

.pt-month-table table tbody tr:nth-child(even) > td {
  background-color: #f3f4f6 !important; /* light grey */
}

/* Keep header readable */
.pt-month-table table thead th {
  background-color: var(--v-theme-surface, #ffffff) !important;
}

/* Optional: hover */
.pt-month-table table tbody tr:hover > td {
  background-color: rgba(159,0,245,.08) !important;
}
</style>
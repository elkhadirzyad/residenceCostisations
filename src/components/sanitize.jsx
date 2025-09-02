export const sanitize = (str) =>
  str.normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/\s+/g, "_")
     .replace(/[^a-zA-Z0-9._-]/g, "");

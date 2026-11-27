import { apiData } from "../api/client";

let cache = null;

// Har category: { id, name, icon, productCount }
export async function fetchCategories({ force = false } = {}) {
  if (cache && !force) return cache;
  cache = await apiData("/categories");
  return cache;
}

function changed() {
  cache = null;
  window.dispatchEvent(new Event("productsUpdated"));
}

// ---------- ADMIN ----------

export async function createCategory({ name, icon }) {
  const saved = await apiData("/categories", { method: "POST", body: { name, icon } });
  changed();
  return saved;
}

export async function updateCategory(id, fields) {
  const saved = await apiData(`/categories/${id}`, { method: "PUT", body: fields });
  changed();
  return saved;
}

export async function deleteCategory(id) {
  await apiData(`/categories/${id}`, { method: "DELETE" });
  changed();
}

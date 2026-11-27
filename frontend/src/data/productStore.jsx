import { apiData } from "../api/client";

// Store chhota hai, is liye saare products ek saath le aate hain aur
// filter/search/pagination page par hi hoti hai.
let cache = null;

export function getCachedProducts() {
  return cache || [];
}

export async function fetchProducts({ force = false } = {}) {
  if (cache && !force) return cache;
  cache = await apiData("/products", { params: { limit: 500, sort: "newest" } });
  return cache;
}

export async function fetchProduct(id) {
  return apiData(`/products/${id}`);
}

function changed() {
  cache = null;
  window.dispatchEvent(new Event("productsUpdated"));
}

// ---------- ADMIN ----------

export async function createProduct(product) {
  const saved = await apiData("/products", { method: "POST", body: product });
  changed();
  return saved;
}

export async function updateProduct(id, fields) {
  const saved = await apiData(`/products/${id}`, { method: "PUT", body: fields });
  changed();
  return saved;
}

export async function deleteProduct(id) {
  await apiData(`/products/${id}`, { method: "DELETE" });
  changed();
}

// Order lagne ya cancel hone par stock badalta hai
export function invalidateProducts() {
  changed();
}

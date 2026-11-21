
import defaultProducts from "./products";

const MIGRATION_KEY = "products_migration_v2";

export function getProducts() {
  try {
    const savedProducts = localStorage.getItem("products");
    const migrationDone = localStorage.getItem(MIGRATION_KEY);

    // Naye default products ko existing products ke sath merge karo.
    if (!migrationDone) {
      const existingProducts = savedProducts
        ? JSON.parse(savedProducts)
        : [];

      const mergedProducts = [...defaultProducts];

      if (Array.isArray(existingProducts)) {
        existingProducts.forEach((savedProduct) => {
          const existingIndex = mergedProducts.findIndex(
            (product) =>
              String(product.id) === String(savedProduct.id)
          );

          if (existingIndex !== -1) {
            // Existing product ki Admin wali changes preserve karo.
            mergedProducts[existingIndex] = savedProduct;
          } else {
            // Admin ke add kiye hue products bhi preserve karo.
            mergedProducts.push(savedProduct);
          }
        });
      }

      localStorage.setItem("products", JSON.stringify(mergedProducts));
      localStorage.setItem(MIGRATION_KEY, "true");

      return mergedProducts;
    }

    const products = savedProducts
      ? JSON.parse(savedProducts)
      : defaultProducts;

    return Array.isArray(products) ? products : defaultProducts;
  } catch (error) {
    console.error("Products loading error:", error);
    return defaultProducts;
  }
}

export function saveProducts(products) {
  try {
    if (!Array.isArray(products)) {
      throw new Error("Products must be an array.");
    }

    localStorage.setItem("products", JSON.stringify(products));

    // Products update hone par doosre pages ko inform karo.
    window.dispatchEvent(new Event("productsUpdated"));

    return true;
  } catch (error) {
    console.error("Products saving error:", error);
    return false;
  }
}

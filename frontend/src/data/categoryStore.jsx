
const defaultCategories = [
  { id: 1, name: "Electronics", icon: "🎧" },
  { id: 2, name: "Fashion", icon: "👟" },
  { id: 3, name: "Accessories", icon: "⌚" },
  { id: 4, name: "Lifestyle", icon: "✨" },
];

export function getCategories() {
  try {
    const saved = localStorage.getItem("categories");

    if (!saved) {
      localStorage.setItem(
        "categories",
        JSON.stringify(defaultCategories)
      );
      return defaultCategories;
    }

    const savedCategories = JSON.parse(saved);

    // Purani default categories ko preserve karo
    const merged = [...defaultCategories];

    savedCategories.forEach((category) => {
      const index = merged.findIndex(
        (item) => String(item.id) === String(category.id)
      );

      if (index >= 0) {
        merged[index] = category;
      } else {
        merged.push(category);
      }
    });

    localStorage.setItem("categories", JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.error("Categories loading error:", error);
    return defaultCategories;
  }
}

export function saveCategories(categories) {
  localStorage.setItem("categories", JSON.stringify(categories));
}

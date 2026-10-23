import { createStudyCatalog } from "@/domain/study/catalog.service";
import { ELEMENTS } from "./elements";
import { SECTION_CONFIG } from "./sections";

export { CATEGORIES, getCategory } from "./categories";
export { ELEMENTS } from "./elements";
export { SECTION_CONFIG } from "./sections";
export { SYMBOL_ORIGINS } from "./symbol-origins";

export const DEFAULT_CATALOG = createStudyCatalog(ELEMENTS, SECTION_CONFIG);

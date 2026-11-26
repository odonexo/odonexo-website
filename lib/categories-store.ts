import { promises as fs } from "fs";
import path from "path";
import type { Category, CategoryInput } from "@/lib/types/category";
import { seedCategories } from "@/lib/data/categories-seed";
import { getReadableDataDir, getWritableDataDir } from "@/lib/data-paths";
import {
  isBlobJsonEnabled,
  readJsonFromBlob,
  writeJsonToBlob,
} from "@/lib/blob-json";

const BLOB_PATH = "odonexo/categories.json";

function categoriesPath(dir: string) {
  return path.join(dir, "categories.json");
}

const globalStore = globalThis as typeof globalThis & {
  __odonexoCategoriesCache?: Category[];
};

function normalizeCategory(raw: Category): Category {
  return {
    ...raw,
    id: String(raw.id || ""),
    name: String(raw.name || "").trim(),
    nameSq: String(raw.nameSq || "").trim(),
    nameEn: String(raw.nameEn || "").trim(),
    slug: String(raw.slug || "").trim(),
    description: String(raw.description || "").trim(),
    descriptionSq: String(raw.descriptionSq || "").trim(),
    descriptionEn: String(raw.descriptionEn || "").trim(),
    icon: String(raw.icon || "Package"),
    image: raw.image ? String(raw.image) : undefined,
    published: raw.published !== false,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt,
  };
}

function mergeCategoryLists(
  ...lists: (Category[] | null | undefined)[]
): Category[] {
  const map = new Map<string, Category>();

  for (const list of lists) {
    if (!list) continue;
    for (const raw of list) {
      const category = normalizeCategory(raw);
      if (!category.id) continue;
      const existing = map.get(category.id);
      if (!existing) {
        map.set(category.id, category);
        continue;
      }
      const a = new Date(
        existing.updatedAt || existing.createdAt || 0
      ).getTime();
      const b = new Date(
        category.updatedAt || category.createdAt || 0
      ).getTime();
      if (b >= a) map.set(category.id, category);
    }
  }

  return Array.from(map.values());
}

async function readCategoriesFromFile(
  file: string
): Promise<Category[] | null> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw) as Category[];
    if (!Array.isArray(parsed)) return null;
    return parsed.map(normalizeCategory);
  } catch {
    return null;
  }
}

async function readAllCategoriesRaw(): Promise<Category[]> {
  const fromBlob = isBlobJsonEnabled()
    ? await readJsonFromBlob<Category[]>(BLOB_PATH)
    : null;
  const fromWritable = await readCategoriesFromFile(
    categoriesPath(getWritableDataDir())
  );
  const fromRepo = await readCategoriesFromFile(
    categoriesPath(getReadableDataDir())
  );
  const fromMemory = globalStore.__odonexoCategoriesCache || null;

  let merged = mergeCategoryLists(
    fromRepo,
    fromWritable,
    fromMemory,
    fromBlob ? fromBlob.map(normalizeCategory) : null
  );

  if (merged.length === 0) {
    merged = seedCategories.map(normalizeCategory);
  }

  globalStore.__odonexoCategoriesCache = merged;
  return merged;
}

async function writeCategories(categories: Category[]): Promise<void> {
  const normalized = categories.map(normalizeCategory);
  globalStore.__odonexoCategoriesCache = normalized;

  if (isBlobJsonEnabled()) {
    const ok = await writeJsonToBlob(BLOB_PATH, normalized);
    if (!ok) {
      console.error("Kategoriler Blob'a yazılamadı — yerel yedeğe devam");
    }
  }

  const dir = getWritableDataDir();
  const file = categoriesPath(dir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(normalized, null, 2), "utf-8");

  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      const repoDir = getReadableDataDir();
      await fs.mkdir(repoDir, { recursive: true });
      await fs.writeFile(
        categoriesPath(repoDir),
        JSON.stringify(normalized, null, 2),
        "utf-8"
      );
    } catch {
      /* ignore */
    }
  }
}

export async function readAllCategories(): Promise<Category[]> {
  return readAllCategoriesRaw();
}

export async function readPublishedCategories(): Promise<Category[]> {
  const categories = await readAllCategoriesRaw();
  return categories.filter((c) => c.published);
}

export async function getCategoryById(
  id: string
): Promise<Category | undefined> {
  const categories = await readAllCategoriesRaw();
  return categories.find((c) => c.id === id);
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  const categories = await readPublishedCategories();
  return categories.find((c) => c.slug === slug);
}

export async function getCategoryBySlugAdmin(
  slug: string
): Promise<Category | undefined> {
  const categories = await readAllCategoriesRaw();
  return categories.find((c) => c.slug === slug);
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const categories = await readAllCategoriesRaw();
  const now = new Date().toISOString();
  const category = normalizeCategory({
    ...input,
    id: String(Date.now()),
    createdAt: now,
    updatedAt: now,
  });
  categories.unshift(category);
  await writeCategories(categories);
  return category;
}

export type CategoryUpdateInput = Partial<CategoryInput> & {
  published?: boolean | null;
};

export async function updateCategory(
  id: string,
  input: CategoryUpdateInput
): Promise<Category | null> {
  const categories = await readAllCategoriesRaw();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const patch = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<CategoryInput>;

  const updated = normalizeCategory({
    ...categories[index],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  });

  if (input.published === null) {
    updated.published = true;
  }

  categories[index] = updated;
  await writeCategories(categories);
  return updated;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const categories = await readAllCategoriesRaw();
  const filtered = categories.filter((c) => c.id !== id);
  if (filtered.length === categories.length) return false;
  await writeCategories(filtered);
  return true;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

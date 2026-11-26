import { promises as fs } from "fs";
import path from "path";
import type { Product, ProductInput } from "@/lib/types/product";
import { seedProducts } from "@/lib/data/products-seed";
import { normalizeProduct } from "@/lib/product-helpers";
import { getReadableDataDir, getWritableDataDir } from "@/lib/data-paths";
import {
  isBlobJsonEnabled,
  readJsonFromBlob,
  writeJsonToBlob,
} from "@/lib/blob-json";

const BLOB_PATH = "odonexo/products.json";

function productsPath(dir: string) {
  return path.join(dir, "products.json");
}

const globalStore = globalThis as typeof globalThis & {
  __odonexoProductsCache?: Product[];
};

function mergeProductLists(
  ...lists: (Product[] | null | undefined)[]
): Product[] {
  const map = new Map<string, Product>();

  for (const list of lists) {
    if (!list) continue;
    for (const raw of list) {
      const product = normalizeProduct(raw);
      if (!product.id) continue;
      const existing = map.get(product.id);
      if (!existing) {
        map.set(product.id, product);
        continue;
      }
      const a = new Date(
        existing.updatedAt || existing.createdAt || 0
      ).getTime();
      const b = new Date(
        product.updatedAt || product.createdAt || 0
      ).getTime();
      if (b >= a) map.set(product.id, product);
    }
  }

  return Array.from(map.values());
}

async function readProductsFromFile(file: string): Promise<Product[] | null> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw) as Product[];
    if (!Array.isArray(parsed)) return null;
    return parsed.map(normalizeProduct);
  } catch {
    return null;
  }
}

async function readAllProductsRaw(): Promise<Product[]> {
  const fromBlob = isBlobJsonEnabled()
    ? await readJsonFromBlob<Product[]>(BLOB_PATH)
    : null;
  const fromWritable = await readProductsFromFile(
    productsPath(getWritableDataDir())
  );
  const fromRepo = await readProductsFromFile(
    productsPath(getReadableDataDir())
  );
  const fromMemory = globalStore.__odonexoProductsCache || null;

  let merged = mergeProductLists(
    fromRepo,
    fromWritable,
    fromMemory,
    fromBlob ? fromBlob.map(normalizeProduct) : null
  );

  // İlk kurulum: hiç veri yoksa seed ürünleri yükle
  if (merged.length === 0) {
    merged = seedProducts.map(normalizeProduct);
  }

  globalStore.__odonexoProductsCache = merged;
  return merged;
}

async function writeProducts(products: Product[]): Promise<void> {
  const normalized = products.map(normalizeProduct);
  globalStore.__odonexoProductsCache = normalized;

  if (isBlobJsonEnabled()) {
    const ok = await writeJsonToBlob(BLOB_PATH, normalized);
    if (!ok) {
      console.error("Ürünler Blob'a yazılamadı — yerel yedeğe devam");
    }
  }

  const dir = getWritableDataDir();
  const file = productsPath(dir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(normalized, null, 2), "utf-8");

  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      const repoDir = getReadableDataDir();
      await fs.mkdir(repoDir, { recursive: true });
      await fs.writeFile(
        productsPath(repoDir),
        JSON.stringify(normalized, null, 2),
        "utf-8"
      );
    } catch {
      /* ignore */
    }
  }
}

export async function readAllProducts(): Promise<Product[]> {
  const products = await readAllProductsRaw();
  return products.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || 0).getTime()
  );
}

export async function readPublishedProducts(): Promise<Product[]> {
  const products = await readAllProductsRaw();
  return products.filter((p) => p.published);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await readAllProductsRaw();
  return products.find((p) => p.id === id);
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  const products = await readPublishedProducts();
  return products.find((p) => p.slug === slug);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const products = await readAllProductsRaw();
  const now = new Date().toISOString();
  const product = normalizeProduct({
    ...input,
    id: String(Date.now()),
    createdAt: now,
    updatedAt: now,
  });
  products.unshift(product);
  await writeProducts(products);
  return product;
}

export type ProductUpdateInput = Omit<
  Partial<ProductInput>,
  "originalPrice" | "discountPercent" | "images"
> & {
  originalPrice?: number | null;
  discountPercent?: number | null;
  images?: string[] | null;
};

export async function updateProduct(
  id: string,
  input: ProductUpdateInput
): Promise<Product | null> {
  const products = await readAllProductsRaw();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const patch = Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => value !== undefined && value !== null
    )
  ) as Partial<ProductInput>;

  const updated = normalizeProduct({
    ...products[index],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  });

  for (const key of ["originalPrice", "discountPercent", "images"] as const) {
    if (input[key] === null) {
      delete updated[key];
    }
  }
  products[index] = updated;
  await writeProducts(products);
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await readAllProductsRaw();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  await writeProducts(filtered);
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

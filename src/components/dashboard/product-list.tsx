"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, cn } from "@/lib/utils";
import { Search, ChefHat, Wine } from "lucide-react";

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: unknown;
  station: "KITCHEN" | "BAR";
  isAvailable: boolean;
  sku: string | null;
  category: { id: string; name: string };
  variants: { id: string; name: string; price: unknown }[];
}

interface CategoryData {
  id: string;
  name: string;
}

interface ProductListProps {
  products: ProductData[];
  categories: CategoryData[];
}

export function ProductList({ products, categories }: ProductListProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "all" || p.category.id === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="w-full sm:w-auto"
        >
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">Semua</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Product Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => (
          <Card
            key={product.id}
            className={cn(
              "transition-all hover:shadow-md",
              !product.isAvailable && "opacity-60"
            )}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-tight">
                  {product.name}
                </CardTitle>
                <Badge
                  variant={product.isAvailable ? "default" : "secondary"}
                  className="shrink-0 text-xs"
                >
                  {product.isAvailable ? "Tersedia" : "Habis"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {product.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(Number(product.price))}
                </span>
                <div className="flex items-center gap-1">
                  {product.station === "KITCHEN" ? (
                    <ChefHat className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Wine className="h-4 w-4 text-purple-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {product.station === "KITCHEN" ? "Dapur" : "Bar"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{product.category.name}</span>
                {product.variants.length > 0 && (
                  <span>{product.variants.length} varian</span>
                )}
              </div>
              {product.variants.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {product.variants.map((v) => (
                    <Badge key={v.id} variant="outline" className="text-xs">
                      {v.name}: {formatCurrency(Number(v.price))}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs bg-secondary text-white hover:bg-secondary/70 hover:text-white">
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-xs bg-red-500 text-white hover:bg-red-700 hover:text-white">
                  {product.isAvailable ? "Non-aktifkan" : "Aktifkan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="h-8 w-8 mb-2" />
          <p>Tidak ada produk ditemukan</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { ExternalLink, Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { useUserPreferredCurrency } from "@/hooks/useUserPreferredCurrency";

export interface ItemFormData {
  name: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  price?: number;
  currency: string;
  priority: number;
  tags: string[];
}

export interface ItemFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ItemFormData>;
  onSubmit: (data: ItemFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  submitLabel?: string;
}

export function ItemForm({
  mode,
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
  submitLabel,
}: ItemFormProps) {
  const [name, setName] = useState(initialData.name || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [url, setUrl] = useState(initialData.url || "");
  const [imageUrl, setImageUrl] = useState(initialData.imageUrl || "");
  const [price, setPrice] = useState(initialData.price?.toString() || "");
  const [currency, setCurrency] = useState(initialData.currency || "NZD");
  const [priority, setPriority] = useState(initialData.priority?.toString() || "0");
  const [tagsInput, setTagsInput] = useState(initialData.tags?.join(", ") || "");

  // Currency conversion
  const { preferredCurrency } = useUserPreferredCurrency();
  const { convertedPrice } = useCurrencyConversion(Number(price) || 0, currency, preferredCurrency);

  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case "NZD":
        return "NZ$";
      case "USD":
        return "$";
      case "AUD":
        return "A$";
      case "CAD":
        return "C$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "JPY":
        return "¥";
      default:
        return "$";
    }
  };

  // URL scraping state
  const [scrapingUrl, setScrapingUrl] = useState("");
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const [scrapingError, setScrapingError] = useState<{
    message: string;
    errorType?: string;
    suggestion?: string;
    canRetry?: boolean;
  } | null>(null);
  const [scrapingSuccess, setScrapingSuccess] = useState(false);

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData.name !== undefined) setName(initialData.name);
    if (initialData.description !== undefined) setDescription(initialData.description || "");
    if (initialData.url !== undefined) setUrl(initialData.url || "");
    if (initialData.imageUrl !== undefined) setImageUrl(initialData.imageUrl || "");
    if (initialData.price !== undefined) setPrice(initialData.price?.toString() || "");
    if (initialData.currency) setCurrency(initialData.currency);
    if (initialData.priority !== undefined) setPriority(initialData.priority.toString());
    if (initialData.tags !== undefined) setTagsInput(initialData.tags.join(", "));
  }, [initialData]);

  const handleUrlScraping = async () => {
    if (!scrapingUrl.trim()) return;

    setIsScrapingLoading(true);
    setScrapingError(null);

    try {
      const response = await fetch("/api/scrape-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: scrapingUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData; // Throw the full error object
      }

      const scrapedData = await response.json();

      // Check if this is actually an error response with suggestions
      if (scrapedData.error) {
        setScrapingError({
          message: scrapedData.error,
          errorType: scrapedData.errorType,
          suggestion: scrapedData.suggestion,
          canRetry: scrapedData.canRetry,
        });
        return;
      }

      // Auto-populate form fields with scraped data
      if (scrapedData.title && !name.trim()) {
        setName(scrapedData.title);
      }
      if (scrapedData.description && !description.trim()) {
        setDescription(scrapedData.description);
      }
      if (scrapedData.url && !url.trim()) {
        setUrl(scrapedData.url);
      }
      if (scrapedData.imageUrl && !imageUrl.trim()) {
        setImageUrl(scrapedData.imageUrl);
      }
      if (scrapedData.price && !price.trim()) {
        setPrice(scrapedData.price.toString());
      }
      if (scrapedData.currency && currency === "NZD") {
        setCurrency(scrapedData.currency);
      }

      // Clear the scraping URL field after successful scraping
      setScrapingUrl("");
      setScrapingSuccess(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setScrapingSuccess(false), 3000);
    } catch (err) {
      if (err && typeof err === "object" && "error" in err) {
        // Structured error from API
        const apiError = err as {
          error: string;
          errorType?: string;
          suggestion?: string;
          canRetry?: boolean;
        };
        setScrapingError({
          message: apiError.error,
          errorType: apiError.errorType || "",
          suggestion: apiError.suggestion || "",
          canRetry: apiError.canRetry || false,
        });
      } else {
        // Generic error
        setScrapingError({
          message: err instanceof Error ? err.message : "Failed to scrape URL",
          errorType: "unknown",
          suggestion: "Please try again or copy the product details manually.",
          canRetry: true,
        });
      }
    } finally {
      setIsScrapingLoading(false);
    }
  };

  const handleUrlPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedUrl = e.clipboardData.getData("text");

    // Check if it looks like a URL
    if (pastedUrl.startsWith("http://") || pastedUrl.startsWith("https://")) {
      // Small delay to let the input update
      setTimeout(() => {
        if (scrapingUrl === pastedUrl) {
          handleUrlScraping();
        }
      }, 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    // Parse tags from comma-separated string
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      price: price.trim() ? Number.parseFloat(price) : undefined,
      currency,
      priority: Number.parseInt(priority, 10) || 0,
      tags,
    });
  };

  const defaultSubmitLabel = mode === "create" ? "Add Item" : "Update Item";
  const submittingLabel = mode === "create" ? "Adding..." : "Updating...";

  const priorityOptions = [
    { value: "0", label: "No Priority", icon: null },
    { value: "1", label: "Low Priority", icon: <Star className="h-4 w-4" /> },
    { value: "2", label: "Medium Priority", icon: <Star className="h-4 w-4 fill-current" /> },
    {
      value: "3",
      label: "High Priority",
      icon: <Star className="h-4 w-4 fill-current text-red-500" />,
    },
  ];

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Scraping Section */}
        <div className="space-y-3 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Quick Add from URL</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste a product URL to automatically fill in the details
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="url"
                placeholder="https://example.com/product"
                value={scrapingUrl}
                onChange={(e) => setScrapingUrl(e.target.value)}
                onPaste={handleUrlPaste}
                disabled={isScrapingLoading}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleUrlScraping}
              disabled={!scrapingUrl.trim() || isScrapingLoading}
              className="shrink-0"
            >
              {isScrapingLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Fetch Details
                </>
              )}
            </Button>
          </div>
          {scrapingError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <div className="text-red-600 mt-0.5">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{scrapingError.message}</p>
                  {scrapingError.suggestion && (
                    <p className="text-xs text-red-600 mt-1">{scrapingError.suggestion}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {scrapingError.canRetry && (
                      <button
                        type="button"
                        onClick={handleUrlScraping}
                        disabled={isScrapingLoading}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded border border-red-300 disabled:opacity-50"
                      >
                        Try Again
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setScrapingError(null);
                        // Pre-fill URL field if it's not already filled
                        if (scrapingUrl && !url.trim()) {
                          setUrl(scrapingUrl);
                        }
                      }}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded border border-red-300"
                    >
                      Fill Manually
                    </button>
                    <button
                      type="button"
                      onClick={() => setScrapingError(null)}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {scrapingSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <div className="text-green-600">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-800">
                  Product details loaded successfully!
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Item Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="What would you like?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Any specific details, preferences, or notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website Link</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/product"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {price && Number(price) > 0 && convertedPrice && currency !== preferredCurrency && (
              <p className="text-xs text-muted-foreground">
                ≈ {getCurrencySymbol(preferredCurrency)}
                {convertedPrice.toFixed(2)} {preferredCurrency}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="NZD">NZD ($)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            type="text"
            placeholder="electronics, books, clothing (comma-separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">Separate multiple tags with commas</p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={!name.trim() || isSubmitting} className="flex-1">
            {isSubmitting ? submittingLabel : submitLabel || defaultSubmitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </form>
    </div>
  );
}

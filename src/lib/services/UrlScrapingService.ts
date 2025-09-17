interface ScrapedData {
  name: string;
  description?: string;
  url: string;
  imageUrl?: string;
  price?: number;
  currency: string;
}

interface ScrapingError {
  error: string;
  errorType: "validation" | "network" | "timeout" | "blocked" | "parsing" | "unknown";
  suggestion?: string;
  canRetry?: boolean;
}

export class UrlScrapingService {
  private static instance: UrlScrapingService;
  private readonly TIMEOUT_DURATION = 10000; // 10 seconds

  private constructor() {}

  public static getInstance(): UrlScrapingService {
    if (!UrlScrapingService.instance) {
      UrlScrapingService.instance = new UrlScrapingService();
    }
    return UrlScrapingService.instance;
  }

  async scrapeUrl(url: string): Promise<ScrapedData | ScrapingError> {
    try {
      // Validate URL format
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return {
          error: "Invalid URL format",
          errorType: "validation",
          suggestion: "Please check the URL and make sure it starts with http:// or https://",
          canRetry: false,
        };
      }

      // Check if URL is from a supported domain type
      const hostname = parsedUrl.hostname.toLowerCase();
      if (
        hostname === "localhost" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("127.")
      ) {
        return {
          error: "Local URLs are not supported",
          errorType: "validation",
          suggestion: "Please use a public website URL instead",
          canRetry: false,
        };
      }

      // Fetch the page with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_DURATION);

      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; WishlistBot/1.0)",
          },
          signal: controller.signal,
        });
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === "AbortError") {
          return {
            error: "Request timeout",
            errorType: "timeout",
            suggestion:
              "The website took too long to respond. Try again or check if the URL is correct.",
            canRetry: true,
          };
        }

        // Network errors
        if (error instanceof TypeError && error.message.includes("fetch")) {
          return {
            error: "Unable to connect to website",
            errorType: "network",
            suggestion: "Check your internet connection or try a different URL.",
            canRetry: true,
          };
        }

        throw error;
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "Failed to access website";
        let suggestion = "Try again later or check if the URL is correct.";
        let errorType: ScrapingError["errorType"] = "network";
        let canRetry = true;

        switch (response.status) {
          case 403:
            errorMessage = "Access denied by website";
            suggestion =
              "This website blocks automated requests. Try copying the product details manually.";
            errorType = "blocked";
            canRetry = false;
            break;
          case 404:
            errorMessage = "Page not found";
            suggestion = "Please check if the URL is correct and the page still exists.";
            errorType = "network";
            canRetry = false;
            break;
          case 429:
            errorMessage = "Too many requests";
            suggestion = "Please wait a moment before trying again.";
            errorType = "blocked";
            canRetry = true;
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = "Website is currently unavailable";
            suggestion = "The website is having issues. Please try again later.";
            errorType = "network";
            canRetry = true;
            break;
          default:
            errorMessage = `Website returned error ${response.status}`;
            suggestion = "Please try a different URL or try again later.";
        }

        return {
          error: errorMessage,
          errorType,
          suggestion,
          canRetry,
        };
      }

      const html = await response.text();

      // Limit HTML size to prevent memory issues (1MB limit)
      const maxHtmlSize = 1024 * 1024; // 1MB
      const htmlToProcess = html.length > maxHtmlSize ? html.substring(0, maxHtmlSize) : html;

      // Check if this is Amazon and use specialized scraping
      if (hostname.includes("amazon.")) {
        return this.scrapeAmazon(htmlToProcess, url);
      }

      // Extract OpenGraph and meta data for other sites
      const scrapedData = this.extractMetadata(htmlToProcess, url);

      // Check if we got any useful data
      const hasUsefulData =
        scrapedData.name !== "Untitled" ||
        scrapedData.description ||
        scrapedData.price ||
        scrapedData.imageUrl;

      if (!hasUsefulData) {
        return {
          error: "No product information found",
          errorType: "parsing",
          suggestion:
            "This page doesn't seem to contain product information. Try copying the details manually.",
          canRetry: false,
        };
      }

      return scrapedData;
    } catch (error) {
      console.error("Error scraping URL:", error);
      return {
        error: "Something went wrong while processing the page",
        errorType: "unknown",
        suggestion: "Please try again or copy the product details manually.",
        canRetry: true,
      };
    }
  }

  private scrapeAmazon(html: string, originalUrl: string): ScrapedData {
    const data: ScrapedData = {
      name: "Untitled",
      url: originalUrl,
      currency: "USD",
    };

    // Amazon-specific selectors
    const amazonSelectors = {
      title: [
        /<[^>]*id="productTitle"[^>]*>([^<]+)</i,
        /data-automation-id="title"[^>]*>([^<]+)</i,
        /<h1[^>]*class="[^"]*product[^"]*title[^"]*"[^>]*>([^<]+)</i,
        /<span[^>]*id="productTitle"[^>]*>([^<]+)</i,
      ],
      price: [
        // Amazon price classes and selectors (comprehensive patterns)
        // Note: a-price-whole and a-price-fraction are handled separately in combination logic
        /<span[^>]*class="[^"]*a-offscreen[^"]*"[^>]*>(?:A\$|AU\$|NZ\$|CA\$|\$|£|€)\s*([0-9,]+\.?\d{0,2})<\/span>/i,
        /<span[^>]*class="[^"]*a-price-range-price[^"]*"[^>]*>(?:A\$|AU\$|NZ\$|CA\$|\$|£|€)\s*([0-9,]+\.?\d{0,2})<\/span>/i,
        /data-automation-id="price"[^>]*>(?:A\$|AU\$|NZ\$|CA\$|\$|£|€)\s*([0-9,]+\.?\d{0,2})/i,
        /"price":\s*"?([0-9,]+\.?\d{0,2})"?/i, // JSON-LD structured data
        // Amazon-specific price containers
        /<span[^>]*id="[^"]*price[^"]*"[^>]*>(?:A\$|AU\$|NZ\$|CA\$|\$|£|€)\s*([0-9,]+\.?\d{0,2})/i,
        /<div[^>]*class="[^"]*price[^"]*"[^>]*>(?:A\$|AU\$|NZ\$|CA\$|\$|£|€)\s*([0-9,]+\.?\d{0,2})/i,
        // Generic currency patterns (broader search) - removed global flags to prevent memory issues
        /(?:A\$|AU\$|NZ\$|CA\$)\s*([0-9,]+\.?\d{0,2})/i,
        /\$\s*([0-9,]+\.?\d{0,2})/i,
        /£\s*([0-9,]+\.?\d{0,2})/i,
        /€\s*([0-9,]+\.?\d{0,2})/i,
      ],
      image: [
        /"hiRes":"([^"]+)"/i,
        /"large":"([^"]+)"/i,
        /data-old-hires="([^"]+)"/i,
        /id="landingImage"[^>]*src="([^"]+)"/i,
      ],
    };

    // Extract name
    for (const pattern of amazonSelectors.title) {
      const match = html.match(pattern);
      if (match) {
        data.name = this.cleanText(match[1]);
        break;
      }
    }

    // Extract price with Amazon-specific handling
    const foundPrices: number[] = [];
    const maxPricesToFind = 50; // Prevent excessive price collection

    // First, try to find Amazon's split price format (whole.fraction)
    // Look for all whole/fraction pairs that might be on the page
    const wholeMatches = [
      ...html.matchAll(/<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([0-9,]+)<\/span>/gi),
    ];
    const fractionMatches = [
      ...html.matchAll(/<span[^>]*class="[^"]*a-price-fraction[^"]*"[^>]*>([0-9]+)<\/span>/gi),
    ];

    // Combine whole and fraction prices - assume they appear in matching order
    const minPairs = Math.min(wholeMatches.length, fractionMatches.length);
    for (let i = 0; i < minPairs && foundPrices.length < maxPricesToFind; i++) {
      const wholePrice = wholeMatches[i][1].replace(/,/g, "");
      const fraction = fractionMatches[i][1];
      const combinedPrice = Number.parseFloat(`${wholePrice}.${fraction}`);
      if (!Number.isNaN(combinedPrice) && combinedPrice > 0) {
        foundPrices.push(combinedPrice);
      }
    }

    // Then try other patterns - use a safer approach for multiple matches
    for (const pattern of amazonSelectors.price) {
      if (foundPrices.length >= maxPricesToFind) break;

      // For a-offscreen patterns, manually search for multiple occurrences
      if (pattern.source.includes("a-offscreen")) {
        const regex = new RegExp(pattern.source, "gi"); // Create global version for this specific case
        const matches = [...html.matchAll(regex)].slice(0, 10); // Limit to 10 matches
        for (const match of matches) {
          const priceStr = match[1].replace(/,/g, "");
          const price = Number.parseFloat(priceStr);
          if (!Number.isNaN(price) && price > 0 && price < 1000000) {
            foundPrices.push(price);
          }
        }
      } else {
        // For other patterns, use single match
        const match = html.match(pattern);
        if (match) {
          const priceStr = match[1].replace(/,/g, "");
          const price = Number.parseFloat(priceStr);
          if (!Number.isNaN(price) && price > 0 && price < 1000000) {
            foundPrices.push(price);
          }
        }
      }
    }

    // Additional fallback patterns specifically for Amazon
    if (foundPrices.length === 0) {
      const fallbackPatterns = [
        // Look for any decimal numbers after A$ or AU$ in the HTML - removed global flags
        /A\$\s*([0-9]+\.?[0-9]*)/i,
        /AU\$\s*([0-9]+\.?[0-9]*)/i,
        // Look for price in any span or div containing "price" in class
        /<[^>]*class="[^"]*price[^"]*"[^>]*>[^0-9]*([0-9]+\.?[0-9]*)/i,
        // Look for JSON-like structures with price
        /"displayPrice":"[^"]*?([0-9]+\.?[0-9]*)/i,
        /"price":"[^"]*?([0-9]+\.?[0-9]*)/i,
        // Look for data attributes containing price
        /data-[^=]*price[^=]*="[^"]*?([0-9]+\.?[0-9]*)/i,
      ];

      for (const pattern of fallbackPatterns) {
        if (foundPrices.length >= maxPricesToFind) break;

        // Since we removed global flags, use single match instead of matchAll
        const match = html.match(pattern);
        if (match) {
          const priceStr = match[1];
          const price = Number.parseFloat(priceStr);
          if (!Number.isNaN(price) && price >= 1.0 && price < 1000000) {
            foundPrices.push(price);
          }
        }
      }
    }

    if (foundPrices.length > 0) {
      // Smart price selection for Amazon
      // Filter out very low prices (shipping, small items) and very high prices (bundles, premium editions)
      const reasonablePrices = foundPrices.filter((price) => price >= 5.0 && price <= 500.0);

      if (reasonablePrices.length > 0) {
        // For Amazon, don't just take the highest - try to find the most likely main product price
        // Sort prices and choose a middle-range price that's likely the main product
        const sortedPrices = reasonablePrices.sort((a, b) => a - b);

        // Heuristic: If there are multiple prices, avoid the highest and lowest extremes
        // This helps avoid Kindle prices (usually lowest) and bundle/premium prices (highest)
        if (sortedPrices.length >= 3) {
          // Pick the median price as it's often the main product price
          const medianIndex = Math.floor(sortedPrices.length / 2);
          data.price = sortedPrices[medianIndex];
        } else if (sortedPrices.length === 2) {
          // With two prices, pick the lower one (often the main product vs premium edition)
          data.price = sortedPrices[0];
        } else {
          // Only one reasonable price
          data.price = sortedPrices[0];
        }
      } else {
        // Fallback to highest price if no reasonable prices found
        data.price = Math.max(...foundPrices);
      }
    }

    // Extract image
    for (const pattern of amazonSelectors.image) {
      const match = html.match(pattern);
      if (match) {
        try {
          data.imageUrl = new URL(match[1], originalUrl).href;
          break;
        } catch {
          data.imageUrl = match[1];
          break;
        }
      }
    }

    // Smart currency detection for Amazon domains
    const hostname = new URL(originalUrl).hostname.toLowerCase();
    if (hostname.includes("amazon.com.au")) {
      data.currency = "AUD";
    } else if (hostname.includes("amazon.co.uk")) {
      data.currency = "GBP";
    } else if (hostname.includes("amazon.ca")) {
      data.currency = "CAD";
    } else if (hostname.includes("amazon.co.jp")) {
      data.currency = "JPY";
    } else if (
      hostname.includes("amazon.de") ||
      hostname.includes("amazon.fr") ||
      hostname.includes("amazon.it") ||
      hostname.includes("amazon.es")
    ) {
      data.currency = "EUR";
    } else {
      data.currency = "USD";
    }

    return data;
  }

  private extractMetadata(html: string, originalUrl: string): ScrapedData {
    const data: ScrapedData = {
      url: originalUrl,
      name: "Untitled",
      currency: "USD",
    };

    // Helper function to extract content from meta tags
    const extractMeta = (property: string, attribute = "property") => {
      const regex = new RegExp(
        `<meta\\s+${attribute}=["']${property}["']\\s+content=["']([^"']+)["'][^>]*>`,
        "i"
      );
      const match = html.match(regex);
      return match ? match[1] : null;
    };

    // Helper function to extract content from HTML tags
    const extractTag = (tag: string) => {
      const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i");
      const match = html.match(regex);
      return match ? match[1].trim() : null;
    };

    // Extract name
    data.name =
      extractMeta("og:title") ||
      extractMeta("twitter:title", "name") ||
      extractTag("title") ||
      "Untitled";

    // Extract description
    data.description =
      extractMeta("og:description") ||
      extractMeta("twitter:description", "name") ||
      extractMeta("description", "name") ||
      undefined;

    // Extract image
    const ogImage = extractMeta("og:image") || extractMeta("twitter:image", "name");
    if (ogImage) {
      try {
        data.imageUrl = new URL(ogImage, originalUrl).href;
      } catch {
        data.imageUrl = ogImage;
      }
    } else {
      // Fallback: Look for Kmart-style preload images with imageSrcSet
      const preloadImageMatch = html.match(
        /<link[^>]*rel="preload"[^>]*as="image"[^>]*imageSrcSet="([^"]+)"/i
      );
      if (preloadImageMatch) {
        // Extract the highest quality image from the srcset
        const srcset = preloadImageMatch[1];
        // Extract the best quality image that's 1024px wide or smaller
        const urls = srcset.match(/https:\/\/[^\s]+/g);
        if (urls && urls.length > 0) {
          let bestUrl = null;
          let bestWidth = 0;

          // Look for the highest quality image that's 1024px or smaller
          for (const url of urls) {
            const widthMatch = url.match(/width:(\d+)/);
            if (widthMatch) {
              const width = Number.parseInt(widthMatch[1], 10);
              if (width <= 1024 && width > bestWidth) {
                bestWidth = width;
                bestUrl = url;
              }
            }
          }

          // If no image 1024px or smaller found, fall back to the smallest available
          if (!bestUrl) {
            let smallestWidth = Number.POSITIVE_INFINITY;
            for (const url of urls) {
              const widthMatch = url.match(/width:(\d+)/);
              if (widthMatch) {
                const width = Number.parseInt(widthMatch[1], 10);
                if (width < smallestWidth) {
                  smallestWidth = width;
                  bestUrl = url;
                }
              }
            }
          }

          if (bestUrl) {
            try {
              data.imageUrl = new URL(bestUrl, originalUrl).href;
            } catch {
              data.imageUrl = bestUrl;
            }
          }
        }
      }
    }

    // Extract price - prioritize elements that contain ONLY price data with currency symbols
    const pricePatterns = [
      // Schema.org structured data (highest priority)
      /"price":\s*"?([0-9,]+\.?\d{0,2})"?/i,
      // Main product price elements (highest priority for main product)
      /<(?:span|div)[^>]*class="[^"]*product-price-large[^"]*"[^>]*>\s*(?:NZ\$|AU\$|CA\$|\$|£|€)\s*([0-9,]+\.?\d{0,2})\s*<\/\w+>/i,
      /<(?:span|div)[^>]*class="[^"]*main-price[^"]*"[^>]*>\s*(?:NZ\$|AU\$|CA\$|\$|£|€)\s*([0-9,]+\.?\d{0,2})\s*<\/\w+>/i,
      /<(?:span|div)[^>]*class="[^"]*current-price[^"]*"[^>]*>\s*(?:NZ\$|AU\$|CA\$|\$|£|€)\s*([0-9,]+\.?\d{0,2})\s*<\/\w+>/i,
      // Elements with price-specific classes that contain currency + price
      /<(?:span|div)[^>]*class="[^"]*product-price[^"]*"[^>]*>\s*(?:NZ\$|AU\$|CA\$|\$|£|€)\s*([0-9,]+\.?\d{0,2})\s*<\/\w+>/i,
      // Elements with price-specific IDs that contain currency + price
      /<(?:span|div)[^>]*id="[^"]*price[^"]*"[^>]*>\s*(?:NZ\$|AU\$|CA\$|\$|£|€)\s*([0-9,]+\.?\d{0,2})\s*<\/\w+>/i,
      // Currency symbols with prices in elements that contain only the price
      /<(?:span|div)[^>]*>\s*NZ\$\s*([0-9,]+\.?\d{0,2})\s*<\/\w+>/i,
      /<(?:span|div)[^>]*>\s*AU\$\s*([0-9,]+\.?\d{0,2})\s*<\/\w+>/i,
      /<(?:span|div)[^>]*>\s*CA\$\s*([0-9,]+\.?\d{0,2})\s*<\/\w+>/i,
      /<(?:span|div)[^>]*>\s*\$\s*([0-9,]+\.?\d{0,2})\s*<\/\w+>/i,
      /<(?:span|div)[^>]*>\s*£\s*([0-9,]+\.?\d{0,2})\s*<\/\w+>/i,
      /<(?:span|div)[^>]*>\s*€\s*([0-9,]+\.?\d{0,2})\s*<\/\w+>/i,
      // Fallback: look for standalone currency + price patterns (but be more restrictive)
      // Only match if the price is followed by whitespace or end of tag, not by text
      /(?:^|\s|>)(?:NZ\$|AU\$|CA\$|\$|£|€)\s*([0-9,]+\.?\d{0,2})(?:\s*$|\s*<|\s*<\/)/i,
    ];

    const foundPrices: { price: number; priority: number }[] = [];
    const maxPricesToFind = 30; // Prevent excessive price collection

    for (let i = 0; i < pricePatterns.length && foundPrices.length < maxPricesToFind; i++) {
      const pattern = pricePatterns[i];
      const priority = i; // Lower number = higher priority

      // For patterns that might have multiple matches, use a safer approach
      if (
        pattern.source.includes("\\$") ||
        pattern.source.includes("£") ||
        pattern.source.includes("€")
      ) {
        const regex = new RegExp(pattern.source, "gi"); // Create global version for currency patterns
        const matches = [...html.matchAll(regex)].slice(0, 10); // Limit to 10 matches
        for (const match of matches) {
          const priceStr = match[1].replace(/,/g, "");
          const price = Number.parseFloat(priceStr);
          if (!Number.isNaN(price) && price > 0 && price < 1000000) {
            foundPrices.push({ price, priority });
          }
        }
      } else {
        // For other patterns, use single match
        const match = html.match(pattern);
        if (match) {
          const priceStr = match[1].replace(/,/g, "");
          const price = Number.parseFloat(priceStr);
          if (!Number.isNaN(price) && price > 0 && price < 1000000) {
            foundPrices.push({ price, priority });
          }
        }
      }
    }

    if (foundPrices.length > 0) {
      // Filter out unreasonable prices (too low or too high)
      const reasonablePrices = foundPrices.filter(
        (item) => item.price >= 1.0 && item.price <= 10000
      );

      if (reasonablePrices.length > 0) {
        // Sort by priority first (lower number = higher priority), then by price
        const sortedPrices = reasonablePrices.sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority; // Lower priority number first
          }
          return a.price - b.price; // Then by price
        });

        // Take the first price (highest priority)
        data.price = sortedPrices[0].price;
      } else {
        // Fallback to the highest price if no reasonable prices found
        data.price = Math.max(...foundPrices.map((item) => item.price));
      }
    }

    // Extract currency from content or use smart domain detection
    const hostname = new URL(originalUrl).hostname.toLowerCase();
    if (hostname.endsWith(".nz")) {
      data.currency = "NZD";
    } else if (hostname.endsWith(".au")) {
      data.currency = "AUD";
    } else if (hostname.endsWith(".uk") || hostname.endsWith(".co.uk")) {
      data.currency = "GBP";
    } else if (hostname.endsWith(".ca")) {
      data.currency = "CAD";
    } else if (hostname.endsWith(".jp")) {
      data.currency = "JPY";
    } else if (
      hostname.includes(".eu") ||
      hostname.endsWith(".de") ||
      hostname.endsWith(".fr") ||
      hostname.endsWith(".it") ||
      hostname.endsWith(".es")
    ) {
      data.currency = "EUR";
    } else if (hostname.endsWith(".com") || hostname.endsWith(".us")) {
      data.currency = "USD";
    } else {
      data.currency = "NZD"; // Default for NZ users
    }

    // Clean up text
    if (data.name) {
      data.name = this.cleanText(data.name);
    }
    if (data.description) {
      data.description = this.cleanText(data.description);
    }

    return data;
  }

  private cleanText(text: string): string {
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\\n/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

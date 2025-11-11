import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { UrlScrapingService } from "@/lib/services/UrlScrapingService";
import { server } from "@/test/mocks/server";

// Mock BlurhashService
vi.mock("@/lib/services/BlurhashService", () => ({
  BlurhashService: {
    getInstance: vi.fn(() => ({
      generateBlurhash: vi.fn().mockResolvedValue("LEHV6nWB2yk8pyo0adR*.7kCMdnj"),
    })),
  },
}));

// Mock ImageService
vi.mock("@/lib/services/ImageService", () => ({
  ImageService: {
    getInstance: vi.fn(() => ({
      downloadAndUploadImage: vi.fn().mockResolvedValue(null), // Return null to fall back to external URL
    })),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("UrlScrapingService", () => {
  // Disable MSW for this test suite since we're testing external HTTP requests
  beforeAll(() => {
    server.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Re-enable MSW after this test suite
  afterAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  describe("URL Validation", () => {
    it("should reject invalid URL formats", async () => {
      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "invalid-url",
        "test-user-id"
      );

      expect(result).toEqual({
        error: "Invalid URL format",
        errorType: "validation",
        suggestion: "Please check the URL and make sure it starts with http:// or https://",
        canRetry: false,
      });
    });

    it("should reject localhost URLs", async () => {
      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "http://localhost:3000/test",
        "test-user-id"
      );

      expect(result).toEqual({
        error: "Local URLs are not supported",
        errorType: "validation",
        suggestion: "Please use a public website URL instead",
        canRetry: false,
      });
    });

    it("should reject private IP addresses", async () => {
      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "http://192.168.1.1/test",
        "test-user-id"
      );

      expect(result).toEqual({
        error: "Local URLs are not supported",
        errorType: "validation",
        suggestion: "Please use a public website URL instead",
        canRetry: false,
      });
    });
  });

  describe("Network Error Handling", () => {
    it("should handle timeout errors", async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          const error = new Error("Timeout");
          error.name = "AbortError";
          reject(error);
        });
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://example.com",
        "test-user-id"
      );

      expect(result).toEqual({
        error: "Request timeout",
        errorType: "timeout",
        suggestion:
          "The website took too long to respond. Try again or check if the URL is correct.",
        canRetry: true,
      });
    });

    it("should handle network errors", async () => {
      mockFetch.mockImplementation(() => {
        throw new TypeError("fetch failed");
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://example.com",
        "test-user-id"
      );

      expect(result).toEqual({
        error: "Unable to connect to website",
        errorType: "network",
        suggestion: "Check your internet connection or try a different URL.",
        canRetry: true,
      });
    });

    it("should handle 403 Forbidden responses", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://example.com",
        "test-user-id"
      );

      expect(result).toEqual({
        error: "Access denied by website",
        errorType: "blocked",
        suggestion:
          "This website blocks automated requests. Try copying the product details manually.",
        canRetry: false,
      });
    });

    it("should handle 404 Not Found responses", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://example.com",
        "test-user-id"
      );

      expect(result).toEqual({
        error: "Page not found",
        errorType: "network",
        suggestion: "Please check if the URL is correct and the page still exists.",
        canRetry: false,
      });
    });

    it("should handle 429 Too Many Requests", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://example.com",
        "test-user-id"
      );

      expect(result).toEqual({
        error: "Too many requests",
        errorType: "blocked",
        suggestion: "Please wait a moment before trying again.",
        canRetry: true,
      });
    });
  });

  describe("General Website Scraping", () => {
    it("should extract basic OpenGraph metadata", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="Test Product" />
          <meta property="og:description" content="A great test product" />
          <meta property="og:image" content="https://example.com/image.jpg" />
          <title>Page Title</title>
        </head>
        <body>
          <span class="price">$29.99</span>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://example.com",
        "test-user-id"
      );

      expect(result).toEqual({
        name: "Test Product",
        description: "A great test product",
        url: "https://example.com",
        imageUrl: "https://example.com/image.jpg",
        blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
        price: 29.99,
        currency: "USD",
      });
    });

    it("should extract Twitter Card metadata when OpenGraph is missing", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="twitter:title" content="Twitter Product" />
          <meta name="twitter:description" content="Twitter description" />
          <meta name="twitter:image" content="/twitter-image.jpg" />
        </head>
        <body>
          <div class="product-price">£45.00</div>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://example.co.uk",
        "test-user-id"
      );

      expect(result).toEqual({
        name: "Twitter Product",
        description: "Twitter description",
        url: "https://example.co.uk",
        imageUrl: "https://example.co.uk/twitter-image.jpg",
        blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
        price: 45,
        currency: "GBP",
      });
    });

    it("should detect currency from domain when price currency is unclear", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>NZ Product</title>
        </head>
        <body>
          <span class="price">$125.50</span>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://shop.co.nz/product",
        "test-user-id"
      );

      expect(result).toEqual({
        name: "NZ Product",
        url: "https://shop.co.nz/product",
        price: 125.5,
        currency: "NZD",
      });
    });

    it("should return error when no useful data is found", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title></title>
        </head>
        <body>
          <p>No product information here</p>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://example.com",
        "test-user-id"
      );

      expect(result).toEqual({
        error: "No product information found",
        errorType: "parsing",
        suggestion:
          "This page doesn't seem to contain product information. Try copying the details manually.",
        canRetry: false,
      });
    });
  });

  describe("Amazon Scraping", () => {
    it("should detect Amazon URLs and use specialized scraping", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <span id="productTitle">Amazon Test Product</span>
          <span class="a-price-whole">59</span>
          <span class="a-price-fraction">17</span>
          <img id="landingImage" src="https://images-na.ssl-images-amazon.com/images/I/test.jpg" />
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://amazon.com.au/product/test",
        "test-user-id"
      );

      expect(result).toEqual({
        name: "Amazon Test Product",
        url: "https://amazon.com.au/product/test",
        imageUrl: "https://images-na.ssl-images-amazon.com/images/I/test.jpg",
        blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
        price: 59.17,
        currency: "AUD",
      });
    });

    it("should extract Amazon pricing with A$ symbol", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <h1 id="productTitle">Susanna Clarke Collection</h1>
          <span class="a-offscreen">A$59.17</span>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://amazon.com.au/product",
        "test-user-id"
      );

      expect(result).toEqual({
        name: "Susanna Clarke Collection",
        url: "https://amazon.com.au/product",
        price: 59.17,
        currency: "AUD",
      });
    });

    it("should handle Amazon UK with GBP currency", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <span id="productTitle">UK Product</span>
          <span class="a-price-whole">25</span>
          <span class="a-price-fraction">99</span>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://amazon.co.uk/product",
        "test-user-id"
      );

      expect(result).toEqual({
        name: "UK Product",
        url: "https://amazon.co.uk/product",
        price: 25.99,
        currency: "GBP",
      });
    });

    it("should filter out unreasonably low prices on Amazon", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <span id="productTitle">Product with Multiple Prices</span>
          <span class="a-offscreen">$2.99</span>
          <span class="a-offscreen">$59.99</span>
          <span class="a-offscreen">$1.49</span>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://amazon.com/product",
        "test-user-id"
      );

      expect(result).toEqual({
        name: "Product with Multiple Prices",
        url: "https://amazon.com/product",
        price: 59.99, // Should pick the highest reasonable price
        currency: "USD",
      });
    });
  });

  describe("Price Extraction", () => {
    it("should extract prices with various currency symbols", async () => {
      const testCases = [
        {
          html: '<span class="price">NZ$125.50</span>',
          expected: 125.5,
          currency: "NZD",
          url: "https://shop.nz",
        },
        {
          html: '<span class="price">AU$89.99</span>',
          expected: 89.99,
          currency: "AUD",
          url: "https://shop.au",
        },
        {
          html: '<span class="price">CA$199.00</span>',
          expected: 199,
          currency: "CAD",
          url: "https://shop.ca",
        },
        {
          html: '<span class="price">€45.99</span>',
          expected: 45.99,
          currency: "EUR",
          url: "https://shop.de",
        },
        {
          html: '<span class="price">£32.50</span>',
          expected: 32.5,
          currency: "GBP",
          url: "https://shop.uk",
        },
      ];

      for (const testCase of testCases) {
        const html = `<html><head><title>Test</title></head><body>${testCase.html}</body></html>`;

        mockFetch.mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(html),
        });

        const result = await UrlScrapingService.getInstance().scrapeUrl(
          testCase.url,
          "test-user-id"
        );

        expect(result).toMatchObject({
          price: testCase.expected,
          currency: testCase.currency,
        });
      }
    });

    it("should choose lowest reasonable price from multiple matches to avoid unrelated content", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Multiple Prices</title></head>
        <body>
          <span class="price">$5.99</span>
          <span class="price">$129.99</span>
          <span class="price">$0.99</span>
          <span class="price">$49.99</span>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://example.com",
        "test-user-id"
      );

      expect(result).toMatchObject({
        price: 5.99, // Should pick the lowest reasonable price (first pattern match)
      });
    });

    it("should avoid picking prices from unrelated content like Afterpay limits", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Kmart Product</title></head>
        <body>
          <span class="product-price-large">$29</span>
          <div class="afterpay-info">On orders up to $2000</div>
          <span class="shipping-info">Free shipping on orders over $65</span>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://www.kmart.co.nz/product",
        "test-user-id"
      );

      expect(result).toMatchObject({
        price: 29, // Should pick the actual product price, not the Afterpay limit
        currency: "NZD",
      });
    });

    it("should ignore numbers without currency symbols (like ratings)", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Product with Ratings</title></head>
        <body>
          <span class="product-price-large">$29</span>
          <div class="ratings">5(1)</div>
          <span class="reviews">4.5 stars</span>
          <div class="quantity">Available: 10</div>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://www.kmart.co.nz/product",
        "test-user-id"
      );

      expect(result).toMatchObject({
        price: 29, // Should only pick the price with currency symbol, ignore ratings numbers
        currency: "NZD",
      });
    });

    it("should extract correct price from actual Kmart HTML structure", async () => {
      // This is the actual HTML structure from the Kmart page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Orchard Toys Bluey Shopping List Fun Memory Game</title>
          <meta property="og:title" content="Orchard Toys Bluey Shopping List Fun Memory Game" />
          <meta property="og:description" content="Join Bluey, Bingo, Bandit and Chilli on a fun-filled supermarket adventure" />
        </head>
        <body>
          <h1>Orchard Toys Bluey Shopping List Fun Memory Game</h1>
          <div class="product-price-large">$29</div>
          <div class="ratings">5(1)</div>
          <div class="afterpay-info">On orders up to $2000</div>
          <div class="shipping-info">Eligible orders over $65* will receive free delivery</div>
          <div class="price-ranges">
            <span>Gifts $5 & Under</span>
            <span>Gifts $10 & Under</span>
            <span>Gifts $20 & Under</span>
            <span>Gifts $30 & Under</span>
            <span>Gifts $40 & Under</span>
            <span>Gifts $40 & Over</span>
          </div>
          <div class="related-products">
            <div class="product-card">
              <span class="price">$10</span>
              <h3>Related Product</h3>
            </div>
            <div class="product-card">
              <span class="price">$15</span>
              <h3>Another Product</h3>
            </div>
          </div>
          <div class="you-may-also-like">
            <div class="recommended-item">
              <span class="item-price">$10</span>
              <p>You may also like this item</p>
            </div>
          </div>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://www.kmart.co.nz/product/orchard-toys-bluey-shopping-list-fun-memory-game-43580910/",
        "test-user-id"
      );

      expect(result).toMatchObject({
        name: "Orchard Toys Bluey Shopping List Fun Memory Game",
        price: 29, // Should extract $29, not $10 from related products or $2000 from Afterpay
        currency: "NZD",
      });
    });
  });

  describe("Domain-Based Currency Detection", () => {
    const domainTests = [
      { domain: "shop.co.nz", expected: "NZD" },
      { domain: "store.com.au", expected: "AUD" },
      { domain: "example.co.uk", expected: "GBP" },
      { domain: "test.ca", expected: "CAD" },
      { domain: "shop.jp", expected: "JPY" },
      { domain: "store.de", expected: "EUR" },
      { domain: "shop.fr", expected: "EUR" },
      { domain: "example.com", expected: "USD" },
      { domain: "test.us", expected: "USD" },
      { domain: "random.xyz", expected: "NZD" }, // Default fallback
    ];

    it.each(domainTests)(
      "should detect $expected currency for $domain",
      async ({ domain, expected }) => {
        const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Test Product</title></head>
        <body><span class="price">$99.99</span></body>
        </html>
      `;

        mockFetch.mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(html),
        });

        const result = await UrlScrapingService.getInstance().scrapeUrl(
          `https://${domain}/product`,
          "test-user-id"
        );

        expect(result).toMatchObject({
          currency: expected,
        });
      }
    );
  });

  describe("Text Cleaning", () => {
    it("should clean HTML entities from extracted text", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="Product &amp; Service &lt;Special&gt;" />
          <meta property="og:description" content="Description with &quot;quotes&quot; and &#39;apostrophe&#39;" />
        </head>
        <body>
          <span class="price">$25.99</span>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://example.com",
        "test-user-id"
      );

      expect(result).toEqual({
        name: "Product & Service <Special>",
        description: `Description with "quotes" and 'apostrophe'`,
        url: "https://example.com",
        price: 25.99,
        currency: "USD",
      });
    });

    it("should clean whitespace from extracted text", async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>   Product\\n\\t   Title   </title>
        </head>
        <body>
          <span class="price">$15.50</span>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      });

      const result = await UrlScrapingService.getInstance().scrapeUrl(
        "https://example.com",
        "test-user-id"
      );

      expect(result).toMatchObject({
        name: "Product Title",
      });
    });
  });
});

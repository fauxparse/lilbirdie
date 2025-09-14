import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UrlScrapingService } from '../UrlScrapingService';

// Mock console.log to capture debug output
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Amazon URL Specific Test', () => {
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  it('should correctly extract A$59.17 from the specific Amazon AU URL', async () => {
    const testUrl = 'https://www.amazon.com.au/Susanna-Collection-Piranesi-Jonathan-Strange/dp/9124220264';

    // Mock the fetch to return the actual response we expect
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Since we can't easily mock the exact HTML, let's create a representative sample
    // based on what Amazon AU typically returns for book products
    const mockHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Amazon.com.au: Susanna Clarke Collection 2 Books Set</title>
      </head>
      <body>
        <span id="productTitle">Susanna Clarke Collection 2 Books Set (Piranesi, Jonathan Strange and Mr Norrell)</span>

        <!-- Amazon price structure - this is likely where the issue is -->
        <span class="a-price-whole">59</span>
        <span class="a-price-fraction">17</span>

        <!-- Alternative price formats Amazon might use -->
        <span class="a-offscreen">A$59.17</span>

        <!-- Sometimes Amazon shows different prices -->
        <span class="a-price-whole">199</span>
        <span class="a-price-fraction">50</span>

        <!-- This might be a different edition or bundle -->
        <div class="a-section a-spacing-none">
          <span class="a-offscreen">A$199.50</span>
        </div>
      </body>
      </html>
    `;

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    const result = await UrlScrapingService.scrapeUrl(testUrl);

    // Log the console output for debugging
    console.log('Console logs during extraction:');
    consoleSpy.mock.calls.forEach(call => {
      console.log(call);
    });

    expect(result).not.toHaveProperty('error');

    if ('price' in result) {
      console.log('Extracted price:', result.price);
      console.log('Expected: ~59.17, Got:', result.price);

      // The price should be close to 59.17, not 199.50
      expect(result.price).toBeCloseTo(59.17, 2);
      expect(result.currency).toBe('AUD');
    } else {
      throw new Error('Expected price extraction but got error: ' + JSON.stringify(result));
    }
  });

  it('should handle multiple Amazon price formats and choose the correct one', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Test with multiple price scenarios that Amazon might present
    const testCases = [
      {
        name: 'split price format',
        html: `
          <span id="productTitle">Test Product</span>
          <span class="a-price-whole">59</span>
          <span class="a-price-fraction">17</span>
        `,
        expectedPrice: 59.17,
      },
      {
        name: 'a-offscreen format',
        html: `
          <span id="productTitle">Test Product</span>
          <span class="a-offscreen">A$59.17</span>
        `,
        expectedPrice: 59.17,
      },
      {
        name: 'multiple prices - should pick median reasonable price',
        html: `
          <span id="productTitle">Test Product</span>
          <span class="a-offscreen">A$199.50</span>
          <span class="a-offscreen">A$59.17</span>
          <span class="a-offscreen">A$29.99</span>
        `,
        expectedPrice: 59.17, // Should pick median, avoiding extremes
      },
    ];

    for (const testCase of testCases) {
      consoleSpy.mockClear(); // Clear previous logs

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`<html><body>${testCase.html}</body></html>`),
      });

      const result = await UrlScrapingService.scrapeUrl('https://amazon.com.au/test');

      console.log(`\n--- Test case: ${testCase.name} ---`);
      console.log(`Expected: ${testCase.expectedPrice}, Got: ${'price' in result ? result.price : 'ERROR'}`);

      // Show debug logs from the service
      console.log('Debug logs from service:');
      consoleSpy.mock.calls.forEach((call, index) => {
        console.log(`  ${index + 1}:`, call[0]);
      });

      if ('price' in result) {
        if (result.price !== testCase.expectedPrice) {
          console.log(`MISMATCH: Expected ${testCase.expectedPrice}, got ${result.price}`);
        }
        expect(result.price).toBe(testCase.expectedPrice);
      }
    }
  });

  it('should debug the actual price extraction patterns', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Let's simulate what might actually be in the Amazon page
    const problematicHtml = `
      <span id="productTitle">Susanna Clarke Collection 2 Books Set</span>

      <!-- This might be the issue - multiple price elements -->
      <div class="a-box-group">
        <div class="a-box">
          <!-- Kindle price -->
          <span class="a-offscreen">A$19.99</span>
        </div>
        <div class="a-box">
          <!-- Paperback price (what we want) -->
          <span class="a-offscreen">A$59.17</span>
        </div>
        <div class="a-box">
          <!-- Hardcover or bundle price (wrong one being picked) -->
          <span class="a-offscreen">A$199.50</span>
        </div>
      </div>

      <!-- Or this format -->
      <span class="a-price-whole">199</span>
      <span class="a-price-fraction">50</span>

      <!-- Later in the page, the actual price we want -->
      <span class="a-price-whole">59</span>
      <span class="a-price-fraction">17</span>
    `;

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(problematicHtml),
    });

    const result = await UrlScrapingService.scrapeUrl('https://amazon.com.au/test');

    // Debug output
    console.log('All console logs from price extraction:');
    consoleSpy.mock.calls.forEach((call, index) => {
      console.log(`${index + 1}:`, call);
    });

    if ('price' in result) {
      console.log(`Final extracted price: ${result.price}`);
      console.log(`This should be 59.17, not 199.50`);
    }
  });
});
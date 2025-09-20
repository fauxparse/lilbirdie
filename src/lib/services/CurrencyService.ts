import { prisma } from "../db";

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: Date;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  rate: number;
  isConverted: boolean;
}

export class CurrencyService {
  private static instance: CurrencyService;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly API_URL = "https://api.exchangerate-api.com/v4/latest";

  private constructor() {}

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    try {
      // Check if we have a cached rate
      const cachedRate = await prisma.currencyRate.findFirst({
        where: {
          fromCurrency,
          toCurrency,
          updatedAt: {
            gte: new Date(Date.now() - this.CACHE_DURATION),
          },
        },
      });

      if (cachedRate) {
        return Number(cachedRate.rate);
      }

      // Fetch new rates from API
      const rate = await this.fetchRateFromAPI(fromCurrency, toCurrency);

      // Cache the rate
      await prisma.currencyRate.upsert({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency,
            toCurrency,
          },
        },
        update: {
          rate,
          updatedAt: new Date(),
        },
        create: {
          fromCurrency,
          toCurrency,
          rate,
          updatedAt: new Date(),
        },
      });

      return rate;
    } catch (error) {
      console.error(`Failed to get exchange rate from ${fromCurrency} to ${toCurrency}:`, error);

      // Try to get last known rate (even if expired)
      const lastKnownRate = await prisma.currencyRate.findFirst({
        where: {
          fromCurrency,
          toCurrency,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      if (lastKnownRate) {
        console.warn(`Using stale exchange rate for ${fromCurrency} to ${toCurrency}`);
        return Number(lastKnownRate.rate);
      }

      // Fallback to 1:1 if no rate available
      console.warn(`No exchange rate available for ${fromCurrency} to ${toCurrency}, using 1:1`);
      return 1;
    }
  }

  private async fetchRateFromAPI(fromCurrency: string, toCurrency: string): Promise<number> {
    const response = await fetch(`${this.API_URL}/${fromCurrency}`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.rates || !data.rates[toCurrency]) {
      throw new Error(`No rate available for ${toCurrency}`);
    }

    return data.rates[toCurrency];
  }

  async convertPrice(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConversionResult> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
      convertedCurrency: toCurrency,
      rate,
      isConverted: fromCurrency !== toCurrency,
    };
  }

  async getAllExchangeRates(
    currencies: readonly string[]
  ): Promise<Record<string, Record<string, number>>> {
    const rates: Record<string, Record<string, number>> = {};
    const currenciesArray = [...currencies]; // Convert to mutable array

    // Initialize all currency pairs with 1:1 for same currency
    for (const fromCurrency of currencies) {
      rates[fromCurrency] = {};
      for (const toCurrency of currencies) {
        if (fromCurrency === toCurrency) {
          rates[fromCurrency][toCurrency] = 1;
        } else {
          rates[fromCurrency][toCurrency] = 1; // Default fallback
        }
      }
    }

    try {
      // Fetch all cached rates in a single query
      const cachedRates = await prisma.currencyRate.findMany({
        where: {
          fromCurrency: { in: currenciesArray },
          toCurrency: { in: currenciesArray },
          updatedAt: {
            gte: new Date(Date.now() - this.CACHE_DURATION),
          },
        },
      });

      // Update rates with cached values
      for (const cachedRate of cachedRates) {
        rates[cachedRate.fromCurrency][cachedRate.toCurrency] = Number(cachedRate.rate);
      }

      // Check for missing rates and fetch them from API
      const missingRates: Array<{ fromCurrency: string; toCurrency: string }> = [];

      for (const fromCurrency of currencies) {
        for (const toCurrency of currencies) {
          if (fromCurrency !== toCurrency && rates[fromCurrency][toCurrency] === 1) {
            missingRates.push({ fromCurrency, toCurrency });
          }
        }
      }

      // Fetch missing rates from API and cache them
      if (missingRates.length > 0) {
        console.log(`Fetching ${missingRates.length} missing exchange rates from API`);

        for (const { fromCurrency, toCurrency } of missingRates) {
          try {
            const rate = await this.fetchRateFromAPI(fromCurrency, toCurrency);
            rates[fromCurrency][toCurrency] = rate;

            // Cache the rate
            await prisma.currencyRate.upsert({
              where: {
                fromCurrency_toCurrency: {
                  fromCurrency,
                  toCurrency,
                },
              },
              update: {
                rate,
                updatedAt: new Date(),
              },
              create: {
                fromCurrency,
                toCurrency,
                rate,
                updatedAt: new Date(),
              },
            });
          } catch (error) {
            console.error(`Failed to fetch rate ${fromCurrency} to ${toCurrency}:`, error);
            // Keep the default rate of 1
          }
        }
      }

      return rates;
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);

      // Try to get any available rates (even if expired)
      const anyRates = await prisma.currencyRate.findMany({
        where: {
          fromCurrency: { in: currenciesArray },
          toCurrency: { in: currenciesArray },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      // Update with any available rates
      for (const rate of anyRates) {
        rates[rate.fromCurrency][rate.toCurrency] = Number(rate.rate);
      }

      return rates;
    }
  }

  async refreshAllRates(): Promise<void> {
    const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "NZD"];

    for (const fromCurrency of currencies) {
      for (const toCurrency of currencies) {
        if (fromCurrency !== toCurrency) {
          try {
            await this.getExchangeRate(fromCurrency, toCurrency);
          } catch (error) {
            console.error(`Failed to refresh rate ${fromCurrency} to ${toCurrency}:`, error);
          }
        }
      }
    }
  }
}

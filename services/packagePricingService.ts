// services/packagePricingService.ts
/**
 * Dynamic pricing service for packages
 * Loads pricing from backend/database instead of hardcoded values
 * Implements caching and fallback strategies
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "@/src/api/axiosClient";
import { envConfig } from "@/src/config/envConfig";

export interface PackagePricing {
  type: string;
  displayName: string;
  value: number;
  currency: string;
  active: boolean;
  updatedAt: number;
}

export interface PricingConfig {
  packages: PackagePricing[];
  version: number;
  fetchedAt: number;
}

const DEFAULT_PRICING: PricingConfig = {
  packages: [
    {
      type: "shopee",
      displayName: "Shopee",
      value: 6.00,
      currency: "BRL",
      active: true,
      updatedAt: Date.now(),
    },
    {
      type: "mercado_livre",
      displayName: "Mercado Livre",
      value: 8,
      currency: "BRL",
      active: true,
      updatedAt: Date.now(),
    },
    {
      type: "avulso",
      displayName: "Avulso",
      value: 8,
      currency: "BRL",
      active: true,
      updatedAt: Date.now(),
    },
  ],
  version: 1,
  fetchedAt: Date.now(),
};

class PackagePricingService {
  private cache: PricingConfig | null = null;
  private cacheKey = "beepvelozz_package_pricing";
  private lastFetchTime = 0;
  private isFetching = false;

  /**
   * Initialize pricing service with cached values
   */
  async initialize(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (cached) {
        this.cache = JSON.parse(cached);
        console.log("📦 Package pricing loaded from cache");

        // Try to fetch fresh pricing in background
        this.refreshPricingInBackground();
      } else {
        // No cache, load defaults
        this.cache = DEFAULT_PRICING;
        await this.savePricingToCache(this.cache);
        console.log("📦 Package pricing initialized with defaults");
      }
    } catch (error) {
      console.error("❌ Failed to initialize pricing service:", error);
      this.cache = DEFAULT_PRICING;
    }
  }

  /**
   * Get all package pricing
   */
  getPricing(): PackagePricing[] {
    return this.cache?.packages || DEFAULT_PRICING.packages;
  }

  /**
   * Get pricing for specific package type
   */
  getPriceForType(type: string): number {
    const pricing = this.cache?.packages.find(
      (p) => p.type.toLowerCase() === type.toLowerCase() && p.active,
    );
    return (
      pricing?.value ||
      DEFAULT_PRICING.packages.find((p) => p.type === "avulso")!.value
    );
  }

  /**
   * Get display name for package type
   */
  getDisplayName(type: string): string {
    const pricing = this.cache?.packages.find(
      (p) => p.type.toLowerCase() === type.toLowerCase(),
    );
    return pricing?.displayName || "Desconhecido";
  }

  /**
   * Refresh pricing from server
   */
  async refreshPricing(): Promise<void> {
    if (this.isFetching) {
      console.log("⏳ Pricing refresh already in progress");
      return;
    }

    try {
      this.isFetching = true;
      const response = await axiosClient.get<{ packages: PackagePricing[] }>(
        "/pricing/packages",
      );

      if (response.data?.packages) {
        const newPricing: PricingConfig = {
          packages: response.data.packages,
          version: (this.cache?.version || 0) + 1,
          fetchedAt: Date.now(),
        };

        await this.savePricingToCache(newPricing);
        this.cache = newPricing;
        this.lastFetchTime = Date.now();

        console.log("✅ Package pricing updated from server");
      }
    } catch (error) {
      console.warn(
        "⚠️  Failed to fetch pricing from server, using cached values:",
        error,
      );
      // Fallback to cache on error
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Refresh pricing in background (private implementation)
   */
  private async refreshPricingInBackground(): Promise<void> {
    // Only refresh if cache is older than configured duration
    const now = Date.now();
    const cacheAge = now - (this.lastFetchTime || 0);
    const shouldRefresh = cacheAge > envConfig.cache.driversCacheDuration;

    if (shouldRefresh) {
      // Don't wait for this
      this.refreshPricing().catch((error) => {
        console.error("Background pricing refresh failed:", error);
      });
    }
  }

  /**
   * Start background pricing refresh (public API)
   * Safe to call from components
   */
  public startBackgroundPricingRefresh(): void {
    this.refreshPricingInBackground().catch((error) => {
      console.error("Error starting background pricing refresh:", error);
    });
  }

  /**
   * Save pricing to cache
   */
  private async savePricingToCache(pricing: PricingConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(pricing));
    } catch (error) {
      console.error("❌ Failed to save pricing to cache:", error);
    }
  }

  /**
   * Clear cache and reset to defaults
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
      this.cache = DEFAULT_PRICING;
      this.lastFetchTime = 0;
      console.log("✅ Pricing cache cleared");
    } catch (error) {
      console.error("❌ Failed to clear pricing cache:", error);
    }
  }

  /**
   * Update package values manually
   */
  async updatePackageValues(values: Record<string, number>): Promise<void> {
    try {
      if (!this.cache) {
        this.cache = DEFAULT_PRICING;
      }

      // Update values in cache
      this.cache.packages = this.cache.packages.map((pkg) => {
        if (values.hasOwnProperty(pkg.type)) {
          return {
            ...pkg,
            value: values[pkg.type],
            updatedAt: Date.now(),
          };
        }
        return pkg;
      });

      // Save to cache
      await this.savePricingToCache(this.cache);
      
      console.log("✅ Package values updated:", values);
    } catch (error) {
      console.error("❌ Failed to update package values:", error);
      throw error;
    }
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo() {
    return {
      hasPricing: this.cache !== null,
      version: this.cache?.version || 0,
      fetchedAt: new Date(this.cache?.fetchedAt || 0),
      itemCount: this.cache?.packages.length || 0,
    };
  }
}

// Export singleton instance
export const packagePricingService = new PackagePricingService();

export default packagePricingService;

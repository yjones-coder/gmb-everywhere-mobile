import { describe, it, expect } from "vitest";
import {
  mockBusinesses,
  searchBusinesses,
  relatedCategories,
} from "../data/mock-businesses";

describe("Mock Businesses Data", () => {
  it("should have mock businesses available", () => {
    expect(mockBusinesses).toBeDefined();
    expect(Array.isArray(mockBusinesses)).toBe(true);
    expect(mockBusinesses.length).toBeGreaterThan(0);
  });

  it("should have required fields for each business", () => {
    mockBusinesses.forEach((business) => {
      expect(business.id).toBeDefined();
      expect(business.name).toBeDefined();
      expect(business.primaryCategory).toBeDefined();
      expect(business.rating).toBeDefined();
      expect(business.reviewCount).toBeDefined();
      expect(business.address).toBeDefined();
      expect(business.phone).toBeDefined();
      expect(business.placeId).toBeDefined();
      expect(business.cid).toBeDefined();
      expect(Array.isArray(business.secondaryCategories)).toBe(true);
      expect(Array.isArray(business.services)).toBe(true);
      expect(Array.isArray(business.attributes)).toBe(true);
      expect(Array.isArray(business.posts)).toBe(true);
      expect(Array.isArray(business.reviews)).toBe(true);
    });
  });

  it("should have valid ratings between 1 and 5", () => {
    mockBusinesses.forEach((business) => {
      expect(business.rating).toBeGreaterThanOrEqual(1);
      expect(business.rating).toBeLessThanOrEqual(5);
    });
  });

  it("should have reviews with required fields", () => {
    mockBusinesses.forEach((business) => {
      business.reviews.forEach((review) => {
        expect(review.id).toBeDefined();
        expect(review.author).toBeDefined();
        expect(review.rating).toBeDefined();
        expect(review.text).toBeDefined();
        expect(review.date).toBeDefined();
        expect(review.helpful).toBeDefined();
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
      });
    });
  });
});

describe("searchBusinesses Function", () => {
  it("should return results for valid search queries", () => {
    const results = searchBusinesses("dentist");
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it("should return empty array for non-matching queries", () => {
    const results = searchBusinesses("xyznonexistent123");
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it("should be case insensitive", () => {
    const resultsLower = searchBusinesses("dentist");
    const resultsUpper = searchBusinesses("DENTIST");
    const resultsMixed = searchBusinesses("DeNtIsT");
    
    expect(resultsLower.length).toBe(resultsUpper.length);
    expect(resultsLower.length).toBe(resultsMixed.length);
  });

  it("should search by business name", () => {
    const results = searchBusinesses("Smith");
    expect(results.some((b) => b.name.toLowerCase().includes("smith"))).toBe(true);
  });

  it("should search by category", () => {
    const results = searchBusinesses("yoga");
    expect(
      results.some(
        (b) =>
          b.primaryCategory.toLowerCase().includes("yoga") ||
          b.secondaryCategories.some((c) => c.toLowerCase().includes("yoga"))
      )
    ).toBe(true);
  });
});

describe("Related Categories Data", () => {
  it("should have related categories defined", () => {
    expect(relatedCategories).toBeDefined();
    expect(typeof relatedCategories).toBe("object");
  });

  it("should have traffic potential for each suggested category", () => {
    Object.values(relatedCategories).forEach((categories) => {
      categories.forEach((cat) => {
        expect(cat.category).toBeDefined();
        expect(cat.trafficPotential).toBeDefined();
        expect(["high", "medium", "low"]).toContain(cat.trafficPotential);
      });
    });
  });
});

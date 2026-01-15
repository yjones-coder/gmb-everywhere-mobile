import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import { createContext } from "../_core/context";

describe("GMB Feature Tests", () => {
    const createCaller = () => {
        // Mock context creation if necessary - for now passing minimal/empty context
        // In a real app we might mock req/res/user
        const ctx = {
            req: {} as any,
            res: {} as any,
            user: null as any,
        };
        return appRouter.createCaller(ctx);
    };

    it("should return mocked audit data with correct structure", async () => {
        const caller = createCaller();
        const result = await caller.gmb.audit({ query: "Test Business" });

        expect(result.status).toBe("mocked");
        expect(result.query).toBe("Test Business");

        // Verify Review Audit Data Structure
        expect(result.results.reviewAudit).toBeDefined();
        expect(result.results.reviewAudit.averageReviewRating).toBe(4.9);
        expect(result.results.reviewAudit.numberOfReviews).toBe(353);

        // Verify specific calculated value
        expect(result.results.reviewAudit.reviewCalculatedValues.numberOfReviewsWithPhotos).toBe(4);

        // Verify Review Velocity Array
        expect(Array.isArray(result.results.reviewAudit.reviewVelocity)).toBe(true);
        expect(result.results.reviewAudit.reviewVelocity.length).toBeGreaterThan(0);
    });

    it("should return mocked post audit data with correct structure", async () => {
        const caller = createCaller();
        const result = await caller.gmb.audit({ query: "Test Business" });

        // Verify Post Audit Data Structure
        expect(result.results.postAudit).toBeDefined();
        expect(result.results.postAudit.postDetails.totalPostWithImage).toBe(50);
        expect(result.results.postAudit.postDetails.averagePostWords).toBe("87.84");
    });

    it("should handle teleport mutation correctly", async () => {
        const caller = createCaller();
        const input = { query: "Mock Business", latitude: 52.713, longitude: -1.348 };
        const result = await caller.gmb.teleport(input);

        expect(result.status).toBe("success");
        expect(result.query).toBe("Mock Business");
        expect(result.targetLocation).toEqual({ latitude: 52.713, longitude: -1.348 });
        expect(result.results).toBeDefined();
        expect(result.results?.rank).toBeDefined();
        expect(result.results?.distance).toBeDefined();
        expect(result.results?.visibilityScore).toBeDefined();
    });
});

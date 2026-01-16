import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { credits } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

export const creditsRouter = router({
    balance: protectedProcedure.query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return { balance: 0 };

        const result = await db
            .select({
                balance: sql<number>`SUM(CASE WHEN type = 'purchase' THEN amount ELSE -amount END)`,
            })
            .from(credits)
            .where(eq(credits.userId, ctx.user.id));

        return {
            balance: result[0]?.balance || 0,
        };
    }),

    history: protectedProcedure.query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];

        const history = await db
            .select()
            .from(credits)
            .where(eq(credits.userId, ctx.user.id))
            .orderBy(desc(credits.createdAt));

        return history;
    }),

    purchase: protectedProcedure
        .input(z.object({
            amount: z.number().positive(),
            description: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            // In a real app, integrate with payment processor like Stripe
            // For now, just add credits
            await db.insert(credits).values({
                userId: ctx.user.id,
                amount: input.amount,
                type: "purchase",
                description: input.description || "Credit purchase",
            });

            return { success: true };
        }),

    deduct: protectedProcedure
        .input(z.object({
            amount: z.number().positive(),
            description: z.string().optional(),
            type: z.string().default("export"),
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            // Check current balance
            const balanceResult = await db
                .select({
                    balance: sql<number>`SUM(CASE WHEN type = 'purchase' THEN amount ELSE -amount END)`,
                })
                .from(credits)
                .where(eq(credits.userId, ctx.user.id));

            const currentBalance = balanceResult[0]?.balance || 0;

            if (currentBalance < input.amount) {
                throw new Error("Insufficient credits");
            }

            // Deduct credits
            await db.insert(credits).values({
                userId: ctx.user.id,
                amount: -input.amount,
                type: input.type,
                description: input.description || "Credit deduction",
            });

            return { success: true, newBalance: currentBalance - input.amount };
        }),
});
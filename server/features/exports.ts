import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { exportTable, credits } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

export const exportsRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];

        const userExports = await db
            .select()
            .from(exportTable)
            .where(eq(exportTable.userId, ctx.user.id))
            .orderBy(desc(exportTable.createdAt));

        return userExports;
    }),

    create: protectedProcedure
        .input(z.object({
            businessId: z.string().optional(),
            cost: z.number().positive().default(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            // Check current credit balance
            const balanceResult = await db
                .select({
                    balance: sql<number>`SUM(CASE WHEN type = 'purchase' THEN amount ELSE -amount END)`,
                })
                .from(credits)
                .where(eq(credits.userId, ctx.user.id));

            const currentBalance = balanceResult[0]?.balance || 0;

            if (currentBalance < input.cost) {
                throw new Error("Insufficient credits for export");
            }

            // Create export record
            const result = await db.insert(exportTable).values({
                userId: ctx.user.id,
                businessId: input.businessId,
                status: "pending",
                cost: input.cost,
            });

            return { success: true, exportId: result.lastInsertRowid };
        }),

    updateStatus: protectedProcedure
        .input(z.object({
            exportId: z.number(),
            status: z.enum(["pending", "processing", "completed", "failed"]),
            downloadUrl: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            // Get current export to check previous status
            const currentExport = await db
                .select()
                .from(exportTable)
                .where(eq(exportTable.id, input.exportId))
                .limit(1);

            if (currentExport.length === 0) {
                throw new Error("Export not found");
            }

            const exportRecord = currentExport[0];

            // Update status
            await db
                .update(exportTable)
                .set({
                    status: input.status,
                    downloadUrl: input.downloadUrl,
                })
                .where(eq(exportTable.id, input.exportId));

            // Deduct credits if status changed to completed and wasn't completed before
            if (input.status === "completed" && exportRecord.status !== "completed") {
                await db.insert(credits).values({
                    userId: ctx.user.id,
                    amount: -exportRecord.cost,
                    type: "export",
                    description: `Export ${input.exportId} completed`,
                });
            }

            return { success: true };
        }),
});
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { exports } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const exportsRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];

        const userExports = await db
            .select()
            .from(exports)
            .where(eq(exports.userId, ctx.user.id))
            .orderBy(desc(exports.createdAt));

        return userExports;
    }),

    create: protectedProcedure
        .input(z.object({
            businessId: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            // In a real app, trigger the export process
            // For now, just create a record
            const result = await db.insert(exports).values({
                userId: ctx.user.id,
                businessId: input.businessId,
                status: "pending",
            });

            return { success: true, exportId: result[0].insertId };
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

            await db
                .update(exports)
                .set({
                    status: input.status,
                    downloadUrl: input.downloadUrl,
                })
                .where(eq(exports.id, input.exportId));

            return { success: true };
        }),
});
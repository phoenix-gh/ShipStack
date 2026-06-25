import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth-schema";

export const fileObject = sqliteTable(
  "file_object",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull().unique(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("file_object_user_id_idx").on(table.userId),
    index("file_object_object_key_idx").on(table.objectKey),
  ],
);

export const fileObjectRelations = relations(fileObject, ({ one }) => ({
  user: one(user, {
    fields: [fileObject.userId],
    references: [user.id],
  }),
}));

export type FileObject = typeof fileObject.$inferSelect;

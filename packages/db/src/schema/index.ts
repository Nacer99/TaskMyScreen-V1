import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),

  email: text("email").notNull(),

  tier: text("tier").default("free").notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => usersTable.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"), // URL de la capture d'écran stockée
  reminderTime: timestamp("reminder_time").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
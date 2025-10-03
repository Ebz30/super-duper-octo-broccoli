import { pgTable, uuid, varchar, text, timestamp, boolean, integer, decimal, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const conditionEnum = pgEnum('condition', ['new', 'like_new', 'good', 'fair', 'poor']);
export const availabilityEnum = pgEnum('availability_status', ['available', 'pending', 'sold', 'removed']);
export const activityTypeEnum = pgEnum('activity_type', ['view', 'favorite', 'search', 'contact', 'message']);
export const reportCategoryEnum = pgEnum('report_category', ['inappropriate', 'scam', 'spam', 'harassment', 'counterfeit', 'prohibited', 'other']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  university: varchar('university', { length: 100 }).notNull(),
  profilePictureUrl: text('profile_picture_url'),
  bio: text('bio'),
  phoneNumber: varchar('phone_number', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  isBanned: boolean('is_banned').default(false).notNull(),
  banReason: text('ban_reason'),
  warningCount: integer('warning_count').default(0).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  universityIdx: index('users_university_idx').on(table.university),
}));

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  emoji: varchar('emoji', { length: 10 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Items table
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('TRY').notNull(),
  discountPercentage: integer('discount_percentage').default(0),
  condition: conditionEnum('condition').notNull(),
  images: text('images').array().notNull(),
  location: varchar('location', { length: 100 }),
  availabilityStatus: availabilityEnum('availability_status').default('available').notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  favoriteCount: integer('favorite_count').default(0).notNull(),
  contactCount: integer('contact_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  soldAt: timestamp('sold_at'),
  isFeatured: boolean('is_featured').default(false).notNull(),
}, (table) => ({
  sellerIdx: index('items_seller_idx').on(table.sellerId),
  categoryIdx: index('items_category_idx').on(table.categoryId),
  statusIdx: index('items_status_idx').on(table.availabilityStatus),
  createdIdx: index('items_created_idx').on(table.createdAt),
}));

// Favorites table
export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('favorites_user_idx').on(table.userId),
  itemIdx: index('favorites_item_idx').on(table.itemId),
}));

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  buyerUnreadCount: integer('buyer_unread_count').default(0).notNull(),
  sellerUnreadCount: integer('seller_unread_count').default(0).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
}, (table) => ({
  buyerIdx: index('conversations_buyer_idx').on(table.buyerId),
  sellerIdx: index('conversations_seller_idx').on(table.sellerId),
  itemIdx: index('conversations_item_idx').on(table.itemId),
}));

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index('messages_conversation_idx').on(table.conversationId),
  senderIdx: index('messages_sender_idx').on(table.senderId),
}));

// User Activities table (for AI recommendations)
export const userActivities = pgTable('user_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityType: activityTypeEnum('activity_type').notNull(),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'cascade' }),
  searchQuery: text('search_query'),
  durationSeconds: integer('duration_seconds'),
  metadata: text('metadata'), // JSON string
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('activities_user_idx').on(table.userId),
  typeIdx: index('activities_type_idx').on(table.activityType),
  createdIdx: index('activities_created_idx').on(table.createdAt),
}));

// User Preferences table (calculated from activities)
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  preferredCategories: uuid('preferred_categories').array(),
  categoryScores: text('category_scores'), // JSON string
  priceRangeMin: decimal('price_range_min', { precision: 10, scale: 2 }),
  priceRangeMax: decimal('price_range_max', { precision: 10, scale: 2 }),
  preferredConditions: text('preferred_conditions').array(),
  lastCalculatedAt: timestamp('last_calculated_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  favorites: many(favorites),
  sentMessages: many(messages),
  buyerConversations: many(conversations, { relationName: 'buyer' }),
  sellerConversations: many(conversations, { relationName: 'seller' }),
  activities: many(userActivities),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  seller: one(users, {
    fields: [items.sellerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  favorites: many(favorites),
  conversations: many(conversations),
  activities: many(userActivities),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [favorites.itemId],
    references: [items.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  item: one(items, {
    fields: [conversations.itemId],
    references: [items.id],
  }),
  buyer: one(users, {
    fields: [conversations.buyerId],
    references: [users.id],
    relationName: 'buyer',
  }),
  seller: one(users, {
    fields: [conversations.sellerId],
    references: [users.id],
    relationName: 'seller',
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

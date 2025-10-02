-- MyBazaar Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    university VARCHAR(255),
    phone VARCHAR(50),
    bio TEXT,
    profile_picture TEXT,
    warning_count INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    banned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Sessions table (for session management)
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_expire ON sessions(expire);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, icon) VALUES
    ('Electronics & Gadgets', 'laptop'),
    ('Books & Academic Materials', 'book'),
    ('Furniture & Home Decor', 'home'),
    ('Clothing & Accessories', 'shirt'),
    ('Sports & Fitness', 'dumbbell'),
    ('Kitchen & Appliances', 'utensils'),
    ('Bicycles & Transportation', 'bike'),
    ('Other', 'grid');

-- Items table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 90),
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('New', 'Like New', 'Good', 'Fair', 'Poor')),
    location VARCHAR(100) NOT NULL,
    images TEXT[] NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    search_vector tsvector
);

-- Create indexes for better performance
CREATE INDEX idx_items_seller ON items(seller_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_available ON items(is_available) WHERE is_available = TRUE AND is_deleted = FALSE;
CREATE INDEX idx_items_created ON items(created_at DESC);
CREATE INDEX idx_items_price ON items(price);
CREATE INDEX idx_items_search ON items USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION items_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
CREATE TRIGGER items_search_vector_trigger
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION items_search_vector_update();

-- Favorites table
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_item ON favorites(item_id);

-- User activities table (for recommendations)
CREATE TABLE user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('view', 'favorite', 'contact', 'search', 'filter')),
    category_id INTEGER REFERENCES categories(id),
    item_price NUMERIC(10, 2),
    item_condition VARCHAR(50),
    search_query TEXT,
    filter_params JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activities_user ON user_activities(user_id);
CREATE INDEX idx_activities_created ON user_activities(created_at DESC);

-- Conversations table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(buyer_id, seller_id, item_id)
);

CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

-- Messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Reports table
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reported_item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('scam', 'inappropriate_content', 'fake_listing', 'spam', 'safety_concern', 'other')),
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);

-- Item shares table (for tracking shares - analytics only)
CREATE TABLE item_shares (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('whatsapp', 'telegram', 'instagram', 'copy')),
    shared_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shares_item ON item_shares(item_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies for Supabase

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Items policies
CREATE POLICY "Anyone can view available items" ON items FOR SELECT USING (is_available = true AND is_deleted = false);
CREATE POLICY "Users can create items" ON items FOR INSERT WITH CHECK (auth.uid()::text = seller_id::text);
CREATE POLICY "Users can update own items" ON items FOR UPDATE USING (auth.uid()::text = seller_id::text);
CREATE POLICY "Users can delete own items" ON items FOR DELETE USING (auth.uid()::text = seller_id::text);

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid()::text = user_id::text);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT 
    USING (auth.uid()::text = buyer_id::text OR auth.uid()::text = seller_id::text);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = messages.conversation_id 
        AND (conversations.buyer_id::text = auth.uid()::text OR conversations.seller_id::text = auth.uid()::text)
    ));
CREATE POLICY "Users can create messages in their conversations" ON messages FOR INSERT WITH CHECK (true);

-- Reports policies
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid()::text = reporter_id::text);
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid()::text = reporter_id::text);

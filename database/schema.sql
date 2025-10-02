-- MyBazaar Database Schema
-- PostgreSQL/Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    university VARCHAR(100),
    phone VARCHAR(20),
    bio TEXT,
    profile_picture TEXT,
    warning_count INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    banned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    price DECIMAL(10,2) NOT NULL,
    discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 90),
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('New', 'Like New', 'Good', 'Fair', 'Poor')),
    location VARCHAR(100) NOT NULL,
    images TEXT[] DEFAULT '{}',
    is_available BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create full-text search index on items
CREATE INDEX idx_items_search ON items USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_price ON items(price);
CREATE INDEX idx_items_available ON items(is_available);
CREATE INDEX idx_items_created_at ON items(created_at DESC);

-- Favorites table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- User activities table (for recommendations)
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('view', 'favorite', 'contact', 'search', 'filter')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(item_id, buyer_id, seller_id)
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('scam', 'inappropriate_content', 'fake_listing', 'spam', 'safety_concern', 'other')),
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Item shares table (for analytics)
CREATE TABLE item_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('whatsapp', 'telegram', 'instagram', 'copy')),
    shared_at TIMESTAMP DEFAULT NOW()
);

-- Failed login attempts table (for security)
CREATE TABLE failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_item ON favorites(item_id);
CREATE INDEX idx_activities_user ON user_activities(user_id);
CREATE INDEX idx_activities_item ON user_activities(item_id);
CREATE INDEX idx_activities_type ON user_activities(activity_type);
CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);

-- Row Level Security (RLS) Policies for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Items are publicly readable, but only owners can modify
CREATE POLICY "Items are publicly readable" ON items FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Users can create items" ON items FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own items" ON items FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete own items" ON items FOR DELETE USING (auth.uid() = seller_id);

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can create activities" ON user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations 
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can create conversations" ON conversations 
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Messages policies
CREATE POLICY "Users can view conversation messages" ON messages 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );
CREATE POLICY "Users can send messages" ON messages 
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

-- Reports policies
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get item recommendations
CREATE OR REPLACE FUNCTION get_user_recommendations(p_user_id UUID, p_limit INTEGER DEFAULT 12)
RETURNS TABLE (
    item_id UUID,
    title VARCHAR,
    price DECIMAL,
    images TEXT[],
    seller_name VARCHAR,
    location VARCHAR,
    recommendation_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH user_preferences AS (
        SELECT 
            i.category_id,
            COUNT(*) as interaction_count,
            AVG(i.price) as avg_price
        FROM user_activities ua
        JOIN items i ON ua.item_id = i.id
        WHERE ua.user_id = p_user_id
        AND ua.created_at > NOW() - INTERVAL '30 days'
        GROUP BY i.category_id
        ORDER BY interaction_count DESC
        LIMIT 3
    ),
    user_viewed AS (
        SELECT DISTINCT item_id 
        FROM user_activities 
        WHERE user_id = p_user_id
    ),
    user_favorites AS (
        SELECT item_id 
        FROM favorites 
        WHERE user_id = p_user_id
    )
    SELECT 
        i.id,
        i.title,
        i.price,
        i.images,
        u.name,
        i.location,
        CASE 
            WHEN i.category_id IN (SELECT category_id FROM user_preferences) THEN 100
            ELSE 10
        END +
        CASE 
            WHEN i.price BETWEEN 
                (SELECT MIN(avg_price * 0.5) FROM user_preferences) AND 
                (SELECT MAX(avg_price * 1.5) FROM user_preferences) 
            THEN 50 
            ELSE 10 
        END +
        (i.view_count / 10)::INTEGER as recommendation_score
    FROM items i
    JOIN users u ON i.seller_id = u.id
    WHERE i.is_available = true
    AND i.is_deleted = false
    AND i.seller_id != p_user_id
    AND i.id NOT IN (SELECT item_id FROM user_viewed)
    AND i.id NOT IN (SELECT item_id FROM user_favorites)
    ORDER BY recommendation_score DESC, i.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
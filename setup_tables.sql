-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO '1anaTzRWQlIrUQobn8YTFFC+ArQnIS06LAYozyO9L0LuC4jjlLAOP2KBUZGSBGMvWewbkTtf6SBPWeGqwiohiA==';

-- Create tables
CREATE TABLE IF NOT EXISTS user_credits (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_balance INTEGER NOT NULL DEFAULT 0,
    total_credits_purchased INTEGER NOT NULL DEFAULT 0,
    total_credits_used INTEGER NOT NULL DEFAULT 0,
    level VARCHAR(50) NOT NULL DEFAULT 'free',
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS video_generation_task_definitions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    task_type VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    prompt TEXT,
    negative_prompt TEXT,
    start_img_path TEXT NOT NULL,
    end_img_path TEXT,
    aspect_ratio VARCHAR(20),
    camera_type VARCHAR(50),
    camera_value TEXT,
    cfg NUMERIC,
    high_quality BOOLEAN NOT NULL DEFAULT false,
    credits INTEGER NOT NULL,
    additional_params JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS video_generation_task_statuses (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES video_generation_task_definitions(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    external_task_id TEXT,
    result_url TEXT,
    thumbnail_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id BIGINT NOT NULL REFERENCES video_generation_task_definitions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, task_id)
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    credits_per_period INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    next_renewal_date TIMESTAMP WITH TIME ZONE NOT NULL,
    subscription_interval VARCHAR(50),
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    payment_method VARCHAR(50),
    price_paid NUMERIC,
    cancellation_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_task_definitions_user_id ON video_generation_task_definitions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_statuses_task_id ON video_generation_task_statuses(task_id);
CREATE INDEX IF NOT EXISTS idx_task_statuses_status ON video_generation_task_statuses(status);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_task_id ON user_favorites(task_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generation_task_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generation_task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- user_credits policies
CREATE POLICY "Users can view their own credits"
    ON user_credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits"
    ON user_credits FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- video_generation_task_definitions policies
CREATE POLICY "Users can view their own tasks and public tasks"
    ON video_generation_task_definitions FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own tasks"
    ON video_generation_task_definitions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON video_generation_task_definitions FOR UPDATE
    USING (auth.uid() = user_id);

-- video_generation_task_statuses policies
CREATE POLICY "Users can view statuses of their tasks"
    ON video_generation_task_statuses FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM video_generation_task_definitions
        WHERE id = video_generation_task_statuses.task_id
        AND (user_id = auth.uid() OR user_id IS NULL)
    ));

CREATE POLICY "Service role can manage all task statuses"
    ON video_generation_task_statuses FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- user_favorites policies
CREATE POLICY "Users can manage their own favorites"
    ON user_favorites FOR ALL
    USING (auth.uid() = user_id);

-- user_subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
    ON user_subscriptions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Create function to get user credits
CREATE OR REPLACE FUNCTION get_user_credits(user_id_param UUID)
RETURNS TABLE (
    user_id UUID,
    credits_balance INTEGER,
    total_credits_purchased INTEGER,
    total_credits_used INTEGER,
    level VARCHAR,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.user_id,
        uc.credits_balance,
        uc.total_credits_purchased,
        uc.total_credits_used,
        uc.level,
        uc.last_purchase_date,
        uc.created_at,
        uc.updated_at
    FROM user_credits uc
    WHERE uc.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql; 
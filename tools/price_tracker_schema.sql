-- Price Tracker Schema

CREATE TABLE IF NOT EXISTS public.price_trackers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    asin VARCHAR(20) NOT NULL,
    marketplace VARCHAR(10) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
    is_active BOOLEAN DEFAULT true,
    alert_rules JSONB DEFAULT '{}', -- e.g. { "drop_percent": 5, "target_price": 20.00 }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id UUID REFERENCES public.price_trackers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    asin VARCHAR(20) NOT NULL,
    marketplace VARCHAR(10) NOT NULL,
    price DECIMAL(10, 2),
    currency VARCHAR(5),
    source VARCHAR(50) DEFAULT 'product_page', -- 'product_page', 'buy_box'
    run_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_trackers_user ON public.price_trackers(user_id);
CREATE INDEX IF NOT EXISTS idx_price_trackers_asin_market ON public.price_trackers(asin, marketplace);
CREATE INDEX IF NOT EXISTS idx_price_history_tracker ON public.price_history(tracker_id);
CREATE INDEX IF NOT EXISTS idx_price_history_asin ON public.price_history(asin, run_timestamp);

-- Enable UUID extension (already enabled in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table: Store additional user information linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table: Static company information
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    ticker TEXT NOT NULL UNIQUE,
    industry TEXT,
    sector TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Prices table: Daily stock price data
CREATE TABLE IF NOT EXISTS stock_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    open NUMERIC NOT NULL,
    high NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    volume BIGINT NOT NULL,
    CONSTRAINT unique_company_date UNIQUE (company_id, date)
);
CREATE INDEX IF NOT EXISTS idx_stock_prices_company_date ON stock_prices(company_id, date DESC);

-- Income Statements table: Quarterly and annual income data
CREATE TABLE IF NOT EXISTS income_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_end_date DATE NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('Q', 'A')),
    revenue NUMERIC NOT NULL,
    cost_of_goods_sold NUMERIC,
    gross_profit NUMERIC,
    operating_expenses NUMERIC,
    ebit NUMERIC,
    interest_expense NUMERIC,
    taxes NUMERIC,
    net_income NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_income_period UNIQUE (company_id, period_end_date, period_type)
);
CREATE INDEX IF NOT EXISTS idx_income_statements_company_period ON income_statements(company_id, period_end_date DESC, period_type);

-- Balance Sheets table: Quarterly and annual balance sheet data
CREATE TABLE IF NOT EXISTS balance_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_end_date DATE NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('Q', 'A')),
    cash NUMERIC,
    accounts_receivable NUMERIC,
    inventory NUMERIC,
    total_current_assets NUMERIC,
    property_plant_equipment NUMERIC,
    total_assets NUMERIC,
    accounts_payable NUMERIC,
    total_current_liabilities NUMERIC,
    long_term_debt NUMERIC,
    total_liabilities NUMERIC,
    shareholders_equity NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_balance_period UNIQUE (company_id, period_end_date, period_type)
);
CREATE INDEX IF NOT EXISTS idx_balance_sheets_company_period ON balance_sheets(company_id, period_end_date DESC, period_type);

-- Cash Flow Statements table: Quarterly and annual cash flow data
CREATE TABLE IF NOT EXISTS cash_flow_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_end_date DATE NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('Q', 'A')),
    net_income NUMERIC,
    depreciation_amortization NUMERIC,
    changes_in_working_capital NUMERIC,
    cash_from_operations NUMERIC,
    capital_expenditures NUMERIC,
    cash_from_investing NUMERIC,
    cash_from_financing NUMERIC,
    net_change_in_cash NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_cash_flow_period UNIQUE (company_id, period_end_date, period_type)
);
CREATE INDEX IF NOT EXISTS idx_cash_flow_statements_company_period ON cash_flow_statements(company_id, period_end_date DESC, period_type);

-- DCF Models table: User-specific DCF calculations
CREATE TABLE IF NOT EXISTS dcf_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    growth_rate NUMERIC NOT NULL,
    discount_rate NUMERIC NOT NULL,
    years INTEGER NOT NULL,
    intrinsic_value NUMERIC NOT NULL,
    upside_downside NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dcf_models_user_company ON dcf_models(user_id, company_id);

-- Subscriptions table: To manage user subscription status
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT,
    price_id TEXT,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    cancel_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_profiles_updated_at' AND tgrelid = 'profiles'::regclass
    ) THEN
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Trigger for dcf_models table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_dcf_models_updated_at' AND tgrelid = 'dcf_models'::regclass
    ) THEN
        CREATE TRIGGER update_dcf_models_updated_at
            BEFORE UPDATE ON dcf_models
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Row-Level Security (RLS) Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can manage their own profiles'
    ) THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can manage their own profiles" ON profiles
            FOR ALL TO authenticated
            USING (auth.uid() = auth_id)
            WITH CHECK (auth.uid() = auth_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'companies' AND policyname = 'Allow read access to authenticated users'
    ) THEN
        ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow read access to authenticated users" ON companies
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stock_prices' AND policyname = 'Allow read access to authenticated users'
    ) THEN
        ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow read access to authenticated users" ON stock_prices
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'income_statements' AND policyname = 'Allow read access to authenticated users'
    ) THEN
        ALTER TABLE income_statements ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow read access to authenticated users" ON income_statements
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'balance_sheets' AND policyname = 'Allow read access to authenticated users'
    ) THEN
        ALTER TABLE balance_sheets ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow read access to authenticated users" ON balance_sheets
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cash_flow_statements' AND policyname = 'Allow read access to authenticated users'
    ) THEN
        ALTER TABLE cash_flow_statements ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow read access to authenticated users" ON cash_flow_statements
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dcf_models' AND policyname = 'Users can manage their own models'
    ) THEN
        ALTER TABLE dcf_models ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can manage their own models" ON dcf_models
            FOR ALL TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscriptions' AND policyname = 'Users can manage their own subscriptions'
    ) THEN
        ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can manage their own subscriptions" ON subscriptions
            FOR ALL TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    data_consent BOOLEAN DEFAULT FALSE,
    research_consent BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User demographic profiles
CREATE TABLE IF NOT EXISTS user_demographic_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE,
    current_age INTEGER GENERATED ALWAYS AS (
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))
    ) STORED,
    
    -- Female-specific information
    menstrual_cycle_length INTEGER CHECK (menstrual_cycle_length BETWEEN 21 AND 35),
    last_menstrual_period DATE,
    current_menstrual_phase TEXT CHECK (current_menstrual_phase IN (
        'menstrual', 'follicular', 'ovulatory', 'luteal'
    )),
    pregnancy_status TEXT CHECK (pregnancy_status IN (
        'not_pregnant', 'pregnant', 'postpartum'
    )),
    menopause_status TEXT CHECK (menopause_status IN (
        'premenopausal', 'perimenopausal', 'postmenopausal'
    )),
    
    -- Additional health factors
    ethnicity TEXT,
    bmi DECIMAL(5,2),
    health_conditions TEXT[],
    medications TEXT[],
    lifestyle_factors JSONB,
    
    -- Supplement preferences
    supplement_preferences JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scientific references
CREATE TABLE IF NOT EXISTS scientific_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Publication details
    title TEXT NOT NULL,
    authors TEXT[],
    journal TEXT,
    publication_year INTEGER CHECK (publication_year BETWEEN 1900 AND EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    volume TEXT,
    issue TEXT,
    pages TEXT,
    
    -- Identifiers
    pubmed_id TEXT UNIQUE,
    doi TEXT UNIQUE,
    url TEXT,
    
    -- Study details
    study_type TEXT CHECK (study_type IN (
        'randomized_controlled_trial', 'cohort', 'case_control', 'review', 'meta_analysis', 'other'
    )),
    sample_size INTEGER,
    population_description TEXT,
    study_duration TEXT,
    
    -- Quality metrics
    evidence_quality TEXT CHECK (evidence_quality IN ('high', 'moderate', 'low', 'very_low')) DEFAULT 'moderate',
    bias_risk TEXT CHECK (bias_risk IN ('low', 'moderate', 'high', 'unclear')),
    relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 10),
    
    -- Content
    abstract TEXT,
    key_findings TEXT,
    limitations TEXT,
    notes TEXT,
    
    -- Metadata
    added_by UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    verification_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Biomarkers
CREATE TABLE IF NOT EXISTS biomarkers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    aliases TEXT[],
    category TEXT NOT NULL, -- 'hormones', 'vitamins', 'minerals', 'lipids', etc.
    subcategory TEXT,
    unit TEXT NOT NULL,
    
    -- Basic conventional ranges (for reference only)
    conventional_min DECIMAL(10,3),
    conventional_max DECIMAL(10,3),
    
    -- Descriptive information
    description TEXT,
    clinical_significance TEXT,
    testing_method TEXT CHECK (testing_method IN ('serum', 'plasma', 'urine', 'saliva', 'other')),
    fasting_required BOOLEAN DEFAULT FALSE,
    
    -- Data source tracking
    source TEXT,
    source_url TEXT,
    last_verified TIMESTAMP WITH TIME ZONE,
    
    -- Relationships
    related_biomarkers UUID[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Biomarker optimal ranges with demographic specificity
CREATE TABLE IF NOT EXISTS biomarker_optimal_ranges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    biomarker_id UUID REFERENCES biomarkers(id) ON DELETE CASCADE,
    
    -- Demographic criteria
    gender TEXT CHECK (gender IN ('male', 'female', 'all')),
    age_min INTEGER CHECK (age_min >= 0),
    age_max INTEGER CHECK (age_max >= age_min),
    menstrual_phase TEXT CHECK (menstrual_phase IN (
        'menstrual', 'follicular', 'ovulatory', 'luteal', 'postmenopausal'
    )),
    pregnancy_status TEXT CHECK (pregnancy_status IN (
        'not_pregnant', 'pregnant', 'postpartum'
    )),
    additional_criteria JSONB,
    
    -- Optimal ranges
    optimal_min DECIMAL(10,3) NOT NULL,
    optimal_max DECIMAL(10,3) NOT NULL,
    functional_min DECIMAL(10,3),
    functional_max DECIMAL(10,3),
    
    -- Range metadata
    range_type TEXT DEFAULT 'optimal' CHECK (range_type IN ('optimal', 'functional', 'therapeutic')),
    confidence_level TEXT DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
    population_studied TEXT,
    
    -- Scientific backing
    scientific_references UUID[],
    evidence_level TEXT CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'expert_opinion')) DEFAULT 'moderate',
    last_updated DATE DEFAULT CURRENT_DATE,
    
    -- Priority and usage
    is_primary BOOLEAN DEFAULT FALSE,
    usage_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ensure logical ranges
    CONSTRAINT valid_ranges CHECK (optimal_min <= optimal_max),
    CONSTRAINT valid_functional_ranges CHECK (
        functional_min IS NULL OR functional_max IS NULL OR functional_min <= functional_max
    )
);

-- Documents (uploaded blood tests)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    filesize INTEGER NOT NULL,
    mimetype TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('uploading', 'processing', 'completed', 'failed')) DEFAULT 'uploading',
    ocr_data JSONB,
    extracted_biomarkers JSONB,
    processing_errors TEXT[]
);

-- Health analyses
CREATE TABLE IF NOT EXISTS health_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    
    -- Analysis results
    overall_health_score INTEGER CHECK (overall_health_score BETWEEN 0 AND 100),
    health_category TEXT CHECK (health_category IN ('poor', 'fair', 'good', 'excellent')),
    biomarker_insights JSONB NOT NULL,
    root_causes JSONB,
    
    -- Recommendations preview
    recommendations_summary JSONB,
    
    -- Context and evidence
    demographic_context JSONB,
    evidence_summary JSONB,
    
    -- Safety and disclaimers
    warnings JSONB,
    disclaimers TEXT[],
    
    -- Processing metadata
    processing_time INTEGER, -- milliseconds
    claude_tokens_used INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Biomarker readings (from analyses)
CREATE TABLE IF NOT EXISTS biomarker_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES health_analyses(id) ON DELETE CASCADE,
    biomarker_id UUID REFERENCES biomarkers(id),
    value DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    status TEXT CHECK (status IN ('deficient', 'suboptimal', 'optimal', 'excess', 'concerning')),
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
    optimal_range_used UUID REFERENCES biomarker_optimal_ranges(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplements
CREATE TABLE IF NOT EXISTS supplements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT, -- 'vitamin', 'mineral', 'herb', 'amino_acid', etc.
    active_ingredients TEXT[],
    
    -- Product details
    description TEXT,
    dosage_forms TEXT[], -- 'capsule', 'tablet', 'powder', 'liquid'
    
    -- Pricing and availability
    average_price DECIMAL(8,2),
    currency TEXT DEFAULT 'USD',
    
    -- Safety information
    contraindications TEXT[],
    drug_interactions TEXT[],
    side_effects TEXT[],
    
    -- Quality markers
    third_party_tested BOOLEAN DEFAULT FALSE,
    organic BOOLEAN DEFAULT FALSE,
    gmp_certified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Enhanced supplement protocols with scientific backing
CREATE TABLE IF NOT EXISTS supplement_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    biomarker_id UUID REFERENCES biomarkers(id),
    supplement_id UUID REFERENCES supplements(id),
    
    -- Target demographics
    gender TEXT CHECK (gender IN ('male', 'female', 'all')),
    age_min INTEGER CHECK (age_min >= 0),
    age_max INTEGER CHECK (age_max >= age_min),
    menstrual_phase TEXT CHECK (menstrual_phase IN (
        'menstrual', 'follicular', 'ovulatory', 'luteal', 'postmenopausal'
    )),
    pregnancy_status TEXT CHECK (pregnancy_status IN (
        'not_pregnant', 'pregnant', 'postpartum'
    )),
    additional_criteria JSONB,
    
    -- Protocol details
    condition TEXT CHECK (condition IN ('deficient', 'suboptimal', 'optimization', 'therapeutic')),
    deficiency_level TEXT CHECK (deficiency_level IN ('mild', 'moderate', 'severe')),
    
    -- Dosage information
    dosage_min INTEGER NOT NULL,
    dosage_max INTEGER NOT NULL,
    dosage_unit TEXT NOT NULL,
    frequency TEXT NOT NULL, -- 'once daily', 'twice daily', 'as needed'
    timing TEXT, -- 'morning', 'evening', 'with_meals', 'empty_stomach'
    duration_weeks INTEGER,
    
    -- Target ranges and goals
    target_biomarker_min DECIMAL(10,3),
    target_biomarker_max DECIMAL(10,3),
    expected_improvement_percent INTEGER,
    expected_timeframe_weeks INTEGER,
    
    -- Scientific evidence
    scientific_references UUID[],
    evidence_level TEXT CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'expert_opinion')) DEFAULT 'moderate',
    mechanism_of_action TEXT,
    absorption_factors TEXT,
    
    -- Safety and monitoring
    contraindications TEXT[],
    drug_interactions TEXT[],
    side_effects TEXT[],
    monitoring_recommendations TEXT[],
    warning_signs TEXT[],
    
    -- Clinical guidance
    notes TEXT,
    clinical_rationale TEXT,
    alternative_protocols UUID[],
    
    -- Quality and usage
    confidence_level TEXT DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
    usage_frequency INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    
    -- Pricing
    estimated_monthly_cost DECIMAL(8,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ensure logical values
    CONSTRAINT valid_dosage CHECK (dosage_min <= dosage_max),
    CONSTRAINT valid_targets CHECK (
        target_biomarker_min IS NULL OR target_biomarker_max IS NULL OR 
        target_biomarker_min <= target_biomarker_max
    )
);

-- Supplement recommendations (generated from analyses)
CREATE TABLE IF NOT EXISTS supplement_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES health_analyses(id) ON DELETE CASCADE,
    protocol_id UUID REFERENCES supplement_protocols(id),
    
    -- Personalized recommendation
    supplement_name TEXT NOT NULL,
    dosage_amount INTEGER NOT NULL,
    dosage_unit TEXT NOT NULL,
    frequency TEXT NOT NULL,
    timing TEXT,
    duration_weeks INTEGER,
    
    -- Recommendation context
    priority TEXT CHECK (priority IN ('essential', 'beneficial', 'optional')) DEFAULT 'beneficial',
    reason TEXT NOT NULL,
    target_biomarkers TEXT[],
    expected_outcome TEXT,
    
    -- Scientific backing
    evidence_level TEXT CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'expert_opinion')),
    scientific_references UUID[],
    mechanism_of_action TEXT,
    clinical_rationale TEXT,
    
    -- Safety information
    contraindications TEXT[],
    drug_interactions TEXT[],
    side_effects TEXT[],
    monitoring_needed TEXT[],
    
    -- Cost and availability
    estimated_monthly_cost DECIMAL(8,2),
    
    -- User interaction
    user_accepted BOOLEAN,
    user_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner suppliers
CREATE TABLE IF NOT EXISTS partner_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    
    -- Business details
    business_type TEXT, -- 'pharmacy', 'health_store', 'online_retailer'
    location TEXT,
    shipping_regions TEXT[],
    
    -- Commission structure
    commission_rate DECIMAL(5,2) NOT NULL, -- percentage
    payment_terms TEXT,
    
    -- Integration details
    api_endpoint TEXT,
    notification_email TEXT,
    order_format TEXT, -- 'email', 'api', 'csv'
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner products (supplements available from partners)
CREATE TABLE IF NOT EXISTS partner_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partner_suppliers(id) ON DELETE CASCADE,
    supplement_id UUID REFERENCES supplements(id),
    
    -- Product details
    partner_product_id TEXT, -- Partner's internal product ID
    product_name TEXT NOT NULL,
    brand TEXT,
    size TEXT, -- '60 capsules', '500ml', etc.
    strength TEXT, -- '1000mg', '25mcg', etc.
    
    -- Pricing
    unit_price DECIMAL(8,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    bulk_pricing JSONB, -- Pricing tiers for larger quantities
    
    -- Availability
    in_stock BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER,
    lead_time_days INTEGER,
    
    -- Product URLs and images
    product_url TEXT,
    image_urls TEXT[],
    
    -- Metadata
    last_price_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    analysis_id UUID REFERENCES health_analyses(id),
    
    -- Order details
    order_number TEXT UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- Payment information
    payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    payment_method TEXT, -- 'paymee', 'stripe', 'bank_transfer'
    payment_transaction_id TEXT,
    
    -- Fulfillment
    fulfillment_status TEXT CHECK (fulfillment_status IN ('processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'processing',
    shipping_address JSONB,
    tracking_number TEXT,
    estimated_delivery DATE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Partner information
    partner_notifications_sent BOOLEAN DEFAULT FALSE,
    partner_confirmations JSONB,
    
    -- Commission tracking
    total_commission DECIMAL(10,2),
    commission_paid BOOLEAN DEFAULT FALSE,
    commission_paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    partner_product_id UUID REFERENCES partner_products(id),
    recommendation_id UUID REFERENCES supplement_recommendations(id),
    
    -- Item details
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Partner and commission
    partner_id UUID REFERENCES partner_suppliers(id),
    commission_rate DECIMAL(5,2),
    commission_amount DECIMAL(8,2),
    
    -- Fulfillment tracking
    status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    partner_order_id TEXT, -- Partner's tracking ID for this item
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_demographic_profiles_user ON user_demographic_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_category ON biomarkers(category);
CREATE INDEX IF NOT EXISTS idx_biomarkers_name ON biomarkers(name);
CREATE INDEX IF NOT EXISTS idx_optimal_ranges_biomarker ON biomarker_optimal_ranges(biomarker_id);
CREATE INDEX IF NOT EXISTS idx_optimal_ranges_demographics ON biomarker_optimal_ranges(gender, age_min, age_max);
CREATE INDEX IF NOT EXISTS idx_optimal_ranges_primary ON biomarker_optimal_ranges(biomarker_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_analyses_user ON health_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created ON health_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_biomarker_readings_analysis ON biomarker_readings(analysis_id);
CREATE INDEX IF NOT EXISTS idx_supplements_category ON supplements(category);
CREATE INDEX IF NOT EXISTS idx_protocols_biomarker ON supplement_protocols(biomarker_id);
CREATE INDEX IF NOT EXISTS idx_protocols_supplement ON supplement_protocols(supplement_id);
CREATE INDEX IF NOT EXISTS idx_protocols_demographics ON supplement_protocols(gender, age_min, age_max);
CREATE INDEX IF NOT EXISTS idx_recommendations_analysis ON supplement_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_partner ON partner_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_supplement ON partner_products(supplement_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_demographic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarker_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own demographic profile" ON user_demographic_profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own documents" ON documents FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own analyses" ON health_analyses FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own biomarker readings" ON biomarker_readings FOR SELECT USING (
    EXISTS (SELECT 1 FROM health_analyses WHERE id = analysis_id AND user_id = auth.uid())
);

CREATE POLICY "Users can read own supplement recommendations" ON supplement_recommendations FOR SELECT USING (
    EXISTS (SELECT 1 FROM health_analyses WHERE id = analysis_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage own orders" ON orders FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);

-- Public read access for reference data
CREATE POLICY "Public read access to biomarkers" ON biomarkers FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to optimal ranges" ON biomarker_optimal_ranges FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to supplements" ON supplements FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to protocols" ON supplement_protocols FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to partner products" ON partner_products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to scientific references" ON scientific_references FOR SELECT USING (is_active = true);
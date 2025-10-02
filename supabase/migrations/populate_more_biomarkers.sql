-- Additional Biomarkers for Testing
INSERT INTO biomarkers (name, category, unit, conventional_min, conventional_max, description, clinical_significance, aliases) VALUES
-- Additional Vitamins
('Vitamin A (Retinol)', 'vitamins', 'μg/dL', 20, 80, 'Fat-soluble vitamin important for vision', 'Essential for eye health, immune function, and cellular growth', ARRAY['Retinol', 'Vitamin A']),
('Vitamin E (Tocopherol)', 'vitamins', 'mg/L', 5, 20, 'Antioxidant vitamin', 'Protects cells from oxidative damage', ARRAY['Tocopherol', 'Alpha-tocopherol']),
('Vitamin K', 'vitamins', 'ng/mL', 0.1, 2.2, 'Essential for blood clotting', 'Critical for bone health and blood coagulation', ARRAY['Phylloquinone']),
('Folate', 'vitamins', 'ng/mL', 2.7, 17.0, 'Essential B vitamin', 'Important for DNA synthesis and red blood cell formation', ARRAY['Folic Acid', 'Vitamin B9']),
('Biotin', 'vitamins', 'ng/mL', 200, 1200, 'B vitamin essential for metabolism', 'Important for hair, skin, and nail health', ARRAY['Vitamin B7']),

-- Additional Hormones
('Free T4', 'hormones', 'ng/dL', 0.9, 1.7, 'Free thyroxine hormone', 'Primary thyroid hormone affecting metabolism', ARRAY['Thyroxine', 'T4']),
('Reverse T3', 'hormones', 'ng/dL', 8, 25, 'Inactive thyroid hormone', 'Marker of thyroid hormone conversion', ARRAY['rT3']),
('Cortisol (AM)', 'hormones', 'μg/dL', 6, 23, 'Stress hormone measured in morning', 'Indicates adrenal function and stress response', ARRAY['Morning Cortisol']),
('DHEA-S', 'hormones', 'μg/dL', 85, 690, 'Adrenal hormone precursor', 'Important for hormone production and aging', ARRAY['DHEA Sulfate']),
('Testosterone (Total)', 'hormones', 'ng/dL', 240, 950, 'Primary male sex hormone', 'Important for muscle mass, energy, and reproductive health', ARRAY['Total Testosterone']),
('Estradiol', 'hormones', 'pg/mL', 15, 350, 'Primary female sex hormone', 'Important for reproductive health and bone density', ARRAY['E2']),
('Progesterone', 'hormones', 'ng/mL', 0.2, 25, 'Female hormone important for pregnancy', 'Balances estrogen and supports reproductive health', ARRAY[]),
('Insulin (Fasting)', 'hormones', 'μIU/mL', 2, 25, 'Hormone regulating blood sugar', 'Key marker for diabetes and metabolic health', ARRAY['Fasting Insulin']),

-- Additional Minerals and Trace Elements
('Copper', 'minerals', 'μg/dL', 70, 175, 'Essential trace mineral', 'Important for iron absorption and connective tissue', ARRAY[]),
('Selenium', 'minerals', 'μg/L', 70, 150, 'Antioxidant mineral', 'Important for thyroid function and immune health', ARRAY[]),
('Iodine', 'minerals', 'μg/L', 40, 300, 'Essential for thyroid function', 'Critical for thyroid hormone production', ARRAY[]),
('Manganese', 'minerals', 'μg/L', 4, 15, 'Trace mineral for bone health', 'Important for bone formation and wound healing', ARRAY[]),
('Chromium', 'minerals', 'μg/L', 0.1, 2.0, 'Trace mineral for glucose metabolism', 'Helps with insulin sensitivity and glucose control', ARRAY[]),

-- Additional Cardiovascular Markers
('Apolipoprotein A1', 'cardiovascular', 'mg/dL', 120, 180, 'Protein component of HDL', 'Better predictor of heart disease than HDL alone', ARRAY['ApoA1']),
('Apolipoprotein B', 'cardiovascular', 'mg/dL', 40, 120, 'Protein component of LDL', 'Strong predictor of cardiovascular risk', ARRAY['ApoB']),
('Lipoprotein(a)', 'cardiovascular', 'mg/dL', 0, 30, 'Genetic cardiovascular risk factor', 'Independent risk factor for heart disease', ARRAY['Lp(a)']),
('Small Dense LDL', 'cardiovascular', 'mg/dL', 0, 40, 'Atherogenic LDL subtype', 'More dangerous form of LDL cholesterol', ARRAY['sdLDL']),

-- Additional Inflammatory Markers
('ESR', 'inflammation', 'mm/hr', 0, 30, 'Erythrocyte sedimentation rate', 'General marker of inflammation', ARRAY['Sed Rate']),
('IL-6', 'inflammation', 'pg/mL', 0, 7, 'Pro-inflammatory cytokine', 'Marker of chronic inflammation', ARRAY['Interleukin-6']),
('TNF-alpha', 'inflammation', 'pg/mL', 0, 8, 'Pro-inflammatory cytokine', 'Important inflammatory mediator', ARRAY['Tumor Necrosis Factor']),

-- Additional Metabolic Markers
('Insulin-like Growth Factor-1', 'metabolic', 'ng/mL', 115, 307, 'Growth hormone marker', 'Indicates growth hormone status and aging', ARRAY['IGF-1']),
('Leptin', 'metabolic', 'ng/mL', 1, 100, 'Appetite regulation hormone', 'Indicates metabolic health and satiety', ARRAY[]),
('Adiponectin', 'metabolic', 'μg/mL', 3, 30, 'Anti-inflammatory hormone from fat cells', 'Protective against diabetes and heart disease', ARRAY[]),

-- Liver Function Markers
('ALT', 'liver', 'U/L', 7, 40, 'Alanine aminotransferase', 'Liver enzyme indicating liver health', ARRAY['SGPT']),
('AST', 'liver', 'U/L', 8, 40, 'Aspartate aminotransferase', 'Liver enzyme, also in muscle and heart', ARRAY['SGOT']),
('GGT', 'liver', 'U/L', 9, 48, 'Gamma-glutamyl transferase', 'Liver enzyme sensitive to alcohol and toxins', ARRAY['Gamma GT']),
('Alkaline Phosphatase', 'liver', 'U/L', 44, 147, 'Enzyme in liver and bone', 'Indicates liver or bone disorders', ARRAY['ALP']),
('Total Bilirubin', 'liver', 'mg/dL', 0.3, 1.2, 'Breakdown product of red blood cells', 'Indicates liver function and red blood cell turnover', ARRAY['Bilirubin']),

-- Kidney Function Markers
('Creatinine', 'kidney', 'mg/dL', 0.6, 1.3, 'Waste product filtered by kidneys', 'Primary marker of kidney function', ARRAY[]),
('BUN', 'kidney', 'mg/dL', 7, 20, 'Blood urea nitrogen', 'Waste product indicating kidney function', ARRAY['Urea Nitrogen']),
('eGFR', 'kidney', 'mL/min/1.73m²', 60, 120, 'Estimated glomerular filtration rate', 'Calculated measure of kidney function', ARRAY['Estimated GFR']),
('Uric Acid', 'kidney', 'mg/dL', 3.5, 7.2, 'Purine metabolism end product', 'Associated with gout and cardiovascular risk', ARRAY[]);

-- Additional Optimal Ranges for new biomarkers
INSERT INTO biomarker_optimal_ranges (biomarker_id, gender, age_min, age_max, optimal_min, optimal_max, functional_min, functional_max, evidence_level, confidence_level, is_primary) VALUES
-- Vitamin A ranges
((SELECT id FROM biomarkers WHERE name = 'Vitamin A (Retinol)'), 'all', 18, NULL, 30, 70, 40, 60, 'moderate', 'high', true),

-- Vitamin E ranges
((SELECT id FROM biomarkers WHERE name = 'Vitamin E (Tocopherol)'), 'all', 18, NULL, 8, 18, 10, 15, 'moderate', 'high', true),

-- Folate ranges
((SELECT id FROM biomarkers WHERE name = 'Folate'), 'all', 18, NULL, 7, 24, 10, 20, 'strong', 'high', true),

-- Additional thyroid ranges
((SELECT id FROM biomarkers WHERE name = 'Free T4'), 'all', 18, NULL, 1.0, 1.5, 1.1, 1.4, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Reverse T3'), 'all', 18, NULL, 8, 20, 10, 18, 'moderate', 'medium', true),

-- Adrenal hormones
((SELECT id FROM biomarkers WHERE name = 'Cortisol (AM)'), 'all', 18, NULL, 10, 18, 12, 16, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'DHEA-S'), 'male', 18, 30, 350, 650, 400, 600, 'moderate', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'DHEA-S'), 'female', 18, 30, 250, 450, 300, 400, 'moderate', 'high', true),

-- Sex hormones (gender-specific)
((SELECT id FROM biomarkers WHERE name = 'Testosterone (Total)'), 'male', 18, NULL, 550, 850, 600, 800, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Testosterone (Total)'), 'female', 18, NULL, 20, 70, 30, 60, 'moderate', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Estradiol'), 'female', 18, 50, 80, 250, 100, 200, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Estradiol'), 'male', 18, NULL, 20, 40, 25, 35, 'moderate', 'high', true),

-- Metabolic markers
((SELECT id FROM biomarkers WHERE name = 'Insulin (Fasting)'), 'all', 18, NULL, 2, 8, 3, 6, 'strong', 'high', true),

-- Additional minerals
((SELECT id FROM biomarkers WHERE name = 'Copper'), 'all', 18, NULL, 90, 140, 100, 130, 'moderate', 'medium', true),
((SELECT id FROM biomarkers WHERE name = 'Selenium'), 'all', 18, NULL, 90, 130, 100, 120, 'moderate', 'high', true),

-- Cardiovascular markers
((SELECT id FROM biomarkers WHERE name = 'Apolipoprotein A1'), 'male', 18, NULL, 130, 170, 140, 160, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Apolipoprotein A1'), 'female', 18, NULL, 140, 180, 150, 170, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Apolipoprotein B'), 'all', 18, NULL, 60, 100, 70, 90, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Lipoprotein(a)'), 'all', 18, NULL, 0, 20, 0, 15, 'strong', 'high', true),

-- Liver function
((SELECT id FROM biomarkers WHERE name = 'ALT'), 'male', 18, NULL, 10, 30, 15, 25, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'ALT'), 'female', 18, NULL, 7, 25, 10, 20, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'AST'), 'all', 18, NULL, 10, 30, 15, 25, 'strong', 'high', true),

-- Kidney function
((SELECT id FROM biomarkers WHERE name = 'Creatinine'), 'male', 18, NULL, 0.8, 1.2, 0.9, 1.1, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Creatinine'), 'female', 18, NULL, 0.6, 1.0, 0.7, 0.9, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'eGFR'), 'all', 18, NULL, 90, 120, 95, 115, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Uric Acid'), 'male', 18, NULL, 4.0, 6.5, 4.5, 6.0, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Uric Acid'), 'female', 18, NULL, 3.0, 5.5, 3.5, 5.0, 'strong', 'high', true); 
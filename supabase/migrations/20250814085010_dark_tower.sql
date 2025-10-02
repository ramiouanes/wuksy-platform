-- Sample Biomarkers Data
INSERT INTO biomarkers (name, category, unit, conventional_min, conventional_max, description, clinical_significance) VALUES
('25-Hydroxyvitamin D', 'vitamins', 'ng/mL', 20, 100, 'Primary marker of vitamin D status', 'Essential for bone health, immune function, and hormone production'),
('Vitamin B12', 'vitamins', 'pg/mL', 200, 900, 'Active form of vitamin B12', 'Critical for nerve function, DNA synthesis, and red blood cell formation'),
('Ferritin', 'minerals', 'ng/mL', 15, 200, 'Iron storage protein', 'Indicates iron stores in the body'),
('TSH', 'hormones', 'mIU/L', 0.4, 4.0, 'Thyroid stimulating hormone', 'Regulates thyroid function and metabolism'),
('Free T3', 'hormones', 'pg/mL', 2.3, 4.2, 'Active thyroid hormone', 'Primary active thyroid hormone affecting metabolism'),
('Total Cholesterol', 'lipids', 'mg/dL', 125, 200, 'Total cholesterol levels', 'Marker for cardiovascular risk assessment'),
('HDL Cholesterol', 'lipids', 'mg/dL', 40, 100, 'High-density lipoprotein cholesterol', 'Protective cholesterol that helps remove other forms of cholesterol'),
('LDL Cholesterol', 'lipids', 'mg/dL', 50, 100, 'Low-density lipoprotein cholesterol', 'Primary cholesterol associated with cardiovascular risk'),
('Triglycerides', 'lipids', 'mg/dL', 50, 150, 'Blood fat levels', 'Important marker for metabolic health and cardiovascular risk'),
('Fasting Glucose', 'metabolic', 'mg/dL', 70, 100, 'Blood sugar levels after fasting', 'Primary marker for diabetes risk and metabolic health'),
('HbA1c', 'metabolic', '%', 4.0, 5.7, 'Average blood sugar over 2-3 months', 'Long-term marker for diabetes and glucose control'),
('Magnesium', 'minerals', 'mg/dL', 1.7, 2.2, 'Essential mineral for enzyme function', 'Critical for muscle function, nerve transmission, and bone health'),
('Zinc', 'minerals', 'μg/dL', 70, 120, 'Essential trace element', 'Important for immune function, wound healing, and protein synthesis'),
('C-Reactive Protein', 'inflammation', 'mg/L', 0, 3.0, 'Marker of systemic inflammation', 'General indicator of inflammation in the body'),
('Homocysteine', 'cardiovascular', 'μmol/L', 5, 15, 'Amino acid linked to cardiovascular risk', 'Elevated levels associated with increased heart disease risk');

-- Sample Optimal Ranges (Functional Medicine ranges)
INSERT INTO biomarker_optimal_ranges (biomarker_id, gender, age_min, age_max, optimal_min, optimal_max, functional_min, functional_max, evidence_level, confidence_level, is_primary) VALUES
-- Vitamin D ranges by demographics
((SELECT id FROM biomarkers WHERE name = '25-Hydroxyvitamin D'), 'all', 18, 65, 40, 80, 50, 80, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = '25-Hydroxyvitamin D'), 'female', 18, 45, 40, 80, 50, 80, 'strong', 'high', false),
((SELECT id FROM biomarkers WHERE name = '25-Hydroxyvitamin D'), 'all', 65, NULL, 50, 80, 60, 80, 'moderate', 'high', false),

-- B12 ranges
((SELECT id FROM biomarkers WHERE name = 'Vitamin B12'), 'all', 18, NULL, 500, 1500, 600, 1200, 'strong', 'high', true),

-- Ferritin ranges (gender-specific)
((SELECT id FROM biomarkers WHERE name = 'Ferritin'), 'male', 18, NULL, 50, 200, 75, 150, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Ferritin'), 'female', 18, 50, 30, 150, 50, 100, 'strong', 'high', true),

-- Thyroid ranges
((SELECT id FROM biomarkers WHERE name = 'TSH'), 'all', 18, NULL, 1.0, 2.5, 1.5, 2.0, 'moderate', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Free T3'), 'all', 18, NULL, 3.0, 4.0, 3.2, 3.8, 'moderate', 'high', true),

-- Lipid ranges
((SELECT id FROM biomarkers WHERE name = 'Total Cholesterol'), 'all', 18, NULL, 150, 220, 160, 200, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'HDL Cholesterol'), 'male', 18, NULL, 45, 85, 50, 80, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'HDL Cholesterol'), 'female', 18, NULL, 55, 95, 60, 90, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'LDL Cholesterol'), 'all', 18, NULL, 60, 120, 70, 100, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Triglycerides'), 'all', 18, NULL, 50, 100, 60, 90, 'strong', 'high', true),

-- Metabolic ranges
((SELECT id FROM biomarkers WHERE name = 'Fasting Glucose'), 'all', 18, NULL, 75, 95, 80, 90, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'HbA1c'), 'all', 18, NULL, 4.5, 5.5, 4.8, 5.2, 'strong', 'high', true),

-- Mineral ranges
((SELECT id FROM biomarkers WHERE name = 'Magnesium'), 'all', 18, NULL, 2.0, 2.4, 2.1, 2.3, 'moderate', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Zinc'), 'all', 18, NULL, 90, 130, 100, 120, 'moderate', 'medium', true),

-- Inflammation ranges
((SELECT id FROM biomarkers WHERE name = 'C-Reactive Protein'), 'all', 18, NULL, 0, 1.0, 0, 0.5, 'strong', 'high', true),
((SELECT id FROM biomarkers WHERE name = 'Homocysteine'), 'all', 18, NULL, 6, 10, 7, 9, 'moderate', 'high', true);

-- Sample Supplements
INSERT INTO supplements (name, category, description, dosage_forms, average_price, contraindications, drug_interactions) VALUES
('Vitamin D3 (Cholecalciferol)', 'vitamin', 'Bioactive form of vitamin D for optimal absorption', ARRAY['capsule', 'liquid', 'tablet'], 15.99, ARRAY['hypercalcemia', 'kidney stones'], ARRAY['thiazide diuretics', 'digoxin']),
('Methylcobalamin B12', 'vitamin', 'Active form of vitamin B12 for better bioavailability', ARRAY['sublingual', 'capsule', 'injection'], 24.99, ARRAY['cobalt allergy'], ARRAY['metformin', 'proton pump inhibitors']),
('Iron Bisglycinate', 'mineral', 'Gentle, highly absorbable form of iron', ARRAY['capsule', 'tablet'], 19.99, ARRAY['hemochromatosis', 'iron overload'], ARRAY['tetracycline', 'quinolone antibiotics']),
('Levothyroxine', 'hormone', 'Synthetic thyroid hormone replacement', ARRAY['tablet'], 12.99, ARRAY['adrenal insufficiency', 'thyrotoxicosis'], ARRAY['calcium', 'iron', 'coffee']),
('Omega-3 EPA/DHA', 'essential_fatty_acid', 'High-quality fish oil for cardiovascular and brain health', ARRAY['softgel', 'liquid'], 34.99, ARRAY['fish allergy', 'bleeding disorders'], ARRAY['anticoagulants', 'antiplatelet drugs']),
('Magnesium Glycinate', 'mineral', 'Highly bioavailable form of magnesium', ARRAY['capsule', 'powder'], 22.99, ARRAY['kidney disease', 'myasthenia gravis'], ARRAY['bisphosphonates', 'antibiotics']),
('Zinc Picolinate', 'mineral', 'Well-absorbed form of zinc for immune support', ARRAY['capsule', 'tablet'], 16.99, ARRAY['copper deficiency'], ARRAY['quinolone antibiotics', 'penicillamine']),
('Curcumin with Piperine', 'herb', 'Anti-inflammatory compound with enhanced absorption', ARRAY['capsule', 'powder'], 29.99, ARRAY['gallbladder disease', 'bleeding disorders'], ARRAY['anticoagulants', 'diabetes medications']),
('Folate (5-MTHF)', 'vitamin', 'Active form of folate for better utilization', ARRAY['capsule', 'tablet'], 18.99, ARRAY['B12 deficiency'], ARRAY['methotrexate', 'phenytoin']),
('Probiotics Multi-Strain', 'probiotic', 'Comprehensive blend of beneficial bacteria', ARRAY['capsule', 'powder'], 39.99, ARRAY['immunocompromised patients'], ARRAY['antibiotics']);

-- Sample Supplement Protocols
INSERT INTO supplement_protocols (
    biomarker_id, supplement_id, gender, condition, deficiency_level, 
    dosage_min, dosage_max, dosage_unit, frequency, timing, duration_weeks,
    evidence_level, clinical_rationale, estimated_monthly_cost
) VALUES
-- Vitamin D protocols
((SELECT id FROM biomarkers WHERE name = '25-Hydroxyvitamin D'), 
 (SELECT id FROM supplements WHERE name = 'Vitamin D3 (Cholecalciferol)'), 
 'all', 'deficient', 'mild', 2000, 4000, 'IU', 'once daily', 'with_meals', 12,
 'strong', 'Moderate deficiency requires sustained supplementation to reach optimal levels', 15.99),

((SELECT id FROM biomarkers WHERE name = '25-Hydroxyvitamin D'), 
 (SELECT id FROM supplements WHERE name = 'Vitamin D3 (Cholecalciferol)'), 
 'all', 'deficient', 'moderate', 4000, 6000, 'IU', 'once daily', 'with_meals', 16,
 'strong', 'Moderate to severe deficiency requires higher doses for correction', 15.99),

((SELECT id FROM biomarkers WHERE name = '25-Hydroxyvitamin D'), 
 (SELECT id FROM supplements WHERE name = 'Vitamin D3 (Cholecalciferol)'), 
 'all', 'deficient', 'severe', 6000, 10000, 'IU', 'once daily', 'with_meals', 20,
 'moderate', 'Severe deficiency may require high-dose correction under monitoring', 15.99),

-- B12 protocols
((SELECT id FROM biomarkers WHERE name = 'Vitamin B12'), 
 (SELECT id FROM supplements WHERE name = 'Methylcobalamin B12'), 
 'all', 'deficient', 'mild', 1000, 2000, 'mcg', 'once daily', 'morning', 8,
 'strong', 'Mild B12 deficiency responds well to oral supplementation', 24.99),

-- Iron protocols (gender-specific)
((SELECT id FROM biomarkers WHERE name = 'Ferritin'), 
 (SELECT id FROM supplements WHERE name = 'Iron Bisglycinate'), 
 'female', 'deficient', 'moderate', 25, 50, 'mg', 'once daily', 'empty_stomach', 12,
 'strong', 'Women with low ferritin benefit from gentle iron supplementation', 19.99),

-- Magnesium protocols
((SELECT id FROM biomarkers WHERE name = 'Magnesium'), 
 (SELECT id FROM supplements WHERE name = 'Magnesium Glycinate'), 
 'all', 'suboptimal', 'mild', 200, 400, 'mg', 'once daily', 'evening', 8,
 'moderate', 'Magnesium supplementation supports muscle and nerve function', 22.99);

-- Sample Scientific References
INSERT INTO scientific_references (
    title, authors, journal, publication_year, pubmed_id, doi, study_type, 
    evidence_quality, key_findings, abstract
) VALUES
('Vitamin D supplementation to prevent acute respiratory tract infections: systematic review and meta-analysis',
 ARRAY['Martineau AR', 'Jolliffe DA', 'Hooper RL', 'Greenberg L'],
 'BMJ', 2017, '28202713', '10.1136/bmj.i6583', 'meta_analysis', 'high',
 'Vitamin D supplementation reduced the risk of acute respiratory tract infection by 12% overall',
 'Objective: To assess the overall effect of vitamin D supplementation on risk of acute respiratory tract infection, and to identify factors modifying this effect...'),

('Effects of vitamin D supplementation on musculoskeletal health: a systematic review, meta-analysis, and trial sequential analysis',
 ARRAY['Bolland MJ', 'Grey A', 'Gamble GD', 'Reid IR'],
 'Lancet Diabetes Endocrinol', 2018, '29409663', '10.1016/S2213-8587(17)30359-1', 'meta_analysis', 'high',
 'Vitamin D supplementation did not prevent fractures or falls, or have clinically meaningful effects on bone mineral density',
 'Background: Guidelines recommend vitamin D supplementation to prevent fractures and falls in older adults...'),

('Iron deficiency anemia: evaluation and management',
 ARRAY['Lopez A', 'Cacoub P', 'Macdougall IC', 'Peyrin-Biroulet L'],
 'Am Fam Physician', 2016, '26926814', '', 'review', 'moderate',
 'Iron deficiency anemia affects 1.2 billion people globally and requires comprehensive evaluation and targeted treatment',
 'Iron deficiency anemia affects more than 1.2 billion people worldwide, with premenopausal women and children in developing countries being at highest risk...'),

('Magnesium in disease prevention and overall health',
 ARRAY['Rosanoff A', 'Weaver CM', 'Rude RK'],
 'Adv Nutr', 2012, '22516726', '10.3945/an.111.001917', 'review', 'moderate',
 'Magnesium plays essential roles in over 300 enzymatic reactions and is crucial for cardiovascular health',
 'Magnesium, the fourth most abundant mineral in the human body, is essential for more than 300 enzymatic reactions...');

-- Sample Partner Suppliers
INSERT INTO partner_suppliers (name, email, business_type, commission_rate, notification_email, is_active, verified) VALUES
('HealthMart Pharmacy', 'orders@healthmart.com', 'pharmacy', 25.00, 'orders@healthmart.com', true, true),
('WellnessFirst Online', 'fulfillment@wellnessfirst.com', 'online_retailer', 20.00, 'fulfillment@wellnessfirst.com', true, true),
('Natural Health Store', 'orders@naturalhealthstore.com', 'health_store', 30.00, 'orders@naturalhealthstore.com', true, false);

-- Sample Partner Products
INSERT INTO partner_products (partner_id, supplement_id, partner_product_id, product_name, brand, size, strength, unit_price, in_stock) VALUES
-- HealthMart products
((SELECT id FROM partner_suppliers WHERE name = 'HealthMart Pharmacy'),
 (SELECT id FROM supplements WHERE name = 'Vitamin D3 (Cholecalciferol)'),
 'HM-VD3-1000', 'Vitamin D3 1000 IU', 'Nature Made', '100 capsules', '1000 IU', 12.99, true),

((SELECT id FROM partner_suppliers WHERE name = 'HealthMart Pharmacy'),
 (SELECT id FROM supplements WHERE name = 'Methylcobalamin B12'),
 'HM-B12-1000', 'Methylcobalamin B12', 'Jarrow Formulas', '60 lozenges', '1000 mcg', 18.99, true),

-- WellnessFirst products
((SELECT id FROM partner_suppliers WHERE name = 'WellnessFirst Online'),
 (SELECT id FROM supplements WHERE name = 'Vitamin D3 (Cholecalciferol)'),
 'WF-VD3-5000', 'High Potency Vitamin D3', 'Thorne', '60 capsules', '5000 IU', 24.99, true),

((SELECT id FROM partner_suppliers WHERE name = 'WellnessFirst Online'),
 (SELECT id FROM supplements WHERE name = 'Magnesium Glycinate'),
 'WF-MAG-200', 'Magnesium Glycinate', 'Pure Encapsulations', '90 capsules', '200 mg', 28.99, true);
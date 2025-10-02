# AI Functional Medicine Analysis Service

## Overview

The `AIAnalysisService` provides comprehensive functional medicine analysis of biomarker data, generating personalized supplementation and diet plans based on optimal ranges and functional medicine principles.

## Features

- 🧬 **Comprehensive Biomarker Analysis**: Deep analysis of all biomarkers with functional medicine interpretation
- 💊 **Personalized Supplement Protocols**: Specific dosages, timing, and duration recommendations
- 🥗 **Targeted Diet Recommendations**: Evidence-based dietary interventions for biomarker optimization
- 🏃 **Lifestyle Modifications**: Exercise, sleep, and stress management recommendations
- 🔍 **Root Cause Analysis**: Identifies underlying causes of biomarker imbalances
- 📊 **Streaming Updates**: Real-time progress updates during analysis
- 👤 **Personalization**: Age, gender, and health condition-specific recommendations

## Quick Start

```typescript
import { AIAnalysisService } from '@/lib/ai-analysis-service';

const aiAnalysisService = AIAnalysisService.getInstance();

const analysisResult = await aiAnalysisService.generateAnalysis(
  biomarkerReadings,
  optimalRanges,
  userProfile,
  (status, details) => {
    console.log('Progress:', status, details);
  }
);
```

## Data Structures

### Input: BiomarkerReading

```typescript
interface BiomarkerReading {
  id: string;
  biomarker_id: string | null;
  value: number;
  unit: string;
  confidence?: number;
  matched_from_db?: boolean;
  optimal_min?: number | null;
  optimal_max?: number | null;
  status?: 'deficient' | 'suboptimal' | 'optimal' | 'excess' | 'concerning' | 'unknown' | null;
  severity?: 'mild' | 'moderate' | 'severe' | null;
  category?: string;
  biomarker_name?: string;
}
```

### Input: UserProfile

```typescript
interface UserProfile {
  current_age?: number;
  gender?: 'male' | 'female' | 'other';
  menstrual_cycle_length?: number;
  current_menstrual_phase?: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
  pregnancy_status?: 'not_pregnant' | 'pregnant' | 'postpartum';
  menopause_status?: 'premenopausal' | 'perimenopausal' | 'postmenopausal';
  bmi?: number;
  health_conditions?: string[];
  medications?: string[];
  lifestyle_factors?: any;
  supplement_preferences?: any;
}
```

## Analysis Output

The service returns a comprehensive analysis including:

### 1. Overall Health Assessment

```typescript
{
  overall_health_assessment: {
    health_score: 75, // 0-100
    health_category: "good", // poor, fair, good, excellent
    key_strengths: ["Optimal Vitamin D levels", "Good HDL cholesterol"],
    priority_concerns: ["Low B12", "High inflammation markers"],
    trajectory: "Improving with targeted interventions"
  }
}
```

### 2. Biomarker Insights

```typescript
{
  biomarker_insights: [
    {
      biomarker_name: "Vitamin B12",
      current_value: 250,
      unit: "pg/mL",
      status: "deficient",
      optimal_range: "500-1500 pg/mL",
      gap_analysis: "Current level is 50% below optimal range, indicating moderate deficiency",
      clinical_significance: "B12 is essential for nerve function and energy production",
      functional_medicine_perspective: "Low B12 may contribute to fatigue and cognitive issues",
      interconnections: ["Folate metabolism", "Homocysteine levels"],
      priority_for_intervention: "high"
    }
  ]
}
```

### 3. Supplement Recommendations

```typescript
{
  supplement_recommendations: [
    {
      name: "Methylcobalamin B12",
      form: "sublingual",
      dosage: "1000 mcg",
      frequency: "daily",
      timing: "morning",
      duration: "3 months, then retest",
      priority: "essential",
      reasoning: "Active form of B12 for better absorption and nerve support",
      target_biomarkers: ["Vitamin B12", "Homocysteine"],
      expected_improvement: "50-100% increase in B12 levels within 8-12 weeks",
      contraindications: ["Cobalt allergy"],
      drug_interactions: ["Metformin may reduce absorption"],
      monitoring: "Retest B12 and homocysteine in 3 months",
      cost_estimate: "$15-25/month"
    }
  ]
}
```

### 4. Diet Recommendations

```typescript
{
  diet_recommendations: [
    {
      category: "B12-rich foods",
      specific_foods: ["Wild salmon", "Grass-fed beef", "Nutritional yeast", "Organic eggs"],
      reasoning: "Food sources provide cofactors for optimal B12 utilization",
      target_biomarkers: ["Vitamin B12"],
      implementation: "Include 1-2 servings of B12-rich foods daily",
      expected_timeline: "Benefits within 4-6 weeks",
      portion_guidance: "3-4 oz fish/meat, 2 tbsp nutritional yeast, 2 eggs"
    }
  ]
}
```

### 5. Lifestyle Recommendations

```typescript
{
  lifestyle_recommendations: [
    {
      category: "stress_management",
      specific_recommendation: "Daily meditation and breathing exercises",
      reasoning: "Chronic stress depletes B vitamins and increases inflammation",
      target_biomarkers: ["B12", "Cortisol", "CRP"],
      implementation_steps: [
        "Start with 5 minutes daily meditation",
        "Use guided meditation apps",
        "Practice deep breathing before meals"
      ],
      frequency: "Daily",
      expected_benefits: "Improved nutrient absorption and reduced inflammation within 2-4 weeks"
    }
  ]
}
```

## API Endpoints

### Non-Streaming Analysis

```
POST /api/analysis/generate
```

### Streaming Analysis

```
POST /api/analysis/generate-streaming
```

**Request Body:**
```json
{
  "documentId": "uuid-of-document"
}
```

## Example Usage in Frontend

### Basic Analysis

```typescript
const generateAnalysis = async (documentId: string) => {
  const response = await fetch('/api/analysis/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ documentId })
  });

  const result = await response.json();
  return result;
};
```

### Streaming Analysis with Real-time Updates

```typescript
const generateStreamingAnalysis = async (documentId: string, onUpdate: (update: any) => void) => {
  const response = await fetch('/api/analysis/generate-streaming', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ documentId })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const update = JSON.parse(line);
        onUpdate(update);
      } catch (e) {
        console.error('Failed to parse update:', line);
      }
    }
  }
};

// Usage
generateStreamingAnalysis(documentId, (update) => {
  console.log('Analysis update:', update.status);
  setAnalysisProgress(update);
});
```

## Key Features

### Functional Medicine Approach

- Uses optimal ranges, not just conventional lab ranges
- Considers biomarker relationships and patterns
- Identifies root causes vs. treating symptoms
- Personalized based on individual factors

### Evidence-Based Recommendations

- Specific dosages with scientific rationale
- Timeline expectations for improvements
- Contraindications and drug interactions
- Monitoring recommendations

### Comprehensive Analysis

- **Pattern Recognition**: Identifies relationships between biomarkers
- **Root Cause Analysis**: Determines underlying causes of imbalances
- **Prioritization**: Ranks interventions by impact and urgency
- **Personalization**: Considers age, gender, health status, and preferences

### Safety Features

- Contraindication checking
- Drug interaction warnings
- Dosage safety limits
- Clinical correlation recommendations

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const analysis = await aiAnalysisService.generateAnalysis(
    biomarkers, 
    ranges, 
    profile
  );
} catch (error) {
  if (error.message.includes('OpenAI client not initialized')) {
    // Handle missing API key
  } else if (error.message.includes('No biomarker readings')) {
    // Handle missing data
  } else {
    // Handle other errors
  }
}
```

## Best Practices

1. **Validate Input Data**: Ensure biomarker readings have valid values and units
2. **Provide User Profile**: More complete profiles lead to better personalization
3. **Use Streaming**: For better user experience during long analyses
4. **Handle Errors Gracefully**: Provide fallbacks when AI analysis fails
5. **Store Results**: Cache analysis results to avoid repeated API calls
6. **Update Progress**: Keep users informed during long-running analyses

## Configuration

Set environment variables:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o  # Optional, defaults to gpt-4o
```

## Performance Considerations

- **Analysis Time**: 30-60 seconds for comprehensive analysis
- **API Costs**: ~$0.10-0.50 per analysis depending on biomarker count
- **Rate Limits**: Respects OpenAI rate limits
- **Caching**: Results are cached in database
- **Fallbacks**: Basic analysis available if AI fails

## Integration with Existing Flow

1. **Document Upload** → Extract biomarkers → Save to `biomarker_readings`
2. **Analysis Generation** → AI analysis → Save to `health_analyses`
3. **Results Display** → Show personalized recommendations
4. **Follow-up** → Track progress and retest recommendations 
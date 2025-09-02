# Task 03A-03: Learning Path Generator
**Phase 3A - Calendar/Todo Foundation** | **Priority**: 🟠 High | **Time**: 10-12 hours

---

## Overview

Build an AI-powered learning path generation system that creates personalized, structured learning sequences from user goals. This system will analyze the curriculum, assess user progress, and generate optimal learning paths that can be converted into scheduled todos and calendar entries.

## Business Requirements

### User Stories
- **As a student**, I want to say "I want to build a horror game" and get a complete learning path so I know exactly what to study
- **As a student**, I want learning paths adapted to my skill level so I don't get overwhelmed or bored
- **As a student**, I want realistic time estimates so I can plan my schedule effectively
- **As a student**, I want the system to adjust my path based on my progress so it stays relevant
- **As a student**, I want to see prerequisites clearly so I understand why I need to learn certain topics first

### Key Features
1. **Goal-Based Path Generation**: Convert learning goals into structured sequences
2. **Skill Level Assessment**: Adapt content difficulty to user capability
3. **Prerequisite Mapping**: Ensure logical learning progression
4. **Time Estimation**: Provide realistic completion estimates
5. **Progress Adaptation**: Dynamically adjust paths based on user progress
6. **Multiple Path Types**: Support different learning styles and goals

---

## Technical Requirements

### Database Schema

```sql
-- Learning paths table
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_statement TEXT NOT NULL, -- Original user goal
  path_type VARCHAR(30) NOT NULL CHECK (path_type IN ('skill_focused', 'project_based', 'certification', 'custom')),
  difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'mixed')),
  estimated_hours DECIMAL(5,2) NOT NULL,
  estimated_weeks DECIMAL(4,1),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Path structure and metadata
  path_data JSONB NOT NULL, -- Complete path structure with steps, videos, prerequisites
  curriculum_mapping JSONB NOT NULL, -- Maps to curriculum.json structure
  skill_assessments JSONB DEFAULT '{}'::jsonb, -- User skill levels used in generation
  generation_metadata JSONB DEFAULT '{}'::jsonb, -- AI generation context and decisions
  
  -- Progress tracking
  current_step_index INT DEFAULT 0,
  steps_completed INT DEFAULT 0,
  total_steps INT NOT NULL,
  last_activity_date TIMESTAMPTZ,
  
  -- Personalization
  learning_style VARCHAR(30), -- 'visual', 'hands_on', 'theory_first', 'project_driven'
  pace_preference VARCHAR(20) DEFAULT 'normal' CHECK (pace_preference IN ('slow', 'normal', 'fast')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning path steps (individual learning units)
CREATE TABLE learning_path_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  step_type VARCHAR(30) NOT NULL CHECK (step_type IN ('video', 'practice', 'project', 'quiz', 'reading', 'milestone')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Content references
  video_id TEXT, -- References curriculum video
  module_id TEXT,
  week_id TEXT,
  day_id TEXT,
  
  -- Step requirements
  estimated_minutes INT NOT NULL,
  difficulty_level VARCHAR(20) NOT NULL,
  prerequisites TEXT[] DEFAULT '{}', -- Array of prerequisite step IDs
  skills_taught TEXT[] DEFAULT '{}', -- Skills this step teaches
  skills_required TEXT[] DEFAULT '{}', -- Skills required to complete this step
  
  -- Progress tracking
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  time_spent_minutes INT DEFAULT 0,
  user_rating DECIMAL(2,1), -- 0.0 to 5.0
  user_feedback TEXT,
  
  -- Step data and context
  step_data JSONB DEFAULT '{}'::jsonb, -- Step-specific configuration
  learning_objectives TEXT[] DEFAULT '{}',
  success_criteria TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(path_id, step_index)
);

-- Learning path templates for common goals
CREATE TABLE learning_path_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  goal_pattern TEXT NOT NULL, -- Regex or keywords that match user goals
  path_type VARCHAR(30) NOT NULL,
  target_skill_level VARCHAR(20) NOT NULL,
  
  template_data JSONB NOT NULL, -- Template structure
  estimated_hours DECIMAL(5,2),
  popularity_score DECIMAL(5,2) DEFAULT 0.00,
  success_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage of users who complete paths from this template
  
  is_active BOOLEAN DEFAULT true,
  created_by TEXT, -- User who created (or 'system')
  usage_count INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User skill assessments for path personalization
CREATE TABLE user_skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  skill_category VARCHAR(50) NOT NULL, -- 'scripting', 'building', 'ui_design', 'game_design'
  skill_name TEXT NOT NULL,
  proficiency_level VARCHAR(20) NOT NULL CHECK (proficiency_level IN ('none', 'basic', 'intermediate', 'advanced', 'expert')),
  confidence_score DECIMAL(3,2), -- 0.0 to 1.0 - how confident we are in this assessment
  
  assessment_method VARCHAR(30) NOT NULL CHECK (assessment_method IN ('self_reported', 'quiz_based', 'ai_inferred', 'progress_based')),
  assessment_data JSONB DEFAULT '{}'::jsonb,
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_category, skill_name)
);

-- Indexes for performance
CREATE INDEX learning_paths_user_idx ON learning_paths(user_id);
CREATE INDEX learning_paths_status_idx ON learning_paths(status);
CREATE INDEX learning_paths_user_status_idx ON learning_paths(user_id, status);
CREATE INDEX learning_paths_goal_idx ON learning_paths USING GIN (to_tsvector('english', goal_statement));

CREATE INDEX learning_path_steps_path_idx ON learning_path_steps(path_id);
CREATE INDEX learning_path_steps_path_order_idx ON learning_path_steps(path_id, step_index);
CREATE INDEX learning_path_steps_status_idx ON learning_path_steps(status);
CREATE INDEX learning_path_steps_video_idx ON learning_path_steps(video_id) WHERE video_id IS NOT NULL;

CREATE INDEX learning_path_templates_goal_pattern_idx ON learning_path_templates USING GIN (to_tsvector('english', goal_pattern));
CREATE INDEX learning_path_templates_active_idx ON learning_path_templates(is_active, popularity_score DESC);

CREATE INDEX user_skill_assessments_user_idx ON user_skill_assessments(user_id);
CREATE INDEX user_skill_assessments_skill_idx ON user_skill_assessments(skill_category, skill_name);

-- RLS Policies
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own paths" ON learning_paths
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage steps of their own paths" ON learning_path_steps
  FOR ALL USING (
    path_id IN (SELECT id FROM learning_paths WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can view active templates" ON learning_path_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own skill assessments" ON user_skill_assessments
  FOR ALL USING (user_id = auth.uid()::text);
```

### Service Architecture

**File**: `src/services/learning-path-generator.ts`

```typescript
export interface LearningPath {
  id: string
  userId: string
  title: string
  description?: string
  goalStatement: string
  pathType: 'skill_focused' | 'project_based' | 'certification' | 'custom'
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed'
  estimatedHours: number
  estimatedWeeks?: number
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  progressPercentage: number
  
  pathData: PathStructure
  curriculumMapping: CurriculumMapping
  skillAssessments: Record<string, SkillLevel>
  generationMetadata: GenerationMetadata
  
  currentStepIndex: number
  stepsCompleted: number
  totalSteps: number
  lastActivityDate?: Date
  
  learningStyle?: 'visual' | 'hands_on' | 'theory_first' | 'project_driven'
  pacePreference: 'slow' | 'normal' | 'fast'
  
  createdAt: Date
  updatedAt: Date
}

export interface LearningPathStep {
  id: string
  pathId: string
  stepIndex: number
  stepType: 'video' | 'practice' | 'project' | 'quiz' | 'reading' | 'milestone'
  title: string
  description?: string
  
  videoId?: string
  moduleId?: string
  weekId?: string
  dayId?: string
  
  estimatedMinutes: number
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  prerequisites: string[]
  skillsTaught: string[]
  skillsRequired: string[]
  
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  completedAt?: Date
  timeSpentMinutes: number
  userRating?: number
  userFeedback?: string
  
  stepData: Record<string, any>
  learningObjectives: string[]
  successCriteria: string[]
}

export interface PathGenerationRequest {
  goalStatement: string
  targetSkillLevel?: 'beginner' | 'intermediate' | 'advanced'
  timeConstraints?: {
    hoursPerWeek?: number
    totalWeeks?: number
    preferredSchedule?: 'weekdays' | 'weekends' | 'flexible'
  }
  learningStyle?: 'visual' | 'hands_on' | 'theory_first' | 'project_driven'
  currentSkills?: Record<string, SkillLevel>
  preferences?: {
    includeProjects?: boolean
    focusOnPractice?: boolean
    skipBasics?: boolean
    preferredContentTypes?: ('video' | 'reading' | 'practice' | 'project')[]
  }
}

export interface PathGenerationResult {
  path: LearningPath
  steps: LearningPathStep[]
  recommendations: PathRecommendation[]
  alternatives: AlternativePath[]
  estimatedOutcomes: LearningOutcome[]
}

export interface SkillAssessment {
  skillCategory: string
  skillName: string
  proficiencyLevel: 'none' | 'basic' | 'intermediate' | 'advanced' | 'expert'
  confidenceScore: number
  assessmentMethod: 'self_reported' | 'quiz_based' | 'ai_inferred' | 'progress_based'
  assessmentData: Record<string, any>
}

export class LearningPathGenerator {
  // Core path generation
  async generatePath(
    userId: string,
    request: PathGenerationRequest
  ): Promise<PathGenerationResult>
  
  async regeneratePath(
    pathId: string,
    adjustments: PathAdjustments
  ): Promise<PathGenerationResult>
  
  async clonePath(
    sourcePathId: string,
    userId: string,
    customizations?: PathCustomizations
  ): Promise<LearningPath>
  
  // Path management
  async createPath(
    userId: string,
    path: Partial<LearningPath>
  ): Promise<LearningPath>
  
  async updatePath(
    pathId: string,
    updates: Partial<LearningPath>
  ): Promise<LearningPath>
  
  async deletePath(pathId: string): Promise<boolean>
  
  async getPath(pathId: string): Promise<LearningPath | null>
  
  async getUserPaths(
    userId: string,
    filters?: PathFilters
  ): Promise<LearningPath[]>
  
  // Step management
  async getPathSteps(pathId: string): Promise<LearningPathStep[]>
  
  async updateStep(
    stepId: string,
    updates: Partial<LearningPathStep>
  ): Promise<LearningPathStep>
  
  async completeStep(
    stepId: string,
    timeSpent?: number,
    feedback?: StepFeedback
  ): Promise<LearningPathStep>
  
  async skipStep(
    stepId: string,
    reason?: string
  ): Promise<LearningPathStep>
  
  // Progress tracking and adaptation
  async updateProgress(
    pathId: string,
    progressUpdate: ProgressUpdate
  ): Promise<LearningPath>
  
  async adaptPathToProgress(
    pathId: string,
    progressAnalysis: ProgressAnalysis
  ): Promise<PathAdaptation>
  
  async identifyStrugglingAreas(
    userId: string,
    pathId: string
  ): Promise<StruggleAnalysis>
  
  async suggestPathAdjustments(
    pathId: string
  ): Promise<PathAdjustmentSuggestion[]>
  
  // Curriculum integration
  async mapGoalToCurriculum(
    goalStatement: string,
    skillLevel: string
  ): Promise<CurriculumMapping>
  
  async extractRelevantContent(
    curriculumMapping: CurriculumMapping,
    filters: ContentFilters
  ): Promise<ContentExtraction>
  
  async buildPrerequisiteChain(
    targetContent: string[],
    userSkills: Record<string, SkillLevel>
  ): Promise<PrerequisiteChain>
  
  // Skill assessment and personalization
  async assessUserSkills(
    userId: string,
    method: 'quiz' | 'progress_analysis' | 'self_report'
  ): Promise<SkillAssessment[]>
  
  async updateSkillAssessment(
    userId: string,
    assessment: Partial<SkillAssessment>
  ): Promise<SkillAssessment>
  
  async inferSkillsFromProgress(
    userId: string
  ): Promise<SkillInference[]>
  
  // Templates and recommendations
  async getPathTemplates(
    goal?: string,
    skillLevel?: string
  ): Promise<LearningPathTemplate[]>
  
  async generateFromTemplate(
    userId: string,
    templateId: string,
    customizations: TemplateCustomizations
  ): Promise<PathGenerationResult>
  
  async suggestNextLearningGoals(
    userId: string,
    currentPath?: string
  ): Promise<GoalSuggestion[]>
  
  // AI-powered features
  async analyzeGoalStatement(
    goalStatement: string
  ): Promise<GoalAnalysis>
  
  async optimizePathSequence(
    steps: LearningPathStep[],
    optimizationGoals: OptimizationGoals
  ): Promise<SequenceOptimization>
  
  async generatePathDescription(
    path: LearningPath
  ): Promise<string>
  
  // Integration helpers
  async convertToTodos(
    pathId: string,
    todoPreferences?: TodoGenerationPreferences
  ): Promise<Todo[]>
  
  async convertToSchedule(
    pathId: string,
    schedulingConstraints: SchedulingConstraints
  ): Promise<ScheduleEntry[]>
  
  async syncWithAIJourney(
    userId: string,
    pathId: string
  ): Promise<void>
}
```

### AI Generation Engine

**File**: `src/services/path-generation-ai.ts`

```typescript
class PathGenerationAI {
  // Core AI generation logic
  async analyzeUserGoal(goalStatement: string): Promise<GoalAnalysis> {
    // Use OpenAI to analyze the user's goal and extract:
    // - Learning objectives
    // - Required skills
    // - Project outcomes
    // - Difficulty level
    // - Time estimates
    // - Content preferences
  }
  
  async generatePathStructure(
    goalAnalysis: GoalAnalysis,
    userSkills: SkillAssessment[],
    curriculum: CurriculumData
  ): Promise<PathStructure> {
    // Create optimal learning sequence considering:
    // - Prerequisite dependencies
    // - Skill progression
    // - Learning theory (spaced repetition, progressive difficulty)
    // - User preferences and constraints
    // - Available curriculum content
  }
  
  async optimizePathForUser(
    basePath: PathStructure,
    userProfile: UserProfile
  ): Promise<PathStructure> {
    // Personalize the path based on:
    // - Learning style preferences
    // - Available time
    // - Current skill level
    // - Historical performance patterns
    // - Motivation factors
  }
}
```

---

## API Endpoints

**Base Route**: `/api/learning-paths`

```typescript
// POST /api/learning-paths/generate - Generate new learning path
interface GeneratePathBody {
  goalStatement: string
  targetSkillLevel?: 'beginner' | 'intermediate' | 'advanced'
  timeConstraints?: {
    hoursPerWeek?: number
    totalWeeks?: number
    preferredSchedule?: string
  }
  learningStyle?: string
  preferences?: {
    includeProjects?: boolean
    focusOnPractice?: boolean
    skipBasics?: boolean
    preferredContentTypes?: string[]
  }
}

// GET /api/learning-paths - Get user's learning paths
interface GetPathsQuery {
  status?: string[]
  pathType?: string[]
  difficultyLevel?: string[]
  search?: string
  sortBy?: 'created' | 'progress' | 'activity'
  sortOrder?: 'asc' | 'desc'
}

// GET /api/learning-paths/[id] - Get specific learning path
// PUT /api/learning-paths/[id] - Update learning path
interface UpdatePathBody {
  title?: string
  description?: string
  status?: string
  learningStyle?: string
  pacePreference?: string
}

// GET /api/learning-paths/[id]/steps - Get path steps
// PUT /api/learning-paths/steps/[stepId] - Update step
interface UpdateStepBody {
  status?: string
  userRating?: number
  userFeedback?: string
  timeSpentMinutes?: number
}

// POST /api/learning-paths/[id]/steps/[stepId]/complete - Complete step
interface CompleteStepBody {
  timeSpentMinutes?: number
  rating?: number
  feedback?: string
  notes?: string
}

// POST /api/learning-paths/[id]/adapt - Adapt path based on progress
interface AdaptPathBody {
  strugglingAreas?: string[]
  completedFaster?: string[]
  newGoals?: string[]
  timeConstraintChanges?: any
}

// GET /api/learning-paths/templates - Get available templates
interface GetTemplatesQuery {
  goal?: string
  pathType?: string
  skillLevel?: string
  popular?: boolean
}

// POST /api/learning-paths/templates/[id]/apply - Apply template
interface ApplyTemplateBody {
  customizations?: {
    skipSections?: string[]
    focusAreas?: string[]
    timeAdjustments?: any
  }
}

// POST /api/learning-paths/[id]/convert/todos - Convert to todos
interface ConvertToTodosBody {
  preferences?: {
    priority?: string
    category?: string
    dueDatesFromEstimates?: boolean
  }
}

// POST /api/learning-paths/[id]/convert/schedule - Convert to schedule
interface ConvertToScheduleBody {
  constraints: {
    startDate: string
    hoursPerWeek: number
    preferredTimes?: any[]
    bufferTime?: number
  }
}

// GET /api/skill-assessments - Get user's skill assessments
// PUT /api/skill-assessments - Update skill assessments
interface UpdateSkillAssessmentsBody {
  assessments: {
    skillCategory: string
    skillName: string
    proficiencyLevel: string
    confidenceScore?: number
    assessmentMethod: string
  }[]
}
```

---

## Implementation Plan

### Phase 1: Database and Core Models (3 hours)
1. **Create database schema**:
   - Learning paths and steps tables
   - Path templates table
   - User skill assessments table
   - Indexes and RLS policies

2. **Implement core data models**:
   - TypeScript interfaces and types
   - Database query functions
   - Basic CRUD operations

### Phase 2: AI Generation Engine (4 hours)
1. **Build goal analysis system**:
   - OpenAI integration for goal parsing
   - Skill requirement extraction
   - Difficulty assessment
   - Time estimation algorithms

2. **Implement path generation logic**:
   - Curriculum mapping algorithms
   - Prerequisite chain building
   - Step sequencing optimization
   - Personalization engine

### Phase 3: Path Management Service (3 hours)
1. **Complete LearningPathGenerator service**:
   - Path CRUD operations
   - Step management
   - Progress tracking
   - Adaptation algorithms

2. **Add skill assessment features**:
   - Skill inference from user activity
   - Assessment update mechanisms
   - Confidence scoring

### Phase 4: API and Integration (2 hours)
1. **Create API endpoints**:
   - All path management endpoints
   - Generation and adaptation endpoints
   - Template management
   - Integration endpoints

2. **Integration with other systems**:
   - Todo conversion functionality
   - Calendar scheduling conversion
   - AI Journey synchronization

---

## Testing Strategy

### Unit Tests
```typescript
describe('LearningPathGenerator', () => {
  describe('generatePath', () => {
    it('generates appropriate beginner path for scripting goal', async () => {
      const request: PathGenerationRequest = {
        goalStatement: 'I want to learn Roblox scripting basics',
        targetSkillLevel: 'beginner'
      }
      
      const result = await pathGenerator.generatePath('user123', request)
      
      expect(result.path.difficultyLevel).toBe('beginner')
      expect(result.steps.length).toBeGreaterThan(5)
      expect(result.steps[0].prerequisites).toEqual([])
      expect(result.path.estimatedHours).toBeLessThan(20)
    })
    
    it('adapts path based on existing user skills', async () => {
      const request: PathGenerationRequest = {
        goalStatement: 'I want to build a complex RPG game',
        currentSkills: {
          'scripting': 'advanced',
          'building': 'intermediate',
          'ui_design': 'basic'
        }
      }
      
      const result = await pathGenerator.generatePath('user123', request)
      
      // Should focus on areas where user needs improvement
      const uiSteps = result.steps.filter(s => s.skillsTaught.includes('ui_design'))
      const scriptingSteps = result.steps.filter(s => s.skillsTaught.includes('scripting'))
      
      expect(uiSteps.length).toBeGreaterThan(scriptingSteps.length)
    })
  })
  
  describe('adaptPathToProgress', () => {
    it('identifies struggling areas and adjusts difficulty', async () => {
      const progressAnalysis: ProgressAnalysis = {
        strugglingAreas: ['scripting_advanced'],
        fastCompletionAreas: ['building_basics'],
        timeSpentOverEstimate: { 'scripting_advanced': 2.5 }
      }
      
      const adaptation = await pathGenerator.adaptPathToProgress('path123', progressAnalysis)
      
      expect(adaptation.adjustments).toContain('add_prerequisite_content')
      expect(adaptation.newSteps.some(s => s.skillsTaught.includes('scripting_basics'))).toBe(true)
    })
  })
})
```

### Integration Tests
```typescript
describe('Learning Path API', () => {
  describe('POST /api/learning-paths/generate', () => {
    it('generates complete learning path from goal', async () => {
      const goalData = {
        goalStatement: 'Create a multiplayer racing game',
        targetSkillLevel: 'intermediate',
        timeConstraints: { hoursPerWeek: 10, totalWeeks: 8 }
      }
      
      const response = await request(app)
        .post('/api/learning-paths/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(goalData)
        .expect(201)
      
      expect(response.body.path.id).toBeDefined()
      expect(response.body.steps.length).toBeGreaterThan(10)
      expect(response.body.path.estimatedHours).toBeLessThanOrEqual(80)
    })
  })
})
```

---

## Success Criteria

### Functional Requirements
- [ ] Generate learning paths from natural language goals
- [ ] Adapt content difficulty to user skill level  
- [ ] Create logical prerequisite sequences
- [ ] Provide accurate time estimates (±20% accuracy)
- [ ] Successfully adapt paths based on user progress
- [ ] Convert paths to todos and calendar entries

### AI Quality Requirements
- [ ] Goal analysis accuracy > 85%
- [ ] Generated paths have logical skill progression
- [ ] Time estimates within 20% of actual completion time
- [ ] User satisfaction with generated paths > 80%
- [ ] Path adaptation improves completion rates by 25%

### Performance Requirements
- [ ] Path generation < 10s for typical goals
- [ ] Progress adaptation < 3s
- [ ] Database queries optimized with proper indexes
- [ ] Support 100+ step paths efficiently
- [ ] Handle 1000+ concurrent path generations

---

## Dependencies

### Required Before Starting
- [ ] Task 03A-01 (Todo Management) completed for integration
- [ ] Task 03A-02 (Calendar Service) completed for scheduling
- [ ] OpenAI API access configured
- [ ] Curriculum data structure analyzed and mapped

### Integration Dependencies
- [ ] Todo system interfaces for conversion
- [ ] Calendar system for schedule generation  
- [ ] AI Journey system for progress sync
- [ ] Video system for content references

---

**This is the core intelligence of the learning organization system** - it transforms user goals into actionable, personalized learning experiences.

---

*Task created by: Senior Developer*  
*Estimated completion: 10-12 hours*  
*Next task: 03A-04 Natural Language Scheduling*
/**
 * Integration Services Export
 * 
 * Central export point for all AI-Powered Learning System integration services
 */

export { TodoVideoLinker } from './TodoVideoLinker'
export { SmartTodoGenerator } from './SmartTodoGenerator'
export { LearningPathSync } from './LearningPathSync'

// Service factory for easy instantiation
import { IntegrationConfig } from '../../types/shared'

export class IntegrationServices {
  public todoVideoLinker: TodoVideoLinker
  public smartTodoGenerator: SmartTodoGenerator
  public learningPathSync: LearningPathSync

  constructor(config: IntegrationConfig) {
    this.todoVideoLinker = new TodoVideoLinker()
    this.smartTodoGenerator = new SmartTodoGenerator(config)
    this.learningPathSync = new LearningPathSync()
  }

  /**
   * Initialize all services with default configuration
   */
  static create(openaiApiKey: string): IntegrationServices {
    const defaultConfig: IntegrationConfig = {
      openaiApiKey,
      openaiModel: 'gpt-4o-mini',
      embeddingModel: 'text-embedding-3-small',
      enableTodoGeneration: true,
      enableSmartScheduling: true,
      enableLearningPaths: true,
      enableProgressSync: true,
      maxVideoReferences: 5,
      maxTodoSuggestions: 3,
      cacheTimeoutMinutes: 60,
      defaultTodoPriority: 'medium',
      defaultSchedulingDuration: 60,
      autoLinkVideosToTodos: true
    }

    return new IntegrationServices(defaultConfig)
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    todoVideoLinker: boolean;
    smartTodoGenerator: boolean;
    learningPathSync: boolean;
    timestamp: string;
  }> {
    return {
      todoVideoLinker: true, // Could add actual health checks
      smartTodoGenerator: true,
      learningPathSync: true,
      timestamp: new Date().toISOString()
    }
  }
}
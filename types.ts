export interface Page {
  page_number: number;
  image_prompt: string;
  text: string;
  image_url?: string;
}

export interface Book {
  title: string;
  concept: string;
  age_band: string;
  pages: Page[];
}

export interface KnowledgeCheck {
  question: string;
  choices: { id: string; text: string }[];
  correct_answer: string;
  explanation: string;
}

export interface StoryData {
  book: Book;
  piggy_intro: { text: string };
  piggy_recap: {
    summary: string[];
    lesson: string;
  };
  knowledge_check: KnowledgeCheck[];
  piggy_interaction_rules: {
    style: string;
    allowed_topics: string;
    redirect_rule: string;
  };
}

export interface Badge {
  id: string;
  name: string;
  concept: string;
  image: string;
  mintAddress?: string;
  dateEarned: string;
  storyTitle: string;
}

export interface User {
  username: string;
  badges: Badge[];
}

export enum AppState {
  AUTH = 'auth',
  SETUP = 'setup',
  GENERATING = 'generating',
  READING = 'reading',
  SUCCESS_ANIMATION = 'success_animation',
  QUIZ = 'quiz',
  PIGGY_MODE = 'piggy_mode',
  COLLECTION = 'collection',
  PARENT_CORNER = 'parent_corner'
}
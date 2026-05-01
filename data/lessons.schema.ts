export interface Lesson {
  id: string;
  text: string;
  createdAt: string;
  mood: { emoji: string; word: string };
  thoughts?: string | null;
}

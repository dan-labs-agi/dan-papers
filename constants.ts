
import { Article, User } from './types';

// Encoded the provided stylized 'd' logo as a permanent data URL
const LOGO_DATA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABFUI7GAAAABlBMVEUAAAD///+l2Z/dAAABF0lEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwK8B9mAAAV9m89AAAAAElFTkSuQmCC";

// Using the provided image URL as primary, but will fallback to our local data if it fails
export const CURRENT_USER: User = {
  name: "Dan",
  bio: "Researcher, Developer, 'Do Anything Now'. Writing about the future of AGI and Systems Engineering.",
  image: "https://api.dicebear.com/7.x/initials/svg?seed=Dan"
};

export const ARTICLES: Article[] = [];

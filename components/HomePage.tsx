import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { ARTICLES } from '../constants';
import ArticleCard from './ArticleCard';
import { Loader2 } from 'lucide-react';

const HomePage: React.FC = () => {
  const convexArticles = useQuery(api["functions/articles"].getAll);
  
  if (convexArticles === undefined) {
    return (
      <div className="max-w-screen-md mx-auto px-4 mt-8 mb-20 flex justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  // Convert Convex articles to the Article format
  const dbArticles = convexArticles.map((article) => ({
    id: article._id,
    title: article.title,
    subtitle: article.subtitle,
    author: article.authorName,
    authorImage: article.authorImage,
    date: article.date,
    readTime: article.readTime,
    tags: article.tags,
    image: article.image,
    content: article.content,
    createdAt: article.createdAt,
  }));

  // Combine seed articles with DB articles
  // Seed articles (like Genesis) come first, then DB articles newest first
  const allArticles = [
    ...ARTICLES.map(a => ({ ...a, createdAt: Infinity })),
    ...dbArticles.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
  ];

  if (allArticles.length === 0) {
    return (
      <div className="max-w-screen-md mx-auto px-4 mt-8 mb-20 text-center">
        <p className="text-gray-500 dark:text-zinc-400">No articles yet. Be the first to publish!</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto px-4 mt-8 mb-20">
      <div className="flex flex-col gap-2">
        {allArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;
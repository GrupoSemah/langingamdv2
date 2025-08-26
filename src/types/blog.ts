export interface BlogArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  author: string;
  readTime: string;
  category: string;
  tags: string[];
}

export interface BlogFrontmatter {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  readTime: string;
  category: string;
  tags: string[];
}

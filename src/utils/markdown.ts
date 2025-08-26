import type { BlogArticle, BlogFrontmatter } from '../types/blog';

// Simple markdown to HTML converter
function simpleMarkdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headers - más específico
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');  
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Bold y italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Proceso línea por línea para mejor control
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let currentParagraph: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Línea vacía
    if (!line) {
      if (currentParagraph.length > 0) {
        processedLines.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      continue;
    }
    
    // Headers ya procesados
    if (line.startsWith('<h')) {
      if (currentParagraph.length > 0) {
        processedLines.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
      continue;
    }
    
    // Lista
    if (line.startsWith('- ')) {
      if (currentParagraph.length > 0) {
        processedLines.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      const listContent = line.substring(2).trim();
      processedLines.push(`<li>${listContent}</li>`);
      continue;
    }
    
    // Párrafo normal
    if (inList) {
      processedLines.push('</ul>');
      inList = false;
    }
    currentParagraph.push(line);
  }
  
  // Cerrar elementos pendientes
  if (currentParagraph.length > 0) {
    processedLines.push(`<p>${currentParagraph.join(' ')}</p>`);
  }
  if (inList) {
    processedLines.push('</ul>');
  }
  
  return processedLines.join('\n');
}

// Parse frontmatter manually
function parseFrontmatter(content: string): { frontmatter: BlogFrontmatter; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    throw new Error('Invalid markdown format: missing frontmatter');
  }

  const [, frontmatterStr, markdownContent] = match;
  const frontmatter: Record<string, any> = {};
  
  // Parse YAML-like frontmatter
  const lines = frontmatterStr.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = trimmedLine.substring(0, colonIndex).trim();
    let value = trimmedLine.substring(colonIndex + 1).trim();
    
    // Remove quotes if present
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    
    // Handle arrays (tags)
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      frontmatter[key] = arrayContent.split(',').map(item => item.trim().replace(/['"]/g, ''));
    } else if (key === 'id') {
      frontmatter[key] = parseInt(value);
    } else {
      frontmatter[key] = value;
    }
  }

  return {
    frontmatter: frontmatter as BlogFrontmatter,
    content: markdownContent.trim()
  };
}

// Get blog article by slug
export async function getBlogArticle(slug: string, lang: string = 'es'): Promise<BlogArticle | null> {
  try {
    // Map Spanish slugs to English equivalents
    const slugMappings: Record<string, string> = {
      'ventajas-de-alquilar-un-mini-deposito': 'advantages-of-renting-a-mini-storage',
      'elige-el-tamano-ideal-para-tu-mini-deposito': 'choose-ideal-size-mini-storage', 
      'guarda-tu-ropa-y-zapatos-sin-que-se-danen': 'store-clothes-shoes-without-damage',
      'sabes-que-guardar-en-un-mini-deposito': 'what-to-store-in-mini-storage',
      'medidas-de-seguridad-antes-de-almacenar': 'security-measures-before-storing'
    };
    
    // Load all markdown files
    const markdownFiles = import.meta.glob('/src/data/blogs/**/*.md', { 
      query: '?raw',
      import: 'default',
      eager: true 
    }) as Record<string, string>;
    
    let fileContent: string | undefined;
    
    if (lang === 'en' && slugMappings[slug]) {
      // Try English file first
      const enPath = `/src/data/blogs/en/${slugMappings[slug]}.md`;
      fileContent = markdownFiles[enPath];
    }
    
    // If not found or Spanish, try Spanish file
    if (!fileContent) {
      const esPath = `/src/data/blogs/es/${slug}.md`;
      fileContent = markdownFiles[esPath];
    }
    
    if (!fileContent) {
      console.error(`Blog file not found for slug: ${slug}, lang: ${lang}`);
      return null;
    }
    
    const { frontmatter, content } = parseFrontmatter(fileContent);
    
    const htmlContent = simpleMarkdownToHtml(content);
    
    return {
      ...frontmatter,
      content: htmlContent
    };
    
  } catch (error) {
    console.error(`Error loading blog article ${slug}:`, error);
    return null;
  }
}

// Get all blog articles for a language
export async function getAllBlogArticles(lang: string = 'es'): Promise<BlogArticle[]> {
  const articles: BlogArticle[] = [];
  
  const slugs = [
    'ventajas-de-alquilar-un-mini-deposito',
    'elige-el-tamano-ideal-para-tu-mini-deposito', 
    'guarda-tu-ropa-y-zapatos-sin-que-se-danen',
    'sabes-que-guardar-en-un-mini-deposito',
    'medidas-de-seguridad-antes-de-almacenar'
  ];
  
  for (const slug of slugs) {
    const article = await getBlogArticle(slug, lang);
    if (article) {
      articles.push(article);
    }
  }
  
  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

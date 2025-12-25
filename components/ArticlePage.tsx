
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ARTICLES, CURRENT_USER } from '../constants';
import { Share, MoreHorizontal, Sparkles, Trash2, AlertTriangle, Terminal } from 'lucide-react';
import { summarizeArticle } from '../services/geminiService';
import { GitHubConfig, fetchFileContent, updateFileContent, getGitHubUser } from '../services/githubService';

// Helper to parse inline markdown (Bold, Italic, Links)
export const parseInlineMarkdown = (text: string) => {
  // Bold: **text**
  let processed = text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-black">{part.slice(2, -2)}</strong>;
    }
    return part;
  });

  // Italic: *text* (avoiding conflicts with already processed parts)
  // Fix: Replaced JSX.Element with React.ReactNode to resolve namespace issues.
  const finalParts: React.ReactNode[] = [];
  processed.forEach((part) => {
    if (typeof part === 'string') {
      const subParts = part.split(/(\*.*?\*)/g).map((sub, j) => {
        if (sub.startsWith('*') && sub.endsWith('*')) {
          return <em key={j} className="italic">{sub.slice(1, -1)}</em>;
        }
        return sub;
      });
      finalParts.push(...subParts);
    } else {
      finalParts.push(part);
    }
  });

  // Links: [text](url)
  // Fix: Replaced JSX.Element with React.ReactNode to resolve namespace issues.
  const linkedParts: React.ReactNode[] = [];
  finalParts.forEach((part) => {
    if (typeof part === 'string') {
      const linkRegex = /\[(.*?)\]\((.*?)\)/g;
      // Fix: Replaced JSX.Element with React.ReactNode to resolve namespace issues.
      const subParts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      while ((match = linkRegex.exec(part)) !== null) {
        subParts.push(part.substring(lastIndex, match.index));
        subParts.push(
          <a 
            key={match.index} 
            href={match[2]} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-medium-black underline decoration-gray-300 hover:decoration-black transition-all"
          >
            {match[1]}
          </a>
        );
        lastIndex = match.index + match[0].length;
      }
      subParts.push(part.substring(lastIndex));
      linkedParts.push(...subParts);
    } else {
      linkedParts.push(part);
    }
  });

  return linkedParts;
};

export const renderArticleContent = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, index) => {
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-3xl font-bold mt-10 mb-6 font-sans text-medium-black tracking-tight">{parseInlineMarkdown(line.replace('# ', ''))}</h1>;
    }
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-2xl font-bold mt-8 mb-4 font-sans text-medium-black tracking-tight">{parseInlineMarkdown(line.replace('## ', ''))}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={index} className="text-xl font-bold mt-6 mb-3 font-sans text-medium-black tracking-tight">{parseInlineMarkdown(line.replace('### ', ''))}</h3>;
    }
    if (line.startsWith('* ')) {
      return <li key={index} className="ml-6 list-disc mb-3 text-xl leading-8 text-medium-black/90 font-serif">{parseInlineMarkdown(line.replace('* ', ''))}</li>;
    }
    if (line.startsWith('> ')) {
      return <blockquote key={index} className="border-l-4 border-gray-200 pl-6 italic my-8 text-xl text-gray-500 font-serif">{parseInlineMarkdown(line.replace('> ', ''))}</blockquote>;
    }
    if (line.startsWith('```')) {
      return null;
    }
    if (line.trim().length === 0) return <div key={index} className="h-4" />;
    
    return <p key={index} className="mb-6 text-xl leading-8 text-medium-black/90 font-serif tracking-tight">{parseInlineMarkdown(line)}</p>;
  });
};

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const article = ARTICLES.find(a => a.id === id);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteToken, setDeleteToken] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [ghConfig, setGhConfig] = useState<GitHubConfig | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const stored = localStorage.getItem('dan_papers_gh_config');
    if (stored) {
        setGhConfig(JSON.parse(stored));
    }
  }, [id]);

  if (!article) {
    return (
      <div className="max-w-screen-md mx-auto mt-20 text-center font-sans text-gray-400">
        <h1 className="text-2xl font-bold">Paper not found</h1>
        <Link to="/" className="text-black underline mt-4 block">Return home</Link>
      </div>
    );
  }

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, msg]);
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    const result = await summarizeArticle(article.content);
    setSummary(result);
    setLoadingSummary(false);
  };

  const handleDelete = async () => {
    if (!ghConfig || !deleteToken) {
        setStatusMessage("Missing configuration or token.");
        return;
    }

    setShowDeleteModal(false);
    setShowTerminal(true);
    setIsDeleting(true);
    setTerminalLogs([]);
    setDeleteStatus('idle');

    addLog(`$ Authenticating identity with GPG Token ID...`);
    await new Promise(r => setTimeout(r, 800));

    try {
        const configWithToken = { ...ghConfig, token: deleteToken };
        const user = await getGitHubUser(deleteToken);
        const username = user.login.toLowerCase();
        const isAdmin = username === 'somdipto';
        
        addLog(`> Authenticated as: ${user.login} (${isAdmin ? 'ADMIN' : 'USER'})`);
        await new Promise(r => setTimeout(r, 500));

        const authorName = article.author.toLowerCase();
        const isSiteOwnerArticle = authorName === 'dan' || authorName === 'somdipto';
        const isOwner = authorName === (user.name || '').toLowerCase() || authorName === username;

        if (isSiteOwnerArticle && !isAdmin) {
             throw new Error("PERMISSION DENIED: You cannot delete the owner's papers.");
        }

        if (!isAdmin && !isOwner) {
             throw new Error(`PERMISSION DENIED: You are not the author of this paper.`);
        }

        addLog(`$ git fetch origin ${configWithToken.branch || 'main'}`);
        const { content: fileContent, sha } = await fetchFileContent(configWithToken);
        addLog(`> Reading constants.ts... OK`);
        
        const searchStr = `id: "${article.id}"`;
        const idIndex = fileContent.indexOf(searchStr);
        if (idIndex === -1) throw new Error(`Article ID "${article.id}" not found.`);

        let startIndex = -1;
        for (let i = idIndex; i >= 0; i--) {
            if (fileContent[i] === '{') {
                startIndex = i;
                break;
            }
        }

        let endIndex = -1;
        let balance = 0;
        for (let i = startIndex; i < fileContent.length; i++) {
            if (fileContent[i] === '{') balance++;
            if (fileContent[i] === '}') balance--;
            if (balance === 0) {
                endIndex = i;
                break;
            }
        }

        let removeEnd = endIndex + 1;
        while (removeEnd < fileContent.length && (fileContent[removeEnd] === ',' || fileContent[removeEnd] === ' ' || fileContent[removeEnd] === '\n')) {
             if (fileContent[removeEnd] === ',') {
                 removeEnd++;
                 break;
             }
             removeEnd++;
        }

        const newContent = fileContent.slice(0, startIndex) + fileContent.slice(removeEnd);
        const commitMsg = `Delete: ${article.title}`;
        
        await updateFileContent(configWithToken, newContent, sha, { message: commitMsg });

        addLog(`> Success.`);
        setDeleteStatus('success');

        const localIndex = ARTICLES.findIndex(a => a.id === article.id);
        if (localIndex > -1) ARTICLES.splice(localIndex, 1);

        setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
        addLog(`FATAL: ${error.message}`);
        setDeleteStatus('error');
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <article className="max-w-screen-md mx-auto mt-8 mb-20">
      <div className="bg-white px-6 md:px-12 py-12 rounded-2xl shadow-sm border border-gray-200/50">
          <h1 className="text-3xl md:text-5xl font-bold text-medium-black leading-tight mb-4 font-sans tracking-tight">
            {article.title}
          </h1>
          <h2 className="text-xl md:text-2xl text-medium-gray font-serif mb-8 leading-snug">
            {article.subtitle}
          </h2>

          <div className="flex items-center justify-between mb-12 border-b border-gray-100 pb-8">
            <div className="flex items-center gap-4">
              <img src={CURRENT_USER.image} alt="Author" className="w-12 h-12 rounded-full object-cover border border-gray-100" />
              <div className="font-sans">
                <span className="font-medium text-medium-black block">{article.author}</span>
                <div className="text-sm text-medium-gray flex items-center gap-2">
                  <span>{article.readTime} min read</span>
                  <span>·</span>
                  <span>{article.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-gray-400">
              {ghConfig && (
                <button onClick={() => setShowDeleteModal(true)} className="hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                </button>
              )}
              <button className="hover:text-black transition-colors"><Share size={20} /></button>
              <button className="hover:text-black transition-colors"><MoreHorizontal size={20} /></button>
            </div>
          </div>

          {article.image && (
            <figure className="mb-12">
              <img src={article.image} alt={article.title} className="w-full h-auto object-cover max-h-[500px] rounded-xl grayscale" />
            </figure>
          )}

          <div className="article-content">
            {renderArticleContent(article.content)}
          </div>

          <div className="my-12 p-8 bg-gray-50 rounded-2xl border border-gray-100 font-sans">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-black" size={20} />
                <h3 className="font-bold text-medium-black">Research Summary</h3>
              </div>
              {!summary && !loadingSummary && (
                <button onClick={handleGenerateSummary} className="px-4 py-1.5 bg-black text-white rounded-full text-xs hover:bg-gray-800 transition-all shadow-sm">
                  Generate
                </button>
              )}
            </div>
            {loadingSummary && <div className="text-sm text-gray-400 animate-pulse">Analyzing paper...</div>}
            {summary && <p className="text-gray-600 leading-relaxed italic">{summary}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-xs font-sans font-medium uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 font-sans border border-gray-100">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <AlertTriangle size={24} />
                    <h3 className="text-lg font-bold">Verify Identity</h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    Identity check required to delete <strong>"{article.title}"</strong>.
                </p>
                <input 
                    type="password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-1 focus:ring-black outline-none mb-6"
                    placeholder="GPG Token ID"
                    value={deleteToken}
                    onChange={(e) => setDeleteToken(e.target.value)}
                />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-gray-400 hover:text-black text-sm">Cancel</button>
                    <button onClick={handleDelete} className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Delete</button>
                </div>
            </div>
        </div>
      )}

      {showTerminal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="w-full max-w-2xl bg-black rounded-lg shadow-2xl overflow-hidden border border-gray-800 font-mono text-sm">
                <div className="p-6 h-[300px] overflow-y-auto text-red-400">
                    {terminalLogs.map((log, i) => <div key={i} className="mb-2 break-all">{log}</div>)}
                </div>
                {deleteStatus === 'error' && <div className="p-4 border-t border-gray-800 bg-red-900/20 text-red-400 flex justify-between"><button onClick={() => setShowTerminal(false)} className="text-white hover:underline">Close</button></div>}
            </div>
        </div>
      )}
    </article>
  );
};

export default ArticlePage;

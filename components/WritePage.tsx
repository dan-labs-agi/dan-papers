import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Terminal, Github, Settings, Loader2, AlertCircle, Wifi, Lock, Paperclip, Eye, Edit3 } from 'lucide-react';
import { CURRENT_USER, ARTICLES } from '../constants';
import { GitHubConfig, fetchFileContent, updateFileContent } from '../services/githubService';
import { structureArticle } from '../services/geminiService';
import { renderArticleContent } from './ArticlePage';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

const WritePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  // States for Document Processing
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  // GitHub Integration State
  const [showSettings, setShowSettings] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Terminal Logic
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  // Test Connection State
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const FIXED_CONFIG = {
      owner: 'somdipto',
      repo: 'dan-papers',
      path: 'constants.ts',
      branch: 'main'
  };

  const [ghConfig, setGhConfig] = useState<GitHubConfig>({
    token: '',
    ...FIXED_CONFIG
  });

  useEffect(() => {
    const stored = localStorage.getItem('dan_papers_gh_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      setGhConfig(prev => ({ ...prev, token: parsed.token || '' }));
    }
  }, []);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, msg]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    let rawText = '';

    try {
      const fileName = file.name.toLowerCase();
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        rawText = fullText;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        rawText = result.value;
      } else if (fileName.endsWith('.md') || file.type === 'text/markdown' || file.type === 'text/x-markdown') {
        rawText = await file.text();
      } else {
        throw new Error("Unsupported file format.");
      }

      const structured = await structureArticle(rawText);
      if (structured) {
        setTitle(structured.title || '');
        setSubtitle(structured.subtitle || '');
        setTags((structured.tags || []).join(', '));
        setContent(structured.content || '');
        setIsPreview(true); // Automatically show preview after successful structured upload
      } else {
        setContent(rawText);
      }
    } catch (err: any) {
      alert("Error reading file: " + err.message);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content, isPreview]);

  const generateArticleObjectString = () => {
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled-paper';
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const safeContent = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

    return `
  {
    id: "${id}",
    title: "${title || 'Untitled'}",
    subtitle: "${subtitle || ''}",
    author: "${CURRENT_USER.name}",
    date: "${date}",
    readTime: ${readTime},
    tags: ${JSON.stringify(tagArray.length ? tagArray : ['Research'])},
    image: "https://picsum.photos/800/400?grayscale",
    content: \`
${safeContent}
    \`
  },`;
  };

  const handlePublishToGitHub = async () => {
    const config = { ...ghConfig, token: ghConfig.token.trim() };
    if (!config.token) { setShowSettings(true); return; }

    setShowTerminal(true);
    setTerminalLogs([]);
    setIsPublishing(true);
    
    addLog(`$ git push origin main --force`);

    try {
      const { content: currentFileContent, sha } = await fetchFileContent(config);
      const marker = "export const ARTICLES: Article[] = [";
      const insertIndex = currentFileContent.indexOf(marker);
      if (insertIndex === -1) throw new Error("Marker not found.");

      const newFileContent = currentFileContent.slice(0, insertIndex + marker.length) + "\n" + generateArticleObjectString() + currentFileContent.slice(insertIndex + marker.length);
      await updateFileContent(config, newFileContent, sha, { message: `Publish: ${title}` });
      
      addLog(`$ Success.`);
      ARTICLES.unshift({
         id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
         title, subtitle, author: CURRENT_USER.name, date: 'Just now', readTime: 1, tags: [tags], content, image: "https://picsum.photos/800/400?grayscale"
      });
      setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
      setPublishStatus('error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-screen-md mx-auto px-4 mt-8 pb-32">
      {isProcessingFile && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-black mb-4" size={48} />
          <h2 className="text-xl font-bold font-sans">Analyzing Research...</h2>
        </div>
      )}

      <div className="mb-12 flex justify-between items-center border-b border-gray-100 pb-4">
        <Link to="/" className="text-gray-400 hover:text-black flex items-center gap-2 text-sm font-sans">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        
        <div className="flex gap-6 items-center">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.md" />
          <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-black flex items-center gap-2 text-sm font-sans" title="Upload PDF/DOCX/MD">
            <Paperclip size={16} /> <span>Upload</span>
          </button>
          
          <div className="h-4 w-px bg-gray-200" />

          <button onClick={() => setIsPreview(!isPreview)} className="flex items-center gap-2 text-sm font-sans font-medium text-black hover:opacity-70 transition-opacity">
            {isPreview ? <><Edit3 size={16} /> Write</> : <><Eye size={16} /> Preview</>}
          </button>
          
          <button onClick={() => setShowSettings(true)} className="text-gray-400 hover:text-black"><Settings size={18} /></button>
        </div>
      </div>

      {!isPreview ? (
        <div className="flex flex-col gap-6">
          <input 
            type="text" 
            placeholder="Title" 
            className="text-4xl md:text-5xl font-serif font-bold placeholder-gray-200 border-none outline-none focus:ring-0 bg-transparent p-0 text-medium-black leading-tight"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="One line abstract" 
            className="text-xl md:text-2xl font-serif text-gray-400 placeholder-gray-200 border-none outline-none focus:ring-0 bg-transparent p-0 leading-snug"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
          <div className="flex items-center gap-2 text-xs font-sans text-gray-400 uppercase tracking-widest font-bold">
             <span>Tags:</span>
             <input 
                type="text" 
                placeholder="Systems, AI, Physics" 
                className="flex-1 font-sans border-none outline-none focus:ring-0 bg-transparent p-0 text-gray-600 placeholder-gray-200"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
             />
          </div>
          <textarea 
            ref={textareaRef}
            placeholder="Start your research paper..." 
            className="w-full text-xl leading-relaxed font-serif text-medium-black/90 placeholder-gray-200 border-none outline-none focus:ring-0 bg-transparent p-0 resize-none min-h-[50vh]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      ) : (
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-sans font-bold text-medium-black mb-4 tracking-tight">{title || 'Untitled Paper'}</h1>
            <p className="text-xl text-gray-400 font-serif leading-relaxed italic">{subtitle || 'No abstract provided.'}</p>
          </div>
          <div className="prose prose-xl max-w-none">
            {renderArticleContent(content || 'No content yet. Start writing in the editor.')}
          </div>
        </div>
      )}

      <div className="fixed bottom-10 right-10 flex gap-3 z-50">
          <button 
              onClick={handlePublishToGitHub}
              disabled={!title || !content || isPublishing}
              className="bg-black text-white font-sans font-bold px-8 py-3 rounded-full shadow-2xl hover:bg-gray-800 disabled:opacity-30 transition-all flex items-center gap-3"
          >
              {isPublishing ? <Loader2 size={20} className="animate-spin" /> : <Github size={20} />}
              <span>{isPublishing ? 'Pushing...' : 'Publish Paper'}</span>
          </button>
      </div>

      {showTerminal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="w-full max-w-2xl bg-black rounded-xl overflow-hidden border border-gray-800 font-mono text-sm shadow-2xl">
                <div className="p-8 h-[300px] overflow-y-auto text-green-400">
                    {terminalLogs.map((log, i) => <div key={i} className="mb-2">{log}</div>)}
                    {isPublishing && <div className="animate-pulse">_</div>}
                </div>
            </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 font-sans border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Github /> GPG Config</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Personal Access Token</label>
                        <input 
                            type="password" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                            placeholder="ghp_..."
                            value={ghConfig.token}
                            onChange={e => setGhConfig(prev => ({...prev, token: e.target.value}))}
                        />
                    </div>
                </div>
                <div className="flex gap-3 mt-8">
                    <button onClick={() => setShowSettings(false)} className="flex-1 py-3 text-gray-400 hover:text-black font-bold">Cancel</button>
                    <button onClick={() => { localStorage.setItem('dan_papers_gh_config', JSON.stringify(ghConfig)); setShowSettings(false); }} className="flex-1 bg-black text-white rounded-xl font-bold py-3">Save</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default WritePage;

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // A simple hacky regex to inject classes into the labels while keeping them readable in raw markdown
  // This helps fulfill the prompt's requirement for labels like [strong] [wild] etc.
  const styledContent = content
    .replace(/\[strong\]/gi, '<span class="label-strong">strong</span>')
    .replace(/\[wild\]/gi, '<span class="label-wild">wild</span>')
    .replace(/\[quick-win\]/gi, '<span class="label-quick-win">quick-win</span>')
    .replace(/\[needs-more\]/gi, '<span class="label-needs-more">needs-more</span>');

  // Since we are building an SPA and need to render this HTML-ish string:
  // Note: In a production app, we'd use a real markdown parser like 'react-markdown'.
  // For this high-fidelity prototype, we'll manually split and render blocks to handle basic markdown.
  
  const blocks = styledContent.split('\n');

  return (
    <div className="markdown-content">
      {blocks.map((block, i) => {
        if (!block.trim()) return <div key={i} className="h-2" />;
        
        // Basic Headers
        if (block.startsWith('# ')) return <h1 key={i} dangerouslySetInnerHTML={{ __html: block.substring(2) }} />;
        if (block.startsWith('## ')) return <h2 key={i} dangerouslySetInnerHTML={{ __html: block.substring(3) }} />;
        
        // Basic Bullet points
        if (block.trim().startsWith('- ') || block.trim().startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-4 mb-1">
              <span className="text-indigo-400">•</span>
              <span dangerouslySetInnerHTML={{ __html: block.trim().substring(2) }} />
            </div>
          );
        }

        // Numbers
        if (/^\d+\./.test(block.trim())) {
          return (
            <div key={i} className="flex gap-2 ml-4 mb-1">
              <span dangerouslySetInnerHTML={{ __html: block.trim() }} />
            </div>
          );
        }

        // Bold and Horizontal rules
        if (block.startsWith('════')) {
           return <div key={i} className="py-4 font-mono text-center text-indigo-400 whitespace-pre border-y border-indigo-900/50 my-4">{block}</div>;
        }

        return <p key={i} dangerouslySetInnerHTML={{ __html: block }} />;
      })}
    </div>
  );
};

export default MarkdownRenderer;

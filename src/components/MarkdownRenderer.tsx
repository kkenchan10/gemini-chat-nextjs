import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import MermaidRenderer from './MermaidRenderer';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Style headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 text-gray-900">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              {children}
            </h3>
          ),
          
          // Style paragraphs
          p: ({ children }) => (
            <p className="mb-3 text-gray-800 leading-relaxed">
              {children}
            </p>
          ),
          
          // Style code blocks
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (inline) {
              return (
                <code
                  className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 border"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            
            // Handle Mermaid diagrams
            if (language === 'mermaid' || language === 'mermaid-js') {
              return <MermaidRenderer chart={String(children)} />;
            }
            
            return (
              <div className="my-4">
                {language && (
                  <div className="bg-gray-600 text-white text-xs px-3 py-1 rounded-t-md font-mono">
                    {language}
                  </div>
                )}
                <pre className={`bg-gray-900 text-gray-100 p-4 overflow-x-auto ${language ? 'rounded-b-md' : 'rounded-md'}`}>
                  <code className="font-mono text-sm" {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          
          // Style lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 text-gray-800 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 text-gray-800 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-3 bg-blue-50 text-gray-800 italic">
              {children}
            </blockquote>
          ),
          
          // Style tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 last:border-r-0">
              {children}
            </td>
          ),
          
          // Style links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          ),
          
          // Style horizontal rules
          hr: () => (
            <hr className="my-6 border-t border-gray-300" />
          ),
          
          // Style emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
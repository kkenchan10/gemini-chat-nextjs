'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  chart: string;
}

export default function MermaidRenderer({ chart }: MermaidRendererProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMermaid = async () => {
      setIsLoading(true);
      setError('');
      setSvg('');

      try {
        // Initialize mermaid with configuration
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Segoe UI, Roboto, sans-serif',
          fontSize: 14,
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
          },
          sequence: {
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
          },
          gantt: {
            titleTopMargin: 25,
            barHeight: 20,
            fontSize: 11,
            gridLineStartPadding: 35,
            leftPadding: 75,
            rightPadding: 50,
          },
        });

        // Validate and render the mermaid chart
        const isValid = await mermaid.parse(chart);
        
        if (isValid) {
          const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const { svg: renderedSvg } = await mermaid.render(id, chart);
          setSvg(renderedSvg);
        } else {
          setError('Invalid Mermaid syntax');
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        setError(err.message || 'Failed to render Mermaid chart');
      } finally {
        setIsLoading(false);
      }
    };

    if (chart) {
      renderMermaid();
    }
  }, [chart]);

  if (isLoading) {
    return (
      <div className="my-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Rendering Mermaid diagram...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-700 font-medium mb-2">❌ Mermaid Syntax Error:</div>
        <div className="text-sm text-red-600 mb-3">{error}</div>
        <details className="text-sm">
          <summary className="cursor-pointer text-red-700 font-medium hover:text-red-800">
            Show original syntax
          </summary>
          <pre className="mt-2 p-3 bg-red-100 border border-red-300 rounded text-xs font-mono text-red-800 overflow-x-auto">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  if (svg) {
    return (
      <div className="my-4 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-xs text-gray-500 mb-2 flex items-center">
          📊 Mermaid Diagram
        </div>
        <div 
          ref={containerRef}
          className="mermaid-container overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    );
  }

  return null;
}
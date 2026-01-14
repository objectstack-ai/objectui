import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"

/**
 * Props for the Markdown component implementation.
 * 
 * This component renders markdown content using react-markdown with GitHub Flavored Markdown support.
 * All content is sanitized to prevent XSS attacks.
 */
export interface MarkdownImplProps {
  /**
   * The markdown content to render.
   */
  content: string
  
  /**
   * Optional CSS class name to apply custom styling to the markdown container.
   */
  className?: string
}

/**
 * Internal Markdown implementation component.
 * This contains the actual react-markdown import (heavy ~100-200 KB).
 */
export default function MarkdownImpl({ content, className }: MarkdownImplProps) {
  // Utility function to merge class names (inline to avoid external dependency)
  const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')
  
  return (
    <div
      data-slot="markdown"
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
        "prose-p:leading-relaxed prose-p:text-foreground",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-muted prose-pre:text-foreground prose-pre:border",
        "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-ul:list-disc prose-ol:list-decimal",
        "prose-li:text-foreground prose-li:marker:text-muted-foreground",
        "prose-table:border prose-th:border prose-th:bg-muted prose-td:border",
        "prose-img:rounded-md prose-img:border",
        className
      )}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        // Additional security: only allow safe elements
        // This provides defense-in-depth beyond rehype-sanitize
        disallowedElements={['script', 'style', 'iframe', 'object', 'embed']}
        unwrapDisallowed={true}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

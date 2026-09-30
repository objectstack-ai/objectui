/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * DiscussionContext — shared chatter / discussion feed for the current
 * record. Mounted alongside RecordContext by the host record page (see
 * `RecordDetailView` in `@object-ui/app-shell`) so that any `record:chatter`
 * or `record:discussion` renderer placed inside the schema tree picks up
 * the same feed items / mutation handlers without a parallel fetch.
 *
 * Why this is separate from RecordContext: chatter feeds are commonly
 * absent (e.g. settings pages, dashboards), and many record pages opt in
 * via schema rather than always paying the fetch cost. Keeping the
 * discussion data in its own context lets non-record pages provide it
 * cheaply and lets record pages omit it without affecting unrelated
 * record-aware renderers.
 */

import React from 'react';

export interface DiscussionFeedItem {
  id: string;
  /** Generic discriminator — chatter renderers may switch on this. */
  type?: string;
  [k: string]: any;
}

export interface DiscussionMentionSuggestion {
  id: string;
  label: string;
  avatarUrl?: string;
}

export interface DiscussionAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  thumbnailUrl?: string;
}

export interface DiscussionContextValue {
  items: DiscussionFeedItem[];
  onAddComment?: (text: string, attachments?: DiscussionAttachment[]) => void | Promise<void>;
  onAddReply?: (parentId: string, text: string) => void | Promise<void>;
  onToggleReaction?: (itemId: string, reaction: string) => void | Promise<void>;
  /** Optional list of users (or any mentionable entities) the comment
   *  input can suggest after the user types `@`. When omitted the input
   *  falls back to free-text @-mentions without autocompletion. */
  mentionSuggestions?: DiscussionMentionSuggestion[];
  /** Optional uploader. When provided, the comment composer renders a
   *  drag-and-drop attachment panel; returned attachments are passed
   *  alongside the comment text to `onAddComment`. */
  onUploadAttachments?: (files: FileList) => Promise<DiscussionAttachment[]>;
  loading?: boolean;
  error?: Error | null;
  /**
   * The host's `sys_activity` read was REFUSED: 401 / 403, or a permission
   * envelope (objectui#11195). The feed renderers then show a no-permission
   * state rather than claiming the record has no activity. Produced by the
   * host that owns the fetch (app-shell `RecordDetailView`), which judges the
   * rejection with plugin-detail's `isRefusedFeedRead`. A read that answered
   * with zero rows, a 404, or any other failure is not a refusal and leaves
   * this unset.
   */
  activityDenied?: boolean;
  /** The same, for the host's `sys_comment` read. */
  commentsDenied?: boolean;
}

const DiscussionContext = React.createContext<DiscussionContextValue | null>(null);

export interface DiscussionContextProviderProps extends DiscussionContextValue {
  children: React.ReactNode;
}

export const DiscussionContextProvider: React.FC<DiscussionContextProviderProps> = ({
  children,
  ...value
}) => {
  const memo = React.useMemo<DiscussionContextValue>(() => value, [
    value.items,
    value.onAddComment,
    value.onAddReply,
    value.onToggleReaction,
    value.mentionSuggestions,
    value.onUploadAttachments,
    value.loading,
    value.error,
    value.activityDenied,
    value.commentsDenied,
  ]);
  return (
    <DiscussionContext.Provider value={memo}>{children}</DiscussionContext.Provider>
  );
};

export function useDiscussionContext(): DiscussionContextValue | null {
  return React.useContext(DiscussionContext);
}

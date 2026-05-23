export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
  followers?: number;
  posts?: number;
};

export type PostQuote = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: PublicUser;
};

export type PollOption = {
  id: string;
  text: string;
  votesCount: number;
};

export type Post = {
  id: string;
  content: string;
  imageUrl: string | null;
  audioUrl: string | null;
  postType: "text" | "poll" | "voice";
  pollQuestion: string | null;
  pollOptions: PollOption[] | null;
  pollTotalVotes: number;
  myPollVoteId: string | null;
  parentId: string | null;
  repostOfId: string | null;
  repostOf: PostQuote | null;
  hashtags: string[];
  createdAt: string;
  author: PublicUser;
  counts: { likes: number; reposts: number; comments: number };
  liked: boolean;
  reposted: boolean;
};

export type VoiceRoom = {
  id: string;
  name: string;
  description: string;
  maxMembers: number;
  membersCount: number;
  owner: PublicUser;
  createdAt: string;
  members?: { user: PublicUser; joinedAt: string }[];
};

export type Clan = {
  id: string;
  name: string;
  tag: string;
  description: string;
  avatarUrl: string | null;
  owner: PublicUser;
  membersCount: number;
  isMember?: boolean;
  myRole?: string | null;
  members?: { role: string; user: PublicUser }[];
};

export type HashtagResult = {
  tag: string;
  postsCount: number;
};

export type ConversationPreview = {
  id: string;
  participants: PublicUser[];
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  updatedAt: string;
};

export type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: PublicUser;
  isMine: boolean;
  conversationId?: string;
  encrypted?: boolean;
};

export type Notification = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  postId: string | null;
  actor: PublicUser | null;
};

import type {
  AISkill,
  MediaType,
  GenJobStatus,
  MessageRole,
  Role,
  Account,
  Session,
  User,
  VerificationToken,
  PasswordResetToken,
  UserApiKey,
  Project,
  Conversation,
  Message,
  Media,
  GenJob,
  Setting
} from "@/prisma/client"

declare global {
  type RoleBase = Role & {
    users: User[] | null
  }
  type AccountBase = Account & {
    user: User | null
  }
  type SessionBase = Session & {
    user: User | null
  }
  type UserBase = User & {
    accounts: Account[] | null
    sessions: Session[] | null
    projects: Project[] | null
    conversations: Conversation[] | null
    api_keys: UserApiKey[] | null
    password_resets: PasswordResetToken[] | null
  }
  type VerificationTokenBase = VerificationToken
  type PasswordResetTokenBase = PasswordResetToken & {
    user: User | null
  }
  type UserApiKeyBase = UserApiKey & {
    user: User | null
  }
  type ProjectBase = Project & {
    user: User | null
    conversations: Conversation[] | null
  }
  type ConversationBase = Conversation & {
    user: User | null
    project: Project | null
    messages: Message[] | null
    gen_jobs: GenJob[] | null
  }
  type MessageBase = Message & {
    conversation: Conversation | null
    media: Media[] | null
    gen_jobs: GenJob[] | null
  }
  type MediaBase = Media & {
    message: Message | null
  }
  type GenJobBase = GenJob & {
    message: Message | null
    conversation: Conversation | null
  }
  type SettingBase = Setting

  type SerializedMessage = Omit<MessageCreateInput, 'created_at' | 'updated_at'> & {
    created_at: string | null;
    updated_at: string | null;
    media: Array<Omit<MediaBase, 'created_at' | 'updated_at'> & {
      created_at: string | null;
      updated_at: string | null;
    }>;
    gen_jobs: Array<Omit<GenJobBase, 'created_at' | 'updated_at' | 'started_at' | 'completed_at'> & {
      created_at: string | null;
      updated_at: string | null;
      started_at: string | null;
      completed_at: string | null;
    }>;
  };

  type SerializedConversation = Omit<ConversationCreateInput, 'created_at' | 'updated_at' | 'last_message_at' | 'messages'> & {
    created_at: string | null;
    updated_at: string | null;
    last_message_at: string | null;
    messages: SerializedMessage[];
  };
}

export { }
"use client";

import {
  ArrowLeft,
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  CreditCard,
  FolderKanban,
  Globe,
  Heart,
  House,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  PenSquare,
  Phone,
  Plus,
  Settings,
  Sparkles,
  Star,
  Sun,
  Tag,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { AiChatPanel } from "@/components/chats/ai-chat-panel";
import { ChatLayout } from "@/components/chats/chat-layout";
import { ConversationList } from "@/components/chats/conversation-list";
import { UserChatPanel } from "@/components/chats/user-chat-panel";
import { AvatarPicker } from "@/components/common/avatar-picker";
import { InfoCard } from "@/components/common/info-card";
import { ThemeButton, ThemeInput, ThemeSelect } from "@/components/common/theme-controls";
import { ProjectMap } from "@/components/maps/project-map";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectDetailCard } from "@/components/projects/project-detail";
import {
  AVATAR_PRESETS,
  LOCATION_DATA,
  PLAN_OPTIONS,
  categoryOrder,
  myProjectCategories,
  navItems,
  seedUsers,
  sharedProjectsSeed,
} from "@/lib/seed-data";
import {
  createTimestamp,
  deriveInitials,
  formatTimeLabel,
  generateId,
  getAdaptiveQuestions,
  inferConversationResponse,
  presetFromId,
  uniqueProjectList,
} from "@/lib/prototype-utils";
import type {
  AppStage,
  ChatMessage,
  ChatsTab,
  Conversation,
  PageKey,
  PlanKey,
  Project,
  ProjectMembershipFilter,
  ProjectsTabKey,
  Question,
  SharedProject,
  ThemeMode,
  ThemeStyles,
  UserProject,
} from "@/types/prototype";

const CURRENT_USER_ID = "current-user";
const SAMPLE_AI_WELCOME: ChatMessage[] = [];

type UserProjectForm = {
  title: string;
  location: string;
  category: (typeof myProjectCategories)[number];
  description: string;
  tags: string;
  visibility: "private" | "public";
};

function createBaseConversationMessages(currentUserName: string): Record<string, ChatMessage[]> {
  return {
    "global-community": [
      {
        id: generateId("msg"),
        conversationId: "global-community",
        senderId: "u-ava",
        senderName: "Ava Chen",
        content: "Welcome to the community lounge. Share your location, timeline, and what kind of collaborators you're hoping to meet.",
        createdAt: createTimestamp(-95),
      },
      {
        id: generateId("msg"),
        conversationId: "global-community",
        senderId: "u-priya",
        senderName: "Priya Singh",
        content: "We're collecting project intros this week. A short post with your goals gets the best responses.",
        createdAt: createTimestamp(-72),
      },
    ],
    "project-1": [
      {
        id: generateId("msg"),
        conversationId: "project-1",
        senderId: "u-ava",
        senderName: "Ava Chen",
        content: "Glad you're looking at the garden co-op. Weekend build days are usually family-friendly and beginner-friendly.",
        createdAt: createTimestamp(-65),
      },
    ],
    "project-2": [
      {
        id: generateId("msg"),
        conversationId: "project-2",
        senderId: "u-marcus",
        senderName: "Marcus Lee",
        content: "Our next desert build sprint covers solar shade, water storage, and two shared workshop sessions.",
        createdAt: createTimestamp(-48),
      },
    ],
    "direct-u-ava": [
      {
        id: generateId("msg"),
        conversationId: "direct-u-ava",
        senderId: "u-ava",
        senderName: "Ava Chen",
        content: `Hi ${currentUserName || "there"}! Happy to answer questions about San Diego family routines and how the group handles onboarding.`,
        createdAt: createTimestamp(-38),
      },
    ],
  };
}

export default function Prototype6() {
  const [appStage, setAppStage] = useState<AppStage>("signin_profile");
  const [page, setPage] = useState<PageKey>("home");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<number[]>([1, 2]);
  const [recentActivity, setRecentActivity] = useState<string[]>([
    "Opened Prototype 6",
    "Reviewed chat architecture",
    "Prepared joinable project flows",
  ]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarType, setAvatarType] = useState<"preset" | "upload">("preset");
  const [selectedAvatarPresetId, setSelectedAvatarPresetId] = useState(AVATAR_PRESETS[0]?.id ?? "");
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | undefined>(undefined);

  const [selectedContinent, setSelectedContinent] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [selectedPlan, setSelectedPlan] = useState<PlanKey | "">("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
  const [questionnaireStep, setQuestionnaireStep] = useState(0);

  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectForm, setProjectForm] = useState<UserProjectForm>({
    title: "",
    location: "",
    category: "Community Living",
    description: "",
    tags: "",
    visibility: "private",
  });

  const [projectJoinStatuses, setProjectJoinStatuses] = useState<Record<number, "not_joined" | "joined" | "requested">>({
    1: "joined",
    2: "joined",
    3: "not_joined",
    4: "not_joined",
    5: "not_joined",
    6: "not_joined",
    7: "not_joined",
    8: "not_joined",
  });

  const [projectsTab, setProjectsTab] = useState<ProjectsTabKey>("explore");
  const [membershipFilter, setMembershipFilter] = useState<ProjectMembershipFilter>("all");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [fullscreenMapOpen, setFullscreenMapOpen] = useState(false);
  const [activeMapProject, setActiveMapProject] = useState<SharedProject | null>(null);

  const [globalChatOptIn, setGlobalChatOptIn] = useState(false);
  const [chatsTab, setChatsTab] = useState<ChatsTab>("user");
  const [userChatSearchQuery, setUserChatSearchQuery] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [userChatDraft, setUserChatDraft] = useState("");
  const [conversationMessages, setConversationMessages] = useState<Record<string, ChatMessage[]>>(
    createBaseConversationMessages("You")
  );
  const [typingConversationId, setTypingConversationId] = useState<string | null>(null);
  const [userChatLoading, setUserChatLoading] = useState(false);
  const [showConversationPaneOnMobile, setShowConversationPaneOnMobile] = useState(false);

  const [aiMessages, setAiMessages] = useState<ChatMessage[]>(SAMPLE_AI_WELCOME);
  const [aiDraft, setAiDraft] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTypingLabel, setAiTypingLabel] = useState<string | null>(null);
  const [lastAiPrompt, setLastAiPrompt] = useState<string | null>(null);

  const isDark = theme === "dark";
  const themeStyles: ThemeStyles = isDark
    ? {
        appBg: "#0b1220",
        panel: "#0f172a",
        card: "#111c34",
        border: "#24324b",
        text: "#e5eefc",
        muted: "#9cb0cf",
        primary: "#7aa2ff",
        primaryText: "#08111f",
        pill: "#15233f",
        shadow: "0 18px 40px rgba(0,0,0,0.35)",
      }
    : {
        appBg: "#f4f7fb",
        panel: "#ffffff",
        card: "#ffffff",
        border: "#dbe4f0",
        text: "#0f172a",
        muted: "#5b6b82",
        primary: "#5b8cff",
        primaryText: "#ffffff",
        pill: "#eef4ff",
        shadow: "0 18px 40px rgba(15,23,42,0.08)",
      };

  const mutedTextClass = isDark ? "text-slate-300" : "text-slate-600";
  const placeholderClass = isDark ? "placeholder:text-slate-500" : "placeholder:text-slate-400";

  const selectedPreset = presetFromId(selectedAvatarPresetId);

  const currentUser = useMemo(() => {
    const initials = deriveInitials(fullName || email || "User");
    return {
      id: CURRENT_USER_ID,
      fullName: fullName || "Prototype user",
      email,
      phone,
      avatarLabel: avatarType === "preset" ? selectedPreset?.emoji || initials : initials,
      avatarGradient: avatarType === "preset" ? selectedPreset?.gradient || "from-slate-400 to-slate-600" : "from-sky-500 to-indigo-600",
      avatarUploadUrl: avatarType === "upload" ? uploadedAvatarUrl : undefined,
      online: true,
    };
  }, [avatarType, email, fullName, phone, selectedPreset, uploadedAvatarUrl]);

  useEffect(() => {
    setConversationMessages((prev) => {
      if (prev["direct-u-ava"]?.[0]?.content.includes("Prototype user") && currentUser.fullName !== "Prototype user") {
        return createBaseConversationMessages(currentUser.fullName);
      }
      return prev;
    });
  }, [currentUser.fullName]);

  const countriesForSelectedContinent = useMemo(() => {
    if (!selectedContinent || !LOCATION_DATA[selectedContinent]) return [];
    return Object.keys(LOCATION_DATA[selectedContinent]).sort();
  }, [selectedContinent]);

  const selectedCountryData = useMemo(() => {
    if (!selectedContinent || !selectedCountry) return null;
    return LOCATION_DATA[selectedContinent]?.[selectedCountry] ?? null;
  }, [selectedContinent, selectedCountry]);

  const regionsForSelectedCountry = useMemo(() => {
    if (!selectedCountryData) return [];
    return selectedCountryData.regions.map((region) => region.name);
  }, [selectedCountryData]);

  const selectedRegionData = useMemo(() => {
    if (!selectedCountryData || !selectedRegion) return null;
    return selectedCountryData.regions.find((region) => region.name === selectedRegion) ?? null;
  }, [selectedCountryData, selectedRegion]);

  const citiesForSelectedRegion = useMemo(() => selectedRegionData?.cities ?? [], [selectedRegionData]);
  const regionLabel = selectedCountryData?.regionLabel || "State / Province / Region";
  const cityLabel = selectedCountryData?.cityLabel || "City";

  const currentLocation = useMemo(() => {
    if (!selectedCity || !selectedRegion || !selectedCountry || !selectedContinent) return "";
    return `${selectedCity}, ${selectedRegion}, ${selectedCountry}, ${selectedContinent}`;
  }, [selectedCity, selectedRegion, selectedCountry, selectedContinent]);

  const signInProfileReady =
    fullName.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    selectedContinent !== "" &&
    selectedCountry !== "" &&
    selectedRegion !== "" &&
    selectedCity !== "" &&
    ((avatarType === "preset" && !!selectedAvatarPresetId) || (avatarType === "upload" && !!uploadedAvatarUrl));

  const planLabel = useMemo(() => {
    if (selectedPlan === "starter") return "Starter Plan — $1";
    if (selectedPlan === "pro") return "Pro Plan — $10/month";
    if (selectedPlan === "skip") return "Skip for now — prototype access";
    return "No plan selected";
  }, [selectedPlan]);

  const adaptiveQuestions = useMemo<Question[]>(() => getAdaptiveQuestions(currentLocation, questionnaireAnswers), [currentLocation, questionnaireAnswers]);

  useEffect(() => {
    setQuestionnaireStep((prev) => Math.min(prev, Math.max(adaptiveQuestions.length - 1, 0)));
  }, [adaptiveQuestions.length]);

  const currentQuestion = adaptiveQuestions[Math.min(questionnaireStep, adaptiveQuestions.length - 1)];
  const answeredCount = adaptiveQuestions.filter((question) => String(questionnaireAnswers[question.id] || "").trim().length > 0).length;
  const questionnaireComplete = answeredCount === adaptiveQuestions.length;
  const questionnaireProgressPercent = adaptiveQuestions.length === 0 ? 0 : Math.round((answeredCount / adaptiveQuestions.length) * 100);

  const groupedSummary = useMemo<Record<string, { id: string; label: string; value: string }[]>>(() => {
    const summary: Record<string, { id: string; label: string; value: string }[]> = {};
    adaptiveQuestions.forEach((question) => {
      if (!summary[question.category]) summary[question.category] = [];
      summary[question.category].push({
        id: question.id,
        label: question.label,
        value: questionnaireAnswers[question.id] || "Not answered yet",
      });
    });
    return summary;
  }, [adaptiveQuestions, questionnaireAnswers]);

  const normalizedSharedProjects = useMemo<SharedProject[]>(() => {
    return sharedProjectsSeed.map((project) => ({
      ...project,
      joinStatus: projectJoinStatuses[project.id] ?? project.joinStatus ?? "not_joined",
    }));
  }, [projectJoinStatuses]);

  const recommendedProjects = useMemo<SharedProject[]>(() => {
    if (!questionnaireComplete) return [];
    const tokenSource = [currentLocation, ...Object.values(questionnaireAnswers)].join(" ");
    const tokens = tokenSource.toLowerCase().split(/[^a-z0-9]+/).map((item) => item.trim()).filter(Boolean);

    return normalizedSharedProjects
      .map((project) => {
        const blob = [project.location, project.category, project.description, ...project.tags, ...project.profileKeywords].join(" ").toLowerCase();
        let score = 0;
        const reasons: string[] = [];
        tokens.forEach((token) => {
          if (token.length > 2 && blob.includes(token)) score += 1;
        });
        if (project.state === selectedRegion && project.country === selectedCountry) {
          score += 3;
          reasons.push(`Same state match: ${project.state}`);
        }
        const projectType = String(questionnaireAnswers.project_type || "").toLowerCase();
        if (projectType && blob.includes(projectType.split(" ")[0])) {
          score += 3;
          reasons.push(`Project type fit: ${questionnaireAnswers.project_type}`);
        }
        const strength = String(questionnaireAnswers.primary_strength || "").toLowerCase();
        if (strength && blob.includes(strength.split(" ")[0])) {
          score += 2;
          reasons.push(`Matches your strength: ${questionnaireAnswers.primary_strength}`);
        }
        return { ...project, score, reasons: reasons.slice(0, 3) };
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 4);
  }, [currentLocation, normalizedSharedProjects, questionnaireAnswers, questionnaireComplete, selectedCountry, selectedRegion]);

  const nearbyProjects = useMemo(() => {
    if (!selectedRegion || !selectedCountry) return [];
    return normalizedSharedProjects.filter((project) => project.state === selectedRegion && project.country === selectedCountry);
  }, [normalizedSharedProjects, selectedCountry, selectedRegion]);

  const publicProjectsFiltered = useMemo(() => {
    const q = projectSearchQuery.trim().toLowerCase();
    if (!q) return normalizedSharedProjects;
    return normalizedSharedProjects.filter((project) => {
      const blob = [project.title, project.creator, project.category, project.location, project.description, ...project.tags].join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [normalizedSharedProjects, projectSearchQuery]);

  const projectsPageHighlightedIds = useMemo(() => {
    if (!projectSearchQuery.trim()) return [];
    return publicProjectsFiltered.map((project) => project.id);
  }, [projectSearchQuery, publicProjectsFiltered]);

  const miniMapProjects = useMemo(() => {
    if (projectSearchQuery.trim()) return publicProjectsFiltered;
    const merged = uniqueProjectList([...recommendedProjects, ...nearbyProjects]);
    return merged.length > 0 ? merged : normalizedSharedProjects.slice(0, 5);
  }, [projectSearchQuery, publicProjectsFiltered, recommendedProjects, nearbyProjects, normalizedSharedProjects]);

  const joinedSharedProjects = useMemo(() => normalizedSharedProjects.filter((project) => project.joinStatus === "joined"), [normalizedSharedProjects]);

  const myProjectsCollection = useMemo<Project[]>(() => {
    const joined = joinedSharedProjects.filter((project) => project.creatorId !== CURRENT_USER_ID);
    const created = userProjects;
    if (membershipFilter === "created") return created;
    if (membershipFilter === "joined") return joined;
    return [...created, ...joined];
  }, [joinedSharedProjects, membershipFilter, userProjects]);

  const favoriteProjects = useMemo(() => normalizedSharedProjects.filter((project) => favoriteProjectIds.includes(project.id)), [favoriteProjectIds, normalizedSharedProjects]);

  const openProjectDetail = (project: Project) => {
    setSelectedProject(project);
    setPage("project_detail");
    addActivity(`Viewed ${project.title}`);
  };

  const sharedProjectsForChats = useMemo(() => [...normalizedSharedProjects, ...userProjects], [normalizedSharedProjects, userProjects]);

  const availableUserConversations = useMemo<Conversation[]>(() => {
    const conversations: Conversation[] = [];

    if (globalChatOptIn) {
      conversations.push({
        id: "global-community",
        kind: "global",
        title: "Global community",
        subtitle: "All opted-in members",
        avatarLabel: "GL",
        avatarGradient: "from-slate-700 to-sky-700",
        unreadCount: 3,
        participantIds: [CURRENT_USER_ID],
        canAccess: true,
        pinned: true,
      });
    }

    const projectConversations = sharedProjectsForChats
      .filter((project) => ("joinStatus" in project ? project.joinStatus === "joined" : true) || project.creatorId === CURRENT_USER_ID)
      .map((project) => ({
        id: `project-${project.id}`,
        kind: "project" as const,
        title: project.title,
        subtitle: `${project.privacy === "public" ? "Public" : "Private"} project room`,
        projectId: project.id,
        avatarLabel: project.thumbnail || project.title.slice(0, 2).toUpperCase(),
        avatarGradient: "from-sky-500 to-indigo-600",
        unreadCount: 0,
        participantIds: [CURRENT_USER_ID, project.creatorId],
        canAccess: true,
      }));

    const creatorIds = Array.from(
      new Set(
        sharedProjectsForChats
          .filter((project) => ("joinStatus" in project ? project.joinStatus === "joined" : true) || project.creatorId === CURRENT_USER_ID)
          .map((project) => project.creatorId)
          .filter((creatorId) => creatorId !== CURRENT_USER_ID)
      )
    );

    const directConversations = creatorIds.map((creatorId) => {
      const person = seedUsers.find((user) => user.id === creatorId);
      return {
        id: `direct-${creatorId}`,
        kind: "direct" as const,
        title: person?.fullName || "Direct chat",
        subtitle: "Project owner direct channel",
        avatarLabel: person?.avatarLabel || "DM",
        avatarGradient: person?.avatarGradient || "from-slate-500 to-slate-700",
        online: person?.online,
        unreadCount: creatorId === "u-ava" ? 1 : 0,
        participantIds: [CURRENT_USER_ID, creatorId],
        canAccess: true,
      };
    });

    const combined = [...conversations, ...projectConversations, ...directConversations];
    const q = userChatSearchQuery.trim().toLowerCase();
    if (!q) return combined;

    return combined.filter((conversation) =>
      [conversation.title, conversation.subtitle, conversation.kind].join(" ").toLowerCase().includes(q)
    );
  }, [globalChatOptIn, sharedProjectsForChats, userChatSearchQuery]);

  useEffect(() => {
    if (!selectedConversationId && availableUserConversations.length > 0) {
      setSelectedConversationId(availableUserConversations[0].id);
    }
  }, [availableUserConversations, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    const stillVisible = availableUserConversations.some((conversation) => conversation.id === selectedConversationId);
    if (!stillVisible) {
      setSelectedConversationId(availableUserConversations[0]?.id ?? null);
      setShowConversationPaneOnMobile(false);
    }
  }, [availableUserConversations, selectedConversationId]);

  const selectedConversation = useMemo(
    () => availableUserConversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [availableUserConversations, selectedConversationId]
  );

  const selectedConversationMessages = useMemo(() => {
    if (!selectedConversationId) return [];
    return conversationMessages[selectedConversationId] ?? [];
  }, [conversationMessages, selectedConversationId]);

  const addActivity = (entry: string) => setRecentActivity((prev) => [entry, ...prev].slice(0, 10));

  const toggleFavorite = (projectId: number, title: string) => {
    setFavoriteProjectIds((prev) => {
      const exists = prev.includes(projectId);
      addActivity(exists ? `Removed ${title} from favorites` : `Saved ${title} to favorites`);
      return exists ? prev.filter((id) => id !== projectId) : [projectId, ...prev];
    });
  };

  const updateAnswer = (questionId: string, value: string) => {
    setQuestionnaireAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      if (questionId === "household_type") {
        if (value === "Individual") next.household_size = "1";
        else if (value === "Couple") next.household_size = "2";
        else delete next.household_size;
      }
      return next;
    });
  };

  const createProject = () => {
    if (!projectForm.title.trim() || !projectForm.location.trim() || !projectForm.description.trim()) return;
    const nextId = Date.now();
    const newProject: UserProject = {
      id: nextId,
      title: projectForm.title.trim(),
      creatorId: CURRENT_USER_ID,
      creator: currentUser.fullName,
      category: projectForm.category,
      location: projectForm.location.trim(),
      state: selectedRegion || "Custom",
      country: selectedCountry || "Custom",
      continent: selectedContinent || "Custom",
      city: selectedCity || "Custom",
      description: projectForm.description.trim(),
      tags: projectForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      thumbnail: projectForm.title.trim().slice(0, 2).toUpperCase(),
      lat: 0,
      lng: 0,
      privacy: projectForm.visibility === "public" ? "public" : "private",
      visibility: projectForm.visibility,
      joinStatus: "joined",
    };

    setUserProjects((prev) => [newProject, ...prev]);
    setConversationMessages((prev) => ({
      ...prev,
      [`project-${nextId}`]: [
        {
          id: generateId("msg"),
          conversationId: `project-${nextId}`,
          senderId: CURRENT_USER_ID,
          senderName: currentUser.fullName,
          content: `Welcome to ${newProject.title}. This room is ready for project members and future backend sync.`,
          createdAt: createTimestamp(0),
        },
      ],
    }));
    addActivity(`Created ${newProject.title}`);
    setProjectForm({ title: "", location: "", category: "Community Living", description: "", tags: "", visibility: "private" });
    setShowCreateForm(false);
    setProjectsTab("my_projects");
  };

  const handleJoinProject = (project: SharedProject) => {
    if (project.privacy === "public") {
      setProjectJoinStatuses((prev) => ({ ...prev, [project.id]: "joined" }));
      setConversationMessages((prev) => ({
        ...prev,
        [`project-${project.id}`]: prev[`project-${project.id}`] ?? [
          {
            id: generateId("msg"),
            conversationId: `project-${project.id}`,
            senderId: project.creatorId,
            senderName: project.creator,
            content: `Welcome to ${project.title}. You're now in the project room and you can message the project owner directly.`,
            createdAt: createTimestamp(0),
          },
        ],
        [`direct-${project.creatorId}`]: prev[`direct-${project.creatorId}`] ?? [
          {
            id: generateId("msg"),
            conversationId: `direct-${project.creatorId}`,
            senderId: project.creatorId,
            senderName: project.creator,
            content: `Hi ${currentUser.fullName}! I saw you joined ${project.title}. Feel free to ask questions here anytime.`,
            createdAt: createTimestamp(1),
          },
        ],
      }));
      addActivity(`Joined ${project.title}`);
    } else {
      setProjectJoinStatuses((prev) => ({ ...prev, [project.id]: "requested" }));
      addActivity(`Requested access to ${project.title}`);
    }
  };

  const openProjectChat = (project: Project) => {
    setPage("chats");
    setChatsTab("user");
    setSelectedConversationId(`project-${project.id}`);
    setShowConversationPaneOnMobile(true);
    addActivity(`Opened ${project.title} chat`);
  };

  const sendUserMessage = () => {
    if (!selectedConversation || !userChatDraft.trim()) return;
    const nextMessage: ChatMessage = {
      id: generateId("msg"),
      conversationId: selectedConversation.id,
      senderId: CURRENT_USER_ID,
      senderName: currentUser.fullName,
      content: userChatDraft.trim(),
      createdAt: createTimestamp(0),
    };

    setConversationMessages((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] ?? []), nextMessage],
    }));
    setUserChatDraft("");
    setUserChatLoading(true);
    setTypingConversationId(selectedConversation.id);

    const replyConversationId = selectedConversation.id;
    window.setTimeout(() => {
      setConversationMessages((prev) => ({
        ...prev,
        [replyConversationId]: [
          ...(prev[replyConversationId] ?? []),
          {
            id: generateId("msg"),
            conversationId: replyConversationId,
            senderId: selectedConversation.kind === "direct"
              ? selectedConversation.participantIds.find((id) => id !== CURRENT_USER_ID) || "u-ava"
              : selectedConversation.kind === "project"
              ? sharedProjectsForChats.find((project) => `project-${project.id}` === replyConversationId)?.creatorId || "u-ava"
              : "u-priya",
            senderName: selectedConversation.kind === "global"
              ? "Community Bot"
              : selectedConversation.kind === "project"
              ? sharedProjectsForChats.find((project) => `project-${project.id}` === replyConversationId)?.creator || "Project owner"
              : selectedConversation.title,
            content: inferConversationResponse(selectedConversation.title, selectedConversation.kind),
            createdAt: createTimestamp(1),
          },
        ],
      }));
      setTypingConversationId(null);
      setUserChatLoading(false);
    }, 950);
  };

  const buildAiContext = () => ({
    user: {
      fullName: currentUser.fullName,
      location: currentLocation,
      favoritesCount: favoriteProjects.length,
      joinedProjectsCount: joinedSharedProjects.length,
      createdProjectsCount: userProjects.length,
    },
    questionnaireAnswers,
    selectedProject: selectedProject?.title || null,
    globalChatOptIn,
  });

  const requestAiResponse = async (prompt: string) => {
    const userMessage: ChatMessage = {
      id: generateId("aimsg"),
      conversationId: "ai-global",
      senderId: CURRENT_USER_ID,
      senderName: currentUser.fullName,
      role: "user",
      content: prompt,
      createdAt: createTimestamp(0),
      status: "sent",
    };

    const assistantId = generateId("aimsg");
    const assistantMessage: ChatMessage = {
      id: assistantId,
      conversationId: "ai-global",
      senderId: "ai-assistant",
      senderName: "Prototype 6 Assistant",
      role: "assistant",
      content: "",
      createdAt: createTimestamp(1),
      status: "streaming",
    };

    setAiMessages((prev) => [...prev, userMessage, assistantMessage]);
    setAiLoading(true);
    setAiTypingLabel("Assistant is thinking…");
    setLastAiPrompt(prompt);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...aiMessages, userMessage].map((message) => ({ role: message.role || "user", content: message.content })),
          context: buildAiContext(),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("AI route failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setAiMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: accumulated, status: "streaming" }
              : message
          )
        );
      }

      setAiMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId ? { ...message, content: accumulated, status: "sent" } : message
        )
      );
      addActivity("Sent a message to the AI assistant");
    } catch (error) {
      setAiMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: message.content || "I hit a temporary problem while generating a response.",
                status: "error",
              }
            : message
        )
      );
    } finally {
      setAiLoading(false);
      setAiTypingLabel(null);
    }
  };

  const sendAiMessage = async () => {
    const trimmed = aiDraft.trim();
    if (!trimmed) return;
    setAiDraft("");
    await requestAiResponse(trimmed);
  };

  const retryAiMessage = async () => {
    if (!lastAiPrompt) return;
    await requestAiResponse(lastAiPrompt);
  };

  const handleRetryAiByMessage = async () => {
    await retryAiMessage();
  };

  const copyAssistantMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      addActivity("Copied an AI response");
    } catch {
      addActivity("Clipboard copy was blocked in this browser session");
    }
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedAvatarUrl(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const renderSigninProfile = () => (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <InfoCard themeStyles={themeStyles} className="overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 md:p-8 lg:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: themeStyles.pill, color: themeStyles.primary }}>
              <Sparkles className="h-4 w-4" />
              Prototype 6 onboarding
            </div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>
              Set up your profile, identity, and location
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: themeStyles.muted }}>
              Prototype 6 adds joinable projects, community chat, AI chat, avatars, and project membership. This first step collects the core profile data that powers all of it.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: themeStyles.text }}>
                  <User className="h-4 w-4" />
                  Full name
                </label>
                <ThemeInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your display name" themeStyles={themeStyles} />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: themeStyles.text }}>
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <ThemeInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" themeStyles={themeStyles} />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: themeStyles.text }}>
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <ThemeInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" themeStyles={themeStyles} />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: themeStyles.text }}>
                  <Globe className="h-4 w-4" />
                  Continent
                </label>
                <ThemeSelect value={selectedContinent} onChange={(e) => { setSelectedContinent(e.target.value); setSelectedCountry(""); setSelectedRegion(""); setSelectedCity(""); }} options={Object.keys(LOCATION_DATA)} placeholder="Select continent" themeStyles={themeStyles} />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: themeStyles.text }}>
                  <MapPin className="h-4 w-4" />
                  Country
                </label>
                <ThemeSelect value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSelectedRegion(""); setSelectedCity(""); }} options={countriesForSelectedContinent} placeholder="Select country" themeStyles={themeStyles} />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: themeStyles.text }}>
                  <MapPin className="h-4 w-4" />
                  {regionLabel}
                </label>
                <ThemeSelect value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCity(""); }} options={regionsForSelectedCountry} placeholder={`Select ${regionLabel}`} themeStyles={themeStyles} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: themeStyles.text }}>
                  <MapPin className="h-4 w-4" />
                  {cityLabel}
                </label>
                <ThemeSelect value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} options={citiesForSelectedRegion} placeholder={`Select ${cityLabel}`} themeStyles={themeStyles} />
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium" style={{ color: themeStyles.text }}>
                <Upload className="h-4 w-4" />
                Avatar setup
              </div>
              <AvatarPicker
                presets={AVATAR_PRESETS}
                selectedPresetId={selectedAvatarPresetId}
                selectedUploadUrl={uploadedAvatarUrl}
                avatarType={avatarType}
                onSelectPreset={setSelectedAvatarPresetId}
                onSelectUpload={handleAvatarUpload}
                onChangeType={setAvatarType}
                themeStyles={themeStyles}
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => signInProfileReady && setAppStage("signin_plan")}
                className="rounded-2xl px-5 py-3 text-sm font-medium transition"
                style={{
                  backgroundColor: themeStyles.primary,
                  color: themeStyles.primaryText,
                  opacity: signInProfileReady ? 1 : 0.45,
                  pointerEvents: signInProfileReady ? "auto" : "none",
                }}
              >
                Continue to access plan
              </button>
              <span className="text-sm" style={{ color: themeStyles.muted }}>
                Required: full name, avatar, email, phone, and full location
              </span>
            </div>
          </div>

          <div className="border-l p-6 md:p-8 lg:p-10" style={{ backgroundColor: themeStyles.panel, borderColor: themeStyles.border }}>
            <h2 className="text-lg font-semibold" style={{ color: themeStyles.text }}>
              What Prototype 6 adds
            </h2>
            <div className="mt-6 space-y-4">
              {[
                { icon: MessageSquare, title: "Shared chats page", text: "User chat and AI chat now live under one Chats workspace with clearly different tabs and UI behavior." },
                { icon: Users, title: "Joinable projects", text: "Public projects are instant-join. Private projects use request-based access. Every project gets its own room." },
                { icon: Bot, title: "AI-to-human handoff", text: "The assistant will be structured to suggest messaging a project owner, opening a room, or moving into community chat later." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border p-4" style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border }}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl p-2" style={{ backgroundColor: themeStyles.pill, color: themeStyles.primary }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: themeStyles.text }}>{item.title}</p>
                        <p className="mt-1 text-sm leading-6" style={{ color: themeStyles.muted }}>{item.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border p-4" style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border }}>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: themeStyles.muted }}>Preview profile</p>
              <div className="mt-3 flex items-center gap-3">
                {avatarType === "upload" && uploadedAvatarUrl ? (
                  <img src={uploadedAvatarUrl} alt="Avatar preview" className="h-14 w-14 rounded-2xl object-cover shadow-lg" />
                ) : (
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${selectedPreset?.gradient || "from-slate-400 to-slate-600"} text-2xl shadow-lg`}>
                    {selectedPreset?.emoji || deriveInitials(fullName || "User")}
                  </div>
                )}
                <div>
                  <p className="text-base font-semibold" style={{ color: themeStyles.text }}>{fullName || "Your name"}</p>
                  <p className="text-sm" style={{ color: themeStyles.muted }}>{currentLocation || "Location appears here"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  );

  const renderSigninPlan = () => (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8">
      <InfoCard themeStyles={themeStyles} className="p-6 md:p-8 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: themeStyles.pill, color: themeStyles.primary }}>
              <CreditCard className="h-4 w-4" />
              Access plan
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>
              Choose a Prototype 6 access plan
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: themeStyles.muted }}>
              This remains a prototype payment flow, but it is laid out to support a production-style onboarding sequence.
            </p>
          </div>
          <ThemeButton themeStyles={themeStyles} onClick={() => setAppStage("signin_profile")}>
            <ArrowLeft className="mr-2 inline h-4 w-4" />
            Back
          </ThemeButton>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {PLAN_OPTIONS.map((plan) => {
            const active = selectedPlan === plan.key;
            return (
              <button
                key={plan.key}
                type="button"
                onClick={() => setSelectedPlan(plan.key)}
                className="rounded-3xl border p-5 text-left transition"
                style={{
                  backgroundColor: active ? themeStyles.pill : themeStyles.card,
                  borderColor: active ? themeStyles.primary : themeStyles.border,
                  boxShadow: active ? themeStyles.shadow : "none",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: themeStyles.text }}>{plan.title}</p>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: themeStyles.text }}>{plan.price}</p>
                    <p className="mt-2 text-sm leading-6" style={{ color: themeStyles.muted }}>{plan.subtitle}</p>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: active ? themeStyles.primary : themeStyles.border, backgroundColor: active ? themeStyles.primary : "transparent", color: active ? themeStyles.primaryText : "transparent" }}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedPlan && selectedPlan !== "skip" ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: themeStyles.text }}>Cardholder name</label>
              <ThemeInput value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" themeStyles={themeStyles} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: themeStyles.text }}>Card number</label>
              <ThemeInput value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234 1234 1234 1234" themeStyles={themeStyles} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: themeStyles.text }}>Expiry</label>
              <ThemeInput value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM / YY" themeStyles={themeStyles} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: themeStyles.text }}>CVC</label>
              <ThemeInput value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123" themeStyles={themeStyles} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium" style={{ color: themeStyles.text }}>Billing address</label>
              <ThemeInput value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Street, city, region, postal code" themeStyles={themeStyles} />
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => selectedPlan && setAppStage("signin_confirmation")}
            className="rounded-2xl px-5 py-3 text-sm font-medium transition"
            style={{
              backgroundColor: themeStyles.primary,
              color: themeStyles.primaryText,
              opacity: selectedPlan ? 1 : 0.45,
              pointerEvents: selectedPlan ? "auto" : "none",
            }}
          >
            Continue
          </button>
          <span className="text-sm" style={{ color: themeStyles.muted }}>Selected: {planLabel}</span>
        </div>
      </InfoCard>
    </div>
  );

  const renderSigninConfirmation = () => (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 lg:px-8">
      <InfoCard themeStyles={themeStyles} className="p-6 md:p-8 lg:p-10">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>
              You’re ready for Prototype 6
            </h1>
            <p className="mt-3 text-sm leading-6" style={{ color: themeStyles.muted }}>
              Your profile, location, and access plan are ready. The next step opens the app with project joins, a shared chats page, and the AI assistant workspace.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border p-4" style={{ backgroundColor: themeStyles.panel, borderColor: themeStyles.border }}>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: themeStyles.muted }}>Profile</p>
                <p className="mt-2 text-sm font-medium" style={{ color: themeStyles.text }}>{currentUser.fullName}</p>
                <p className="mt-1 text-sm" style={{ color: themeStyles.muted }}>{email} · {phone}</p>
              </div>
              <div className="rounded-2xl border p-4" style={{ backgroundColor: themeStyles.panel, borderColor: themeStyles.border }}>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: themeStyles.muted }}>Location + plan</p>
                <p className="mt-2 text-sm font-medium" style={{ color: themeStyles.text }}>{currentLocation || "No location selected"}</p>
                <p className="mt-1 text-sm" style={{ color: themeStyles.muted }}>{planLabel}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ThemeButton themeStyles={themeStyles} onClick={() => setAppStage("signin_plan")}>
                <ArrowLeft className="mr-2 inline h-4 w-4" />
                Back
              </ThemeButton>
              <button
                type="button"
                onClick={() => {
                  setAppStage("app");
                  setPage("home");
                  addActivity("Completed Prototype 6 onboarding");
                }}
                className="rounded-2xl px-5 py-3 text-sm font-medium transition"
                style={{ backgroundColor: themeStyles.primary, color: themeStyles.primaryText }}
              >
                Enter prototype
              </button>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  );

  const renderHomePage = () => (
    <div className="space-y-6">
      <InfoCard themeStyles={themeStyles} className="overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: themeStyles.pill, color: themeStyles.primary }}>
              <Sparkles className="h-4 w-4" />
              Prototype 6 workspace
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>
              Join projects, meet people, and coordinate through shared chat
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7" style={{ color: themeStyles.muted }}>
              Prototype 6 expands the original matching app with project membership, direct messaging, project rooms, a shared global community chat, and a premium AI assistant tab.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ThemeButton themeStyles={themeStyles} onClick={() => setPage("projects")}>
                <FolderKanban className="mr-2 inline h-4 w-4" />
                Browse projects
              </ThemeButton>
              <ThemeButton themeStyles={themeStyles} onClick={() => setPage("chats")} active>
                <MessageSquare className="mr-2 inline h-4 w-4" />
                Open chats
              </ThemeButton>
              <ThemeButton themeStyles={themeStyles} onClick={() => setPage("questionnaire")}>
                <PenSquare className="mr-2 inline h-4 w-4" />
                {questionnaireComplete ? "Review questionnaire" : "Complete questionnaire"}
              </ThemeButton>
            </div>
          </div>
          <div className="border-l p-6 md:p-8" style={{ backgroundColor: themeStyles.panel, borderColor: themeStyles.border }}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { label: "Joined projects", value: `${joinedSharedProjects.length + userProjects.length}`, icon: CheckCircle2 },
                { label: "Saved favorites", value: `${favoriteProjects.length}`, icon: Heart },
                { label: "Questionnaire progress", value: `${questionnaireProgressPercent}%`, icon: Compass },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border p-4" style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm" style={{ color: themeStyles.muted }}>{item.label}</p>
                      <Icon className="h-4 w-4" style={{ color: themeStyles.primary }} />
                    </div>
                    <p className="mt-3 text-2xl font-semibold" style={{ color: themeStyles.text }}>{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </InfoCard>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <InfoCard themeStyles={themeStyles} className="p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: themeStyles.text }}>Project map</h2>
              <p className="mt-1 text-sm" style={{ color: themeStyles.muted }}>Use the map to explore nearby and recommended projects. Fullscreen mode keeps the project side panel.</p>
            </div>
            <ThemeButton themeStyles={themeStyles} onClick={() => setFullscreenMapOpen(true)}>Full screen</ThemeButton>
          </div>
          <div className="h-[360px] overflow-hidden rounded-3xl border" style={{ borderColor: themeStyles.border }}>
            <ProjectMap
              projects={miniMapProjects}
              highlightedIds={projectsPageHighlightedIds}
              activeProjectId={activeMapProject?.id ?? null}
              onSelectProject={(project) => { setActiveMapProject(project); addActivity(`Focused map on ${project.title}`); }}
              mode="mini"
            />
          </div>
          {activeMapProject ? (
            <div className="mt-4 rounded-2xl border p-4" style={{ backgroundColor: themeStyles.panel, borderColor: themeStyles.border }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: themeStyles.text }}>{activeMapProject.title}</p>
                  <p className="mt-1 text-sm" style={{ color: themeStyles.muted }}>{activeMapProject.location}</p>
                </div>
                <ThemeButton themeStyles={themeStyles} onClick={() => openProjectDetail(activeMapProject)}>
                  Open project
                </ThemeButton>
              </div>
            </div>
          ) : null}
        </InfoCard>

        <div className="space-y-6">
          <InfoCard themeStyles={themeStyles} className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: themeStyles.text }}>Recommended next steps</h2>
              <Star className="h-5 w-5" style={{ color: "#f59e0b" }} />
            </div>
            <div className="mt-4 space-y-3">
              {recommendedProjects.slice(0, 3).map((project) => (
                <button key={project.id} type="button" onClick={() => openProjectDetail(project)} className="w-full rounded-2xl border p-4 text-left transition" style={{ borderColor: themeStyles.border, backgroundColor: themeStyles.panel }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: themeStyles.text }}>{project.title}</p>
                      <p className="mt-1 text-sm" style={{ color: themeStyles.muted }}>{project.location}</p>
                    </div>
                    <span className="rounded-full px-2 py-1 text-[11px] font-medium" style={{ backgroundColor: themeStyles.pill, color: themeStyles.muted }}>{project.privacy}</span>
                  </div>
                </button>
              ))}
              {recommendedProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm" style={{ borderColor: themeStyles.border, color: themeStyles.muted }}>
                  Complete the adaptive questionnaire to unlock stronger recommendations.
                </div>
              ) : null}
            </div>
          </InfoCard>

          <InfoCard themeStyles={themeStyles} className="p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: themeStyles.text }}>Global community chat</h2>
                <p className="mt-1 text-sm" style={{ color: themeStyles.muted }}>Opt in to join the all-member community room.</p>
              </div>
              <ThemeButton themeStyles={themeStyles} active={globalChatOptIn} onClick={() => { setGlobalChatOptIn((prev) => !prev); addActivity(globalChatOptIn ? "Left global community chat" : "Opted into global community chat"); }}>
                {globalChatOptIn ? "Opted in" : "Opt in"}
              </ThemeButton>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );

  const renderFavoritesPage = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>Favorites</h1>
        <p className="mt-2 text-sm" style={{ color: themeStyles.muted }}>Your saved shared projects live here.</p>
      </div>
      {favoriteProjects.length > 0 ? (
        <div className="space-y-4">
          {favoriteProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              themeStyles={themeStyles}
              isFavorite={favoriteProjectIds.includes(project.id)}
              onToggleFavorite={() => toggleFavorite(project.id, project.title)}
              onOpen={() => openProjectDetail(project)}
              onJoin={project.joinStatus === "not_joined" ? () => handleJoinProject(project) : undefined}
              onOpenChat={project.joinStatus === "joined" ? () => openProjectChat(project) : undefined}
            />
          ))}
        </div>
      ) : (
        <InfoCard themeStyles={themeStyles} className="p-8 text-center">
          <Heart className="mx-auto h-8 w-8" style={{ color: themeStyles.muted }} />
          <p className="mt-4 text-base font-medium" style={{ color: themeStyles.text }}>No favorites yet</p>
          <p className="mt-2 text-sm" style={{ color: themeStyles.muted }}>Save projects from Explore to review them later.</p>
        </InfoCard>
      )}
    </div>
  );

  const renderProjectsPage = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>Projects</h1>
          <p className="mt-2 text-sm" style={{ color: themeStyles.muted }}>Prototype 6 supports public joins, private join requests, project rooms, and joined-project tracking.</p>
        </div>
        <div className="flex gap-3">
          <ThemeButton themeStyles={themeStyles} active={projectsTab === "explore"} onClick={() => setProjectsTab("explore")}>Explore</ThemeButton>
          <ThemeButton themeStyles={themeStyles} active={projectsTab === "my_projects"} onClick={() => setProjectsTab("my_projects")}>My projects</ThemeButton>
        </div>
      </div>

      {projectsTab === "explore" ? (
        <>
          <InfoCard themeStyles={themeStyles} className="p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <input
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                placeholder="Search by title, location, category, creator, or tag"
                className={`w-full max-w-xl rounded-2xl border py-3 px-4 text-sm outline-none ${placeholderClass}`}
                style={{ backgroundColor: themeStyles.panel, color: themeStyles.text, borderColor: themeStyles.border }}
              />
              <ThemeButton themeStyles={themeStyles} onClick={() => setFullscreenMapOpen(true)}>Open full map</ThemeButton>
            </div>
            <div className="mt-5 h-[360px] overflow-hidden rounded-3xl border" style={{ borderColor: themeStyles.border }}>
              <ProjectMap
                projects={publicProjectsFiltered}
                highlightedIds={projectsPageHighlightedIds}
                activeProjectId={activeMapProject?.id ?? null}
                onSelectProject={(project) => setActiveMapProject(project)}
                mode="mini"
              />
            </div>
          </InfoCard>

          <div className="space-y-4">
            {publicProjectsFiltered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                themeStyles={themeStyles}
                isFavorite={favoriteProjectIds.includes(project.id)}
                onToggleFavorite={() => toggleFavorite(project.id, project.title)}
                onOpen={() => openProjectDetail(project)}
                onJoin={project.joinStatus === "not_joined" ? () => handleJoinProject(project) : undefined}
                onOpenChat={project.joinStatus === "joined" ? () => openProjectChat(project) : undefined}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <ThemeButton themeStyles={themeStyles} active={membershipFilter === "all"} onClick={() => setMembershipFilter("all")}>All</ThemeButton>
              <ThemeButton themeStyles={themeStyles} active={membershipFilter === "created"} onClick={() => setMembershipFilter("created")}>Created</ThemeButton>
              <ThemeButton themeStyles={themeStyles} active={membershipFilter === "joined"} onClick={() => setMembershipFilter("joined")}>Joined</ThemeButton>
            </div>
            <ThemeButton themeStyles={themeStyles} onClick={() => setShowCreateForm((prev) => !prev)}>
              <Plus className="mr-2 inline h-4 w-4" />
              {showCreateForm ? "Close form" : "Create project"}
            </ThemeButton>
          </div>

          {showCreateForm ? (
            <InfoCard themeStyles={themeStyles} className="p-5 md:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: themeStyles.text }}>Project title</label>
                  <ThemeInput value={projectForm.title} onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Ex: Desert Family Build Collective" themeStyles={themeStyles} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: themeStyles.text }}>Location label</label>
                  <ThemeInput value={projectForm.location} onChange={(e) => setProjectForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Ex: San Diego County, California" themeStyles={themeStyles} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: themeStyles.text }}>Category</label>
                  <ThemeSelect value={projectForm.category} onChange={(e) => setProjectForm((prev) => ({ ...prev, category: e.target.value as UserProjectForm["category"] }))} options={[...myProjectCategories]} placeholder="Select category" themeStyles={themeStyles} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: themeStyles.text }}>Project privacy</label>
                  <ThemeSelect value={projectForm.visibility} onChange={(e) => setProjectForm((prev) => ({ ...prev, visibility: e.target.value as UserProjectForm["visibility"] }))} options={["public", "private"]} placeholder="Select privacy" themeStyles={themeStyles} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium" style={{ color: themeStyles.text }}>Description</label>
                  <ThemeInput value={projectForm.description} onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Describe the project, who it is for, and what makes it different." themeStyles={themeStyles} multiline />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium" style={{ color: themeStyles.text }}>Tags</label>
                  <ThemeInput value={projectForm.tags} onChange={(e) => setProjectForm((prev) => ({ ...prev, tags: e.target.value }))} placeholder="family, off-grid, build, land, education" themeStyles={themeStyles} />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={createProject} className="rounded-2xl px-5 py-3 text-sm font-medium transition" style={{ backgroundColor: themeStyles.primary, color: themeStyles.primaryText }}>
                  Save project
                </button>
                <ThemeButton themeStyles={themeStyles} onClick={() => setShowCreateForm(false)}>Cancel</ThemeButton>
              </div>
            </InfoCard>
          ) : null}

          {myProjectsCollection.length > 0 ? (
            <div className="space-y-4">
              {myProjectsCollection.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  themeStyles={themeStyles}
                  isFavorite={favoriteProjectIds.includes(project.id)}
                  onToggleFavorite={() => toggleFavorite(project.id, project.title)}
                  onOpen={() => openProjectDetail(project)}
                  onOpenChat={() => openProjectChat(project)}
                />
              ))}
            </div>
          ) : (
            <InfoCard themeStyles={themeStyles} className="p-8 text-center">
              <FolderKanban className="mx-auto h-8 w-8" style={{ color: themeStyles.muted }} />
              <p className="mt-4 text-base font-medium" style={{ color: themeStyles.text }}>No projects here yet</p>
              <p className="mt-2 text-sm" style={{ color: themeStyles.muted }}>Create a new project or join one from Explore. Created and joined projects appear together here.</p>
            </InfoCard>
          )}
        </>
      )}
    </div>
  );

  const renderChatsPage = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>Chats</h1>
          <p className="mt-2 text-sm" style={{ color: themeStyles.muted }}>User chat and AI chat now share one workspace with clearly separated tabs.</p>
        </div>
        <div className="flex gap-3">
          <ThemeButton themeStyles={themeStyles} active={chatsTab === "user"} onClick={() => setChatsTab("user")}>User chat</ThemeButton>
          <ThemeButton themeStyles={themeStyles} active={chatsTab === "ai"} onClick={() => setChatsTab("ai")}>AI chat</ThemeButton>
        </div>
      </div>

      <InfoCard themeStyles={themeStyles} className="p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: themeStyles.text }}>Global community chat access</h2>
            <p className="mt-1 text-sm" style={{ color: themeStyles.muted }}>Users must opt in before joining the all-member community room. Project rooms and direct chats remain separate.</p>
          </div>
          <ThemeButton themeStyles={themeStyles} active={globalChatOptIn} onClick={() => setGlobalChatOptIn((prev) => !prev)}>
            {globalChatOptIn ? "Opted in" : "Opt in now"}
          </ThemeButton>
        </div>
      </InfoCard>

      {chatsTab === "user" ? (
        <ChatLayout
          showContentOnMobile={showConversationPaneOnMobile}
          sidebar={
            <ConversationList
              conversations={availableUserConversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={(conversationId) => {
                setSelectedConversationId(conversationId);
                setShowConversationPaneOnMobile(true);
              }}
              searchQuery={userChatSearchQuery}
              onSearchQueryChange={setUserChatSearchQuery}
            />
          }
          content={
            <UserChatPanel
              selectedConversation={selectedConversation}
              messages={selectedConversationMessages}
              currentUserId={CURRENT_USER_ID}
              draft={userChatDraft}
              onDraftChange={setUserChatDraft}
              onSend={sendUserMessage}
              onBack={() => setShowConversationPaneOnMobile(false)}
              showBack={showConversationPaneOnMobile}
              typingLabel={typingConversationId && typingConversationId === selectedConversationId ? `${selectedConversation?.title || "Conversation"} is typing…` : null}
              loading={userChatLoading}
            />
          }
        />
      ) : (
        <AiChatPanel
          messages={aiMessages}
          draft={aiDraft}
          onDraftChange={setAiDraft}
          onSend={sendAiMessage}
          onRetry={handleRetryAiByMessage}
          onCopy={copyAssistantMessage}
          loading={aiLoading}
          typingLabel={aiTypingLabel}
        />
      )}
    </div>
  );

  const renderSettingsPage = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>Settings</h1>
        <p className="mt-2 text-sm" style={{ color: themeStyles.muted }}>Adjust appearance, notifications, and live presence settings.</p>
      </div>
      <InfoCard themeStyles={themeStyles} className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold" style={{ color: themeStyles.text }}>Theme mode</p>
            <p className="mt-1 text-sm" style={{ color: themeStyles.muted }}>Switch between light and dark interface states.</p>
          </div>
          <div className="flex gap-3">
            <ThemeButton themeStyles={themeStyles} active={theme === "light"} onClick={() => setTheme("light")}><Sun className="mr-2 inline h-4 w-4" />Light</ThemeButton>
            <ThemeButton themeStyles={themeStyles} active={theme === "dark"} onClick={() => setTheme("dark")}><Moon className="mr-2 inline h-4 w-4" />Dark</ThemeButton>
          </div>
        </div>
      </InfoCard>
      <InfoCard themeStyles={themeStyles} className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold" style={{ color: themeStyles.text }}>Notifications</p>
            <p className="mt-1 text-sm" style={{ color: themeStyles.muted }}>Enable or disable in-app activity alerts for the prototype.</p>
          </div>
          <button type="button" onClick={() => setNotificationsEnabled((prev) => !prev)} className="rounded-2xl px-4 py-2.5 text-sm font-medium transition" style={{ backgroundColor: notificationsEnabled ? themeStyles.primary : themeStyles.card, color: notificationsEnabled ? themeStyles.primaryText : themeStyles.text, border: `1px solid ${notificationsEnabled ? themeStyles.primary : themeStyles.border}` }}>
            {notificationsEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </InfoCard>
      <InfoCard themeStyles={themeStyles} className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold" style={{ color: themeStyles.text }}>Presence tracking</p>
            <p className="mt-1 text-sm" style={{ color: themeStyles.muted }}>Prototype 6 is structured for real backend presence tracking, but currently shows only online or offline state.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm" style={{ borderColor: themeStyles.border, color: themeStyles.text }}>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Online
          </div>
        </div>
      </InfoCard>
    </div>
  );

  const renderAccountInfoPage = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>Account Info</h1>
        <p className="mt-2 text-sm" style={{ color: themeStyles.muted }}>Your prototype profile, membership, and setup summary.</p>
      </div>
      <InfoCard themeStyles={themeStyles} className="p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border p-4" style={{ borderColor: themeStyles.border }}>
            <p className="text-sm" style={{ color: themeStyles.muted }}>Full name</p>
            <p className="mt-2 text-base font-semibold" style={{ color: themeStyles.text }}>{currentUser.fullName}</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: themeStyles.border }}>
            <p className="text-sm" style={{ color: themeStyles.muted }}>Email</p>
            <p className="mt-2 text-base font-semibold" style={{ color: themeStyles.text }}>{email || "Not set"}</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: themeStyles.border }}>
            <p className="text-sm" style={{ color: themeStyles.muted }}>Phone</p>
            <p className="mt-2 text-base font-semibold" style={{ color: themeStyles.text }}>{phone || "Not set"}</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: themeStyles.border }}>
            <p className="text-sm" style={{ color: themeStyles.muted }}>Location</p>
            <p className="mt-2 text-base font-semibold" style={{ color: themeStyles.text }}>{currentLocation || "Not set"}</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: themeStyles.border }}>
            <p className="text-sm" style={{ color: themeStyles.muted }}>Plan</p>
            <p className="mt-2 text-base font-semibold" style={{ color: themeStyles.text }}>{planLabel}</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: themeStyles.border }}>
            <p className="text-sm" style={{ color: themeStyles.muted }}>Global chat</p>
            <p className="mt-2 text-base font-semibold" style={{ color: themeStyles.text }}>{globalChatOptIn ? "Opted in" : "Not joined"}</p>
          </div>
        </div>
      </InfoCard>
    </div>
  );

  const renderAnswersSummaryPage = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>Answers Summary</h1>
          <p className="mt-2 text-sm" style={{ color: themeStyles.muted }}>Review all adaptive questionnaire answers grouped by category.</p>
        </div>
        <ThemeButton themeStyles={themeStyles} onClick={() => setPage("questionnaire")}>
          <PenSquare className="mr-2 inline h-4 w-4" />
          Edit answers
        </ThemeButton>
      </div>
      {categoryOrder.map((category) => {
        const items = groupedSummary[category];
        if (!items || items.length === 0) return null;
        return (
          <InfoCard key={category} themeStyles={themeStyles} className="p-5 md:p-6">
            <h2 className="text-lg font-semibold" style={{ color: themeStyles.text }}>{category}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border p-4" style={{ backgroundColor: themeStyles.panel, borderColor: themeStyles.border }}>
                  <p className="text-sm font-medium" style={{ color: themeStyles.text }}>{item.label}</p>
                  <p className="mt-2 text-sm leading-6" style={{ color: themeStyles.muted }}>{item.value}</p>
                </div>
              ))}
            </div>
          </InfoCard>
        );
      })}
    </div>
  );

  const renderQuestionnairePage = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>Adaptive questionnaire</h1>
          <p className="mt-2 text-sm" style={{ color: themeStyles.muted }}>The questions shift based on your location and earlier answers.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium" style={{ color: themeStyles.text }}>{answeredCount} / {adaptiveQuestions.length} answered</p>
          <p className="mt-1 text-sm" style={{ color: themeStyles.muted }}>{questionnaireProgressPercent}% complete</p>
        </div>
      </div>
      <InfoCard themeStyles={themeStyles} className="p-5 md:p-6">
        <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: themeStyles.pill }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${questionnaireProgressPercent}%`, backgroundColor: themeStyles.primary }} />
        </div>
        {currentQuestion ? (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: themeStyles.muted }}>{currentQuestion.category}</p>
            <h2 className="mt-3 text-xl font-semibold" style={{ color: themeStyles.text }}>{currentQuestion.label}</h2>
            <div className="mt-6">
              {currentQuestion.type === "select" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {(currentQuestion.options || []).map((option) => {
                    const active = questionnaireAnswers[currentQuestion.id] === option;
                    return (
                      <button key={option} type="button" onClick={() => updateAnswer(currentQuestion.id, option)} className="rounded-2xl border p-4 text-left transition" style={{ backgroundColor: active ? themeStyles.pill : themeStyles.card, borderColor: active ? themeStyles.primary : themeStyles.border }}>
                        <p className="text-sm font-medium" style={{ color: themeStyles.text }}>{option}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <ThemeInput value={questionnaireAnswers[currentQuestion.id] || ""} onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)} placeholder={currentQuestion.placeholder} themeStyles={themeStyles} multiline />
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <ThemeButton themeStyles={themeStyles} onClick={() => setQuestionnaireStep((prev) => Math.max(prev - 1, 0))}>Previous</ThemeButton>
              <ThemeButton themeStyles={themeStyles} onClick={() => setQuestionnaireStep((prev) => Math.min(prev + 1, adaptiveQuestions.length - 1))}>Next</ThemeButton>
              <button type="button" onClick={() => questionnaireComplete && setPage("answers_summary")} className="rounded-2xl px-5 py-3 text-sm font-medium transition" style={{ backgroundColor: themeStyles.primary, color: themeStyles.primaryText, opacity: questionnaireComplete ? 1 : 0.45, pointerEvents: questionnaireComplete ? "auto" : "none" }}>
                Finish questionnaire
              </button>
            </div>
          </div>
        ) : null}
      </InfoCard>
    </div>
  );

  const renderProjectDetailPage = () => (
    <ProjectDetailCard
      project={selectedProject}
      isFavorite={selectedProject ? favoriteProjectIds.includes(selectedProject.id) : false}
      themeStyles={themeStyles}
      onBack={() => setPage("projects")}
      onToggleFavorite={() => selectedProject && toggleFavorite(selectedProject.id, selectedProject.title)}
      onOpenChat={selectedProject ? () => openProjectChat(selectedProject) : undefined}
    />
  );

  let content: ReactNode = null;
  switch (page) {
    case "home":
      content = renderHomePage();
      break;
    case "favorites":
      content = renderFavoritesPage();
      break;
    case "projects":
      content = renderProjectsPage();
      break;
    case "chats":
      content = renderChatsPage();
      break;
    case "settings":
      content = renderSettingsPage();
      break;
    case "account_info":
      content = renderAccountInfoPage();
      break;
    case "answers_summary":
      content = renderAnswersSummaryPage();
      break;
    case "questionnaire":
      content = renderQuestionnairePage();
      break;
    case "project_detail":
      content = renderProjectDetailPage();
      break;
    default:
      content = renderHomePage();
  }

  if (appStage === "signin_profile") {
    return <div style={{ backgroundColor: themeStyles.appBg, minHeight: "100vh" }}>{renderSigninProfile()}</div>;
  }
  if (appStage === "signin_plan") {
    return <div style={{ backgroundColor: themeStyles.appBg, minHeight: "100vh" }}>{renderSigninPlan()}</div>;
  }
  if (appStage === "signin_confirmation") {
    return <div style={{ backgroundColor: themeStyles.appBg, minHeight: "100vh" }}>{renderSigninConfirmation()}</div>;
  }

  return (
    <div style={{ backgroundColor: themeStyles.appBg, minHeight: "100vh" }}>
      <div className="grid min-h-screen lg:grid-cols-[270px_1fr]">
        <aside className="border-r px-4 py-6 md:px-6" style={{ backgroundColor: themeStyles.panel, borderColor: themeStyles.border }}>
          <div className="flex items-center gap-3">
            {currentUser.avatarUploadUrl ? (
              <img src={currentUser.avatarUploadUrl} alt={`${currentUser.fullName} avatar`} className="h-11 w-11 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${currentUser.avatarGradient} font-semibold text-white shadow-lg`}>
                {currentUser.avatarLabel}
              </div>
            )}
            <div>
              <p className="text-base font-semibold" style={{ color: themeStyles.text }}>Prototype 6</p>
              <p className="text-sm" style={{ color: themeStyles.muted }}>Community + AI collaboration</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border p-4" style={{ borderColor: themeStyles.border, backgroundColor: themeStyles.card }}>
            <p className="text-sm font-semibold" style={{ color: themeStyles.text }}>{currentUser.fullName}</p>
            <div className="mt-2 inline-flex items-center gap-2 text-xs" style={{ color: themeStyles.muted }}>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Online
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPage(item.key)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition"
                  style={{ backgroundColor: active ? themeStyles.pill : "transparent", color: active ? themeStyles.text : themeStyles.muted }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
            <button type="button" onClick={() => setPage("questionnaire")} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition" style={{ backgroundColor: page === "questionnaire" ? themeStyles.pill : "transparent", color: page === "questionnaire" ? themeStyles.text : themeStyles.muted }}>
              <PenSquare className="h-4 w-4" />
              Questionnaire
            </button>
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-5 md:px-6 lg:px-8">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm" style={{ color: themeStyles.muted }}>Welcome back</p>
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: themeStyles.text }}>{currentUser.fullName}</h2>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>{currentLocation || "Complete your location to improve matches"}</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setNotificationsEnabled((prev) => !prev)} className="rounded-2xl border p-3 transition" style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border, color: notificationsEnabled ? themeStyles.text : themeStyles.muted }}>
                <Bell className="h-4 w-4" />
              </button>
              <div className="relative">
                <button type="button" onClick={() => setProfileMenuOpen((prev) => !prev)} className="flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition" style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border, color: themeStyles.text }}>
                  {currentUser.avatarUploadUrl ? (
                    <img src={currentUser.avatarUploadUrl} alt="Avatar" className="h-8 w-8 rounded-xl object-cover" />
                  ) : (
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${currentUser.avatarGradient} text-xs font-semibold text-white`}>
                      {avatarType === "preset" ? currentUser.avatarLabel : deriveInitials(currentUser.fullName)}
                    </div>
                  )}
                  <span className="hidden text-sm font-medium sm:inline">Profile</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {profileMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-60 rounded-2xl border p-2" style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border, boxShadow: themeStyles.shadow }}>
                    {[
                      { label: "Account info", key: "account_info" as const, icon: User },
                      { label: "Chats", key: "chats" as const, icon: MessageSquare },
                      { label: "Settings", key: "settings" as const, icon: Settings },
                    ].map((entry) => {
                      const Icon = entry.icon;
                      return (
                        <button key={entry.key} type="button" onClick={() => { setPage(entry.key); setProfileMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition" style={{ color: themeStyles.text }}>
                          <Icon className="h-4 w-4" />
                          {entry.label}
                        </button>
                      );
                    })}
                    <button type="button" onClick={() => { setAppStage("signin_profile"); setProfileMenuOpen(false); }} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition text-rose-500">
                      <ArrowLeft className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {content}
        </main>
      </div>

      {fullscreenMapOpen ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6" style={{ backgroundColor: "rgba(2, 6, 23, 0.78)" }}>
          <div role="dialog" aria-modal="true" className="flex h-[92vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-[32px] border" style={{ backgroundColor: themeStyles.panel, borderColor: themeStyles.border, boxShadow: "0 30px 80px rgba(0, 0, 0, 0.4)" }}>
            <div className="flex items-center justify-between gap-4 border-b px-6 py-4" style={{ borderColor: themeStyles.border }}>
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: themeStyles.text }}>Full project map</h2>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>All public projects are visible here. Search results stay highlighted.</p>
              </div>
              <ThemeButton themeStyles={themeStyles} onClick={() => setFullscreenMapOpen(false)}>
                <X className="mr-2 inline h-4 w-4" />
                Close map
              </ThemeButton>
            </div>
            <div className="grid min-h-0 flex-1 gap-4 p-6 lg:grid-cols-[1.4fr_0.6fr]">
              <InfoCard themeStyles={themeStyles} className="min-h-0 overflow-hidden p-3">
                <div className="h-full min-h-[520px] w-full">
                  <ProjectMap
                    projects={normalizedSharedProjects}
                    highlightedIds={projectSearchQuery.trim() ? projectsPageHighlightedIds : []}
                    activeProjectId={activeMapProject?.id ?? null}
                    onSelectProject={(project) => { setActiveMapProject(project); addActivity(`Selected ${project.title} on fullscreen map`); }}
                    mode="full"
                  />
                </div>
              </InfoCard>
              <InfoCard themeStyles={themeStyles} className="min-h-0 overflow-y-auto p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold" style={{ color: themeStyles.text }}>Map project preview</h3>
                  {projectSearchQuery && <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: themeStyles.pill, color: themeStyles.text }}>{publicProjectsFiltered.length} match{publicProjectsFiltered.length === 1 ? "" : "es"}</span>}
                </div>
                {activeMapProject ? (
                  <div className="flex h-full flex-col justify-between gap-4">
                    <div>
                      <div className="inline-flex rounded-full border px-3 py-1 text-xs" style={{ backgroundColor: themeStyles.pill, borderColor: themeStyles.border, color: themeStyles.muted }}>{activeMapProject.category}</div>
                      <h4 className="mt-4 text-xl font-semibold" style={{ color: themeStyles.text }}>{activeMapProject.title}</h4>
                      <div className={`mt-3 flex items-center gap-2 text-sm ${mutedTextClass}`}>
                        <MapPin className="h-4 w-4" />
                        <span>{activeMapProject.location}</span>
                      </div>
                      <p className={`mt-4 text-sm leading-7 ${mutedTextClass}`}>{activeMapProject.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activeMapProject.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs" style={{ backgroundColor: themeStyles.pill, borderColor: themeStyles.border, color: themeStyles.text }}>
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      {activeMapProject.joinStatus === "joined" ? (
                        <ThemeButton themeStyles={themeStyles} onClick={() => { setFullscreenMapOpen(false); openProjectChat(activeMapProject); }}>Open chat</ThemeButton>
                      ) : activeMapProject.joinStatus === "not_joined" ? (
                        <ThemeButton themeStyles={themeStyles} active onClick={() => handleJoinProject(activeMapProject)}>Join</ThemeButton>
                      ) : null}
                      <ThemeButton themeStyles={themeStyles} active onClick={() => { setFullscreenMapOpen(false); openProjectDetail(activeMapProject); }}>See details</ThemeButton>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-2xl border p-4 text-sm leading-7 ${mutedTextClass}`} style={{ borderColor: themeStyles.border, backgroundColor: themeStyles.pill }}>
                    Click any pin on the fullscreen map to open its project card here.
                  </div>
                )}
              </InfoCard>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

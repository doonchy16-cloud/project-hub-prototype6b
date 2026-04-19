# Prototype 6

Prototype 6 adds:
- joinable projects
- project-based chat rooms
- global community chat opt-in
- direct messages to project owners
- a shared Chats page with User and AI tabs
- avatar selection or upload during onboarding
- a mock AI route ready for future LLM integration

## Deploy

1. Install dependencies
2. Run `npm run dev`
3. Deploy to Vercel as a standard Next.js app

## Future backend integration

The current user-to-user chat is local-state based for demo safety.
It is structured so the next step can connect to Supabase, Firebase, or a custom API with real-time sync and presence.


## OpenAI setup

1. Add `OPENAI_API_KEY` to your Vercel environment variables.
2. Redeploy the project.
3. The AI chat route at `app/api/ai-chat/route.ts` will use OpenAI automatically when the key is present.

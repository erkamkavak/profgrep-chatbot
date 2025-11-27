<div align="center">

# Academic Professor Search (OpenAlex + mgrep)

Academic professor search and exploration app that uses OpenAlex for scholarly data and Mixedbread/mgrep for semantic search over professor profiles.

**Next.js • Vercel AI SDK • Shadcn/UI • Better Auth • Drizzle ORM**

</div>

> Based on the open-source [Sparka](https://github.com/FranciscoMoretti/sparka) GitHub repository.

## Quick Start

1. **Clone and Install**

   ```bash
   git clone https://github.com/erkamkavak/profgrep-chatbot.git
   cd profgrep-chatbot
   bun install
   ```

2. **Environment Setup**

   Create a `.env.local` and fill in the required values (see `.env.local` in this repo for a template):

   - **Required**

     - `DATABASE_URL` — Postgres connection string (used by Drizzle ORM)
     - `AUTH_SECRET` — Better Auth secret
     - `OPENROUTER_API_KEY` — server-side key for OpenRouter (primary LLM provider)
     - One auth provider (choose one pair):
       - `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`
       - `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`

   - **Professor search / mgrep (Mixedbread)**

     - `MIXEDBREAD_API_KEY` — Mixedbread API key for mgrep-style semantic stores
     - `MXBAI_STORE` — optional base store name (defaults to `mgrep` if unset)

   - **Optional extras from the base Sparka template**
     - `CRON_SECRET` — For the cleanup cron job
     - `REDIS_URL` - For resumable streams
     - `OPENAI_API_KEY` - Direct OpenAI access
     - `TAVILY_API_KEY` - Web search
     - `EXA_API_KEY` - Web search
     - `FIRECRAWL_API_KEY` - Web scraping
     - `SANDBOX_TEMPLATE_ID` - Code execution
     - `E2B_API_KEY` - E2B Code Interpreter
     - `LANGFUSE_PUBLIC_KEY` - Observability (Langfuse)
     - `LANGFUSE_SECRET_KEY` - Observability (Langfuse)
     - `LANGFUSE_BASE_URL` - Langfuse base URL (optional)

3. **Database Setup**

   ```bash
   bun run db:migrate
   ```

4. **Development Server**
   ```bash
   bun dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to start building.

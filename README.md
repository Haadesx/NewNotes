# AudioNotes 🎙️

I built **AudioNotes** because I wanted a reliable way to turn messy audio recordings—meetings, lectures, and brain dumps—into structured, trustworthy notes I could actually use.

Unlike generic transcription tools that just dump a wall of text, or AI wrappers that "hallucinate" facts, I designed this system to be verifying, cost-effective, and easy to use.

## ✨ What I Built

### Two Powerful Modes
1.  **Live Recording**: Real-time transcription and note generation as you speak. Perfect for capturing ideas or lectures in the moment.
2.  **File Upload**: Drag & drop existing audio files to process them asynchronously with high-accuracy models.

### Key Features
-   **🛡️ Anti-Hallucination**: I implemented a strict verification step where the AI must cite timestamps for every claim it makes. If it can't find the source in the transcript, it doesn't include it.
-   **💸 Cost-Optimized AI**: The app uses a "waterfall" strategy for LLMs. It prioritizes free/fast models (like Llama 3 on Groq) and only falls back to paid providers if necessary.
-   **📝 Structured Outputs**: Different modes (Meeting, Lecture, Interview, Brainstorm) generate different note formats tailored to the content.
-   **🔒 Local-First**: Your recordings and database live on your machine (SQLite + Local Files), keeping your data private.
-   **⏯️ Live-Sync**: In live mode, see the transcript and key points appear side-by-side in real-time.

## 🛠️ Tech Stack

I chose a modern, robust stack to build this:

-   **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide Icons.
-   **Backend**: Next.js API Routes.
-   **Database**: Prisma + SQLite (for persistent storage of notes and usage quotas).
-   **AI Processing**:
    -   **Transcription**: AssemblyAI (Async) & Web Speech API (Real-time).
    -   **LLMs**: Groq (Llama 3, Mixtral) & OpenRouter (DeepSeek, Gemini).
-   **State Management**: React Hooks for complex media handling (`useMicrophone`, `useLiveTranscription`).

## 🚀 Getting Started

If you want to run my project locally:

1.  **Clone the repo**
    ```bash
    git clone https://github.com/Haadesx/NewNotes.git
    cd NewNotes
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment**
    Create a `.env` file with your keys:
    ```env
    DATABASE_URL="file:./prisma/dev.db"
    GROQ_API_KEY="your_key"
    OPENROUTER_API_KEY="your_key"
    ASSEMBLYAI_API_KEY="your_key"
    ```

4.  **Run the Server**
    ```bash
    # Prepare the database
    npx prisma db push

    # Start the app
    npm run dev
    ```

5.  Open `http://localhost:3000` and start recording!

## 🔮 Future Plans

I'm planning to add:
-   Cloud sync for accessing notes across devices.
-   Deeper integration with Notion/Obsidian.
-   Speaker identification for live recordings.

---

*Built with ❤️ by Haadesx*

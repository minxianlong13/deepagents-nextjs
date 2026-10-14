# Files

- [Knowledge-Base Indexing and Grounded RAG](rag-knowledge-base.md) - How the web application selects and indexes local or remote documentation into Pinecone, then uses a Deep Agent, MCP tools, and retrieved chunk files to produce grounded answers.
- [Resume Tailoring Workflow](resume-tailoring.md) - Browser-to-Anthropic workflow that creates a role-focused Markdown resume from a bundled candidate profile, with input limits and prompt-level factuality and injection safeguards. It also distinguishes the active direct-generation path from the provisioned but unused PostgreSQL and pgvector resume models.
- [Web Search Conversations and Chat History](search-conversations.md) - End-to-end behavior of the browser search chat, its validated API routes, DeepAgents and Tavily research invocation, fallback behavior, and PostgreSQL conversation history. Documents the current local-user and client-provided conversation-ID trust boundaries.

# Files

- [Persistence, Vector Stores, and Data Ownership](persistence-and-schema.md) - PostgreSQL owns chat history and the optional candidate-profile vector corpus, while Pinecone is the active knowledge-base RAG store. This page documents the migration-backed relational schema, ownership and cascade rules, indexing lifecycle, and the boundaries between these stores.

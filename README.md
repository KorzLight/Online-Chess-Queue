# Online Chess Queue MVP

## Project Summary

**Project Goal:**
Create an online chess platform where a single player at a time plays against an AI (Stockfish), while other users watch in real-time. Each game affects the AI’s difficulty dynamically.

---

## Core Features (MVP)

1. **Single-player gameplay**

   * Only one user plays at a time.
   * Player moves are validated using chess rules.

2. **Queue system**

   * Additional users wait in line for their turn.
   * Queue updates dynamically as games finish.

3. **Spectator mode**

   * Multiple users can watch the current game in real-time.

4. **AI opponent (Stockfish)**

   * The AI plays against the current player.
   * Difficulty adjusts after each game:

     * Player win → AI becomes stronger
     * Player loss → AI becomes weaker
   * Skill level stays within a reasonable range (e.g., 5–18).

5. **Real-time updates**

   * Moves and board states broadcast to all spectators and the current player.
   * Can be implemented via WebSockets or a similar protocol.

---

## Optional/Advanced Features (Future)

* Player accounts, profiles, leaderboards, or chat.
* True AI learning beyond static difficulty adjustments.
* Mobile-friendly interface.
* Persistent database for queue history or stats.

---

## Technical Architecture (MVP)

**Backend (dynamic part):**

* Handles the queue, player moves, AI interactions, and spectators.
* Runs Stockfish AI as a separate process.
* Can be implemented in:

  * Node.js (with or without Express)
  * Python (FastAPI / Flask / websockets)

**Frontend (static part):**

* Displays chessboard and moves.
* Shows player role (active player or spectator).
* Can be hosted separately (e.g., on Cloudflare Pages, S3).

**Communication:**

* WebSockets (for real-time gameplay and spectator updates).

---

## Key Considerations

* Minimal viable product (MVP) approach: focus only on essential features first.
* Node.js and Express are optional; Python or another backend can be used.
* Hosting can be done on a free-tier VM or cloud provider, with frontend served via static hosting.
* Stockfish AI integration is central; the system must handle input/output to/from the engine.

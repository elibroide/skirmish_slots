# Tech Stack

## Engine

**Language:** TypeScript
- Type safety at compile time
- Better IDE support
- Easier refactoring

**State:** Mutable objects
- Simpler than immutable for prototype
- Faster performance
- Good enough for single-player/local multiplayer

**Events:** Custom EventEmitter
- Lightweight
- No external dependencies
- Tailored to our needs

**Testing:** Jest/Vitest
- Fast test execution
- Good TypeScript support
- Familiar API

---

## UI

**Framework:** React 18+
- Component-based
- Large ecosystem
- Easy to find developers

**State:** Zustand
- Lightweight (< 1KB)
- Simple API
- No boilerplate
- Better than Redux for this use case

**Animation:** Framer Motion
- Declarative animations
- Spring physics
- Easy to use
- Great documentation

**Styling:** Tailwind CSS
- Utility-first
- Fast development
- Consistent design
- No CSS files to manage

**Build:** Vite
- Fast hot reload
- Modern tooling
- Good TypeScript support
- Smaller bundle sizes than CRA

---

## AI

**HTTP:** Fetch API
- Native browser support
- No external library needed
- Standard promise-based API

**Rate Limiting:** Simple debounce
- Prevents API spam
- Easy to implement
- Good enough for prototype

**Caching:** Optional LRU cache
- Reduce API costs
- Faster responses
- Not critical for MVP

---

## Rationale

### Why TypeScript over JavaScript?
- Catch errors at compile time
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring

### Why Zustand over Redux?
- Much simpler API
- No boilerplate
- Smaller bundle size
- Easier to learn

### Why Framer Motion over CSS animations?
- Physics-based animations
- Easier to coordinate complex animations
- Better developer experience

### Why Vite over Create React App?
- Much faster hot reload
- Smaller bundles
- Modern tooling
- Better DX

---

**See Also:**
- [ProjectStructure.md](./ProjectStructure.md) - File organization

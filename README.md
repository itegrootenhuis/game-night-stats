# Game Night Stats

Track your game night statistics, see who wins the most, and settle debates with data.

## Features

- **Game Night Tracking** - Create game nights and log what games you play
- **Multiple Winners** - Support for team games with multiple winners
- **Player Stats** - See who dominates overall and per game
- **Dashboard** - Leaderboards, win rates, and filtering by player/game

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/game-night-stats.git
   cd game-night-stats
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your database connection string:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## License

MIT

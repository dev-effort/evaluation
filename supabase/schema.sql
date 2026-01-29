-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Developers table
CREATE TABLE developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Developer-Team junction table (many-to-many)
CREATE TABLE developer_teams (
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (developer_id, team_id)
);

-- Commits table
CREATE TABLE commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_id TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  developer_id UUID REFERENCES developers(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,

  -- Commit type: develop, meeting, chore
  type TEXT DEFAULT 'develop',

  -- Evaluation data
  evaluation_total INTEGER,
  evaluation_complexity INTEGER,
  evaluation_volume INTEGER,
  evaluation_thinking INTEGER,
  evaluation_others INTEGER,
  comment TEXT,

  -- Code stats
  lines_added INTEGER DEFAULT 0,    -- Number of lines added
  lines_deleted INTEGER DEFAULT 0,  -- Number of lines deleted

  -- Time data
  work_hours DECIMAL,           -- H: 6h -> 6
  ai_driven_minutes INTEGER,    -- ai driven: 30m -> 30
  productivity DECIMAL,         -- productivity: 1200% -> 1200

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_commits_developer_id ON commits(developer_id);
CREATE INDEX idx_commits_team_id ON commits(team_id);
CREATE INDEX idx_commits_created_at ON commits(created_at DESC);
CREATE INDEX idx_developers_team_id ON developers(team_id);
CREATE INDEX idx_developer_teams_developer_id ON developer_teams(developer_id);
CREATE INDEX idx_developer_teams_team_id ON developer_teams(team_id);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE commits ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read all data
CREATE POLICY "Allow read for authenticated" ON teams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated" ON developers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated" ON developer_teams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated" ON commits
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies: Allow service role to insert/update/delete (for API)
CREATE POLICY "Allow all for service role" ON teams
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow all for service role" ON developers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow all for service role" ON developer_teams
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow all for service role" ON commits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

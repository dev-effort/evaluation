---
description: Format and execute git commits with project conventions (prefix, scope, Jira ticket)
---

# Developer Configuration

**아래 정보를 본인 정보로 수정하세요:**

```
DEVELOPER_NAME: 홍길동
DEVELOPER_EMAIL: hong@example.com
TEAM_NAME: 프론트엔드팀
DASHBOARD_API_URL: https://your-project.supabase.co/functions/v1/submit-commit
DASHBOARD_API_KEY: JW819xGputODAp/SVyAlMH1sR9yP9Yk9XJ9Uesfvf1M=
```

---

You are an expert Git workflow assistant specialized in creating properly formatted commit messages following strict project conventions.

**IMPORTANT**: When submitting to the Dashboard API, use the configuration values defined above in the "Developer Configuration" section.

## Your Primary Responsibility
When files have been staged with `git add`, you will create and execute a git commit with a precisely formatted message, then submit the evaluation data to the dashboard API.

## Commit Message Format
```
git commit -m "<prefix>(<scope>): <commit message>

Refs: <jira-ticket>

evaluation: <total-score> (complexity: <n>, volume: <n>, thinking: <n>, others: <n>)
comment: <qualitative-evaluation>

H: <human-time>
ai driven: <ai-assisted-time>
productivity: <percentage>%"
```

## Format Rules

### Prefixes (choose one based on change type):
- `feat` - New features or functionality additions
- `fix` - Bug fixes or error corrections
- `chore` - Maintenance tasks, configuration changes, refactoring, dependencies

### Scope (based on module):
- `bo` - For admin/backoffice related changes
- `console` - For console/frontend related changes

### Jira Ticket Reference:
- Extract the Jira ticket ID (e.g., COM-100, COM-234) from the current branch name
- The branch name typically contains the ticket ID in format like `feature/COM-100-description` or `COM-100-feature-name`

## Evaluation Criteria

### Quantitative Evaluation (0-10 points total)
| Item | Description | Score Range |
|------|-------------|-------------|
| **complexity** | Task complexity based on 3-5 year junior developer standard | 0-4 |
| **volume** | Amount of changed code, files, lines | 0-2 |
| **thinking** | Design/architecture consideration time, decision complexity | 0-2 |
| **others** | Technology selection, test writing, documentation, etc. | 0-2 |

### Detailed Criteria

#### complexity (0-4):
- **0**: Simple typo fix, configuration change
- **1**: Simple bug fix, single file change
- **2**: Multiple file modifications, implementing following existing patterns
- **3**: New feature implementation, API integration, complex logic
- **4**: Architecture design, complex state management, performance optimization

#### volume (0-2):
- **0**: 1-10 lines changed
- **1**: 11-100 lines changed or 1-3 files
- **2**: 100+ lines changed or 4+ files

#### thinking (0-2):
- **0**: Immediately implementable
- **1**: Existing code analysis required
- **2**: Design review, comparing multiple approaches needed

#### others (0-2):
- **0**: No additional work
- **1**: New library/technology introduction
- **2**: Test writing, documentation, refactoring included

### Qualitative Evaluation (comment)
Write 1-2 sentences describing the core value, impact, and notable aspects of the work.

## Time Estimation Guidelines

### Definitions
- **H (Human time)**: Estimated time for a 3-5 year junior developer to complete the task solo
- **ai driven**: Estimated time when using AI tools
- **productivity**: (H / ai driven) × 100%

### Time Estimation Reference
| Complexity Score | Typical H Time |
|------------------|----------------|
| 0-2 | 30m - 2h |
| 3-4 | 2h - 4h |
| 5-6 | 4h - 8h (1 day) |
| 7-8 | 1-2 days |
| 9-10 | 2-5 days |

## Workflow

1. **Check staged files**: Run `git status` to verify files are staged and understand what's being committed

2. **Get branch name**: Run `git branch --show-current` to extract the Jira ticket ID

3. **Analyze changes**: Run `git diff --staged` to review staged changes and determine:
   - Appropriate prefix (feat/fix/chore/refactor)
   - Correct scope (bo/console) based on file paths or context
   - Concise, descriptive commit message

4. **Evaluate the work**: Based on the staged changes, evaluate:
   - **complexity**: Rate 0-4 based on task difficulty
   - **volume**: Rate 0-2 based on lines/files changed
   - **thinking**: Rate 0-2 based on design consideration required
   - **others**: Rate 0-2 based on additional work (tests, docs, etc.)
   - **comment**: Write a brief qualitative assessment
   - **H time**: Estimate time for a junior developer solo
   - **ai driven time**: Estimate time with AI assistance
   - **productivity**: Calculate percentage

5. **Execute commit**: Run `git add` if needed, then execute git commit with the formatted message including evaluation (no confirmation required)

6. **Get commit ID**: After successful commit, run `git rev-parse HEAD` to get the commit hash

7. **Submit to Dashboard API**: Send the evaluation data using the configuration from "Developer Configuration" section:

```bash
curl -X POST "{DASHBOARD_API_URL}" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: {DASHBOARD_API_KEY}" \
  -d '{
    "commit_id": "<commit-hash>",
    "message": "<commit-message>",
    "developer_name": "{DEVELOPER_NAME}",
    "developer_email": "{DEVELOPER_EMAIL}",
    "team_name": "{TEAM_NAME}",
    "evaluation": {
      "total": <total-score>,
      "complexity": <complexity-score>,
      "volume": <volume-score>,
      "thinking": <thinking-score>,
      "others": <others-score>
    },
    "comment": "<qualitative-evaluation>",
    "work_hours": <human-time-in-hours>,
    "ai_driven_minutes": <ai-time-in-minutes>,
    "productivity": <productivity-percentage>
  }'
```

8. **Show commit result**: Run `git status` to verify and show the commit summary and API submission result to the user

## Examples

```bash
# For a new feature in console module, branch: feature/COM-123-add-dashboard
git commit -m "feat(console): add dashboard analytics component

Refs: COM-123

evaluation: 6 (complexity: 3, volume: 2, thinking: 1, others: 0)
comment: New analytics dashboard with chart components and data fetching logic

H: 4h
ai driven: 40m
productivity: 600%"

# Get commit ID
COMMIT_ID=$(git rev-parse HEAD)

# Submit to dashboard API (using Developer Configuration values)
curl -X POST "https://your-project.supabase.co/functions/v1/submit-commit" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: JW819xGputODAp/SVyAlMH1sR9yP9Yk9XJ9Uesfvf1M=" \
  -d '{
    "commit_id": "'$COMMIT_ID'",
    "message": "feat(console): add dashboard analytics component",
    "developer_name": "홍길동",
    "developer_email": "hong@example.com",
    "team_name": "프론트엔드팀",
    "evaluation": {
      "total": 6,
      "complexity": 3,
      "volume": 2,
      "thinking": 1,
      "others": 0
    },
    "comment": "New analytics dashboard with chart components and data fetching logic",
    "work_hours": 4,
    "ai_driven_minutes": 40,
    "productivity": 600
  }'
```

## Important Guidelines

- Always verify staged files exist before attempting to commit
- If no Jira ticket is found in branch name, ask the user for the ticket ID
- If scope (bo/console) cannot be determined from file paths, ask the user
- Keep commit messages concise but descriptive (ideally under 72 characters for the first line)
- If the user provides specific commit message content, incorporate it while maintaining the format
- Handle edge cases gracefully: unstaged changes, detached HEAD, missing ticket ID
- If API submission fails, still report the successful commit but warn about the API error

## Error Handling

- If `git status` shows no staged changes, inform the user and suggest running `git add`
- If branch name doesn't contain a recognizable Jira ticket pattern, prompt for manual input
- If commit fails, report the error and suggest resolution steps
- If API submission fails, log the error but don't rollback the commit - the data can be submitted manually later

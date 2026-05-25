# Git Workflow For Interns

This is the simple process to follow for the Canovet repo.

## Rules

- Work on a branch, not on `main`.
- One task per branch.
- Push only after the feature is working.
- Open a pull request for review.
- Do not overwrite someone else’s changes.

## Branch Naming

- `backend-auth-intern1`
- `user-app-intern2`
- `admin-panel-intern3`

## First Time Setup

```bash
git clone <repo-url>
cd canovet
npm install
```

## Start A New Branch

```bash
git checkout main
git pull origin main
git checkout -b backend-auth-intern1
```

## Make Changes

- Edit only your assigned files.
- Test locally before committing.
- Keep commits small.

## Commit And Push

```bash
git add .
git commit -m "Add auth flow"
git push origin backend-auth-intern1
```

## Pull Request Flow

1. Push your branch.
2. Open a pull request on GitHub.
3. Add a short summary of what changed.
4. Wait for review.
5. Fix feedback on the same branch.

## If You Need Latest Changes From Main

```bash
git checkout main
git pull origin main
git checkout your-branch-name
git merge main
```

## What Not To Do

- Do not push directly to `main`.
- Do not delete files you did not create.
- Do not work in `node_modules`.
- Do not commit secrets.

## Suggested Division Of Work

- Intern 1: backend auth, partner accounts, rate limiting
- Intern 2: user app screens and booking flow
- Intern 3: admin panel and partner seeding UI


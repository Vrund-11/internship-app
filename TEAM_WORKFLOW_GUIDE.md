# Canovet Team Workflow Guide

Welcome to the Canovet team! We are using a simple branch-based Git workflow to ensure everyone can build features without overwriting each other's code. Since you will be using Antigravity AI to help you code, this guide will show you how to manage your work and collaborate effectively.

---

## 📋 Task Breakdown (Who is doing what)

To prevent code conflicts, you will each own a specific domain of the application:

### **Intern 1: Backend & Core Systems**
**Focus:** Backend auth, partner accounts API, slot generation logic, and rate limiting.
**Key Areas:**
- `backend/` directory
- Auth providers (`useAuth`, `AuthProvider`)
- Core logic (`isSlotAvailable()`, `getDistanceKm()`, `generateSlots()`)

### **Intern 2: User App (Frontend)**
**Focus:** User app screens, booking flow UX, profile management, and the AI Assistant chat.
**Key Areas:**
- `apps/user-app/` directory
- Layouts (`Navbar`, `ProtectedLayout`)
- Feature components (`ProfilePage`, `askSlots()`, `addBot()`)

### **Intern 3: Partner App & Admin Tools**
**Focus:** Partner simulator (`partner-sim`), admin panel UI, and partner seeding logic.
**Key Areas:**
- `apps/partner-sim/` directory
- Admin dashboard pages
- Mock data seeding UI

---

## 🤖 Using Antigravity AI

When you receive a task, you will use Antigravity AI to help write the code. 
1. **Prompting:** Give the AI a clear, specific prompt about the task you are trying to accomplish. Let it know which files you want it to modify.
2. **Review:** Let the AI write the code. Once it's done, **always test it locally** in your browser (`npm run dev`) or via API requests before committing.
3. **Graphify:** If you make significant architecture changes, run `graphify update .` to keep the project's knowledge graph up to date!

---

## 🐙 Git & GitHub Workflow (Step-by-Step)

Follow these exact steps for **every new feature or bug fix** you work on.

### 1. Get the Latest Code
Always start from the `main` branch and ensure it is up to date before starting new work.
```bash
git checkout main
git pull origin main
```

### 2. Create a New Branch for Your Task
Never work directly on `main`. Create a new branch named after your task. Include your name or initials to make it easy to identify.
```bash
# Format: git checkout -b feature-name-yourname
git checkout -b auth-flow-intern1
```

### 3. Write Code (with AI) & Test Locally
Work on your files. Test the changes locally. 

### 4. Stage and Commit Your Changes
Once your feature works, save it to Git. Keep your commits small and focused.
```bash
# Add all changed files
git add .

# Write a descriptive commit message
git commit -m "Added user login endpoint and token generation"
```

### 5. Push Your Branch to GitHub
Send your branch from your local computer to the GitHub server.
```bash
git push -u origin auth-flow-intern1
```

### 6. Open a Pull Request (PR)
1. Go to the Canovet repository on GitHub in your web browser.
2. You will see a green button that says **"Compare & pull request"** next to your recently pushed branch. Click it.
3. Add a title and description explaining what you built and how to test it.
4. Click **"Create pull request"**.

---

## 👀 For the Manager (How to Review and Merge)

As the manager, your job is to review the code the interns submit via Pull Requests.

1. Go to the **Pull Requests** tab on GitHub.
2. Click on an open PR.
3. Go to the **Files changed** tab to see exactly what code was added or deleted.
4. If it looks good, click **Review changes** -> **Approve**.
5. Finally, click the big green **"Merge pull request"** button to bring their code into the `main` branch.
6. Once merged, tell the team to run `git checkout main` and `git pull origin main` so they get the new updates!

---

## 🚨 Fixing Merge Conflicts

If two people edit the exact same line of code in the same file, Git won't know which one to keep. This is a merge conflict.

**If you get a merge conflict while pulling `main` into your branch:**
1. Open the conflicting file in your code editor (like VS Code). 
2. You will see markers like `<<<<<<< HEAD` and `======` and `>>>>>>> main`.
3. Choose which code to keep, delete the markers, and save the file.
4. Run:
```bash
git add .
git commit -m "Resolved merge conflicts"
git push origin your-branch-name
```
*(If you get stuck here, ask Antigravity AI to help you resolve the conflict!)*

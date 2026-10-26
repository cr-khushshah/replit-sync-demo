# Cloning a Replit project that already has git

This guide is for a Repl that already has its own git history. That history may come from Replit Agent checkpoints or from someone who has worked in the Repl already. The goal is to get that history onto your local machine, develop there, and sync changes back to Replit.

You never clone straight from Replit. A Repl's git repo can't be reached from outside Replit, so GitHub (or a bundle file) sits in the middle:

```
Replit (.git)  ──push──▶  GitHub  ──clone──▶  Local
      ▲                     │
      └────────pull─────────┘
```

---

## Step 1: Inspect the Repl's git state

Open the **Shell** tab in the Repl and run:

```bash
git status                 # are there uncommitted changes?
git branch -a              # which branch is it on (main or master)?
git remote -v              # is a GitHub remote already set up?
git log --oneline -10      # recent history
```

The output of `git remote -v` tells you which case you're in:

| `git remote -v` shows | Your case |
|---|---|
| `origin  https://github.com/...` | **Case A**: already connected to GitHub |
| nothing | **Case B**: local git only, with no remote |
| You can't or don't want to use GitHub | **Case C**: bundle file |

## Step 2: Clean up before sharing the history

Do this in the Replit Shell whichever case you're in.

1. **Check that no secrets are committed:**
   ```bash
   git ls-files | grep -iE '\.env$|secret|credential|\.pem$'
   ```
   If this finds anything, remove it from git and add it to `.gitignore`. If the repo will be public, also rotate those secrets, because they're still in the history.
2. **Check `.gitignore`.** Replit and Agent sometimes commit tool folders. Make sure it contains at least:
   ```
   node_modules/
   .env
   .cache/
   .upm/
   .local/
   .config/
   ```
   If those folders are already tracked, untrack them: `git rm -r --cached .cache .upm .local .config`.
3. **Commit anything left over:**
   ```bash
   git add -A && git commit -m "Prepare repo for local development"
   ```
4. **Keep `.replit` and `replit.nix` tracked.** Replit needs them to run and deploy the app.

## Step 3: Get the history onto GitHub

### Case A: Already connected to GitHub
Push the latest commits so GitHub matches the Repl exactly:
```bash
git push origin main
```
You can also use the **Git** pane: **Push**. Then go to Step 4.

### Case B: Local git only, no remote
1. Create an **empty** repo on GitHub, with no README, license or `.gitignore`. A non-empty repo has unrelated history, and the first push gets rejected.
   - From your local machine: `gh repo create <name> --private`
   - Or create it in the GitHub web UI.
2. Connect it in Replit. The easiest way is the **Git** pane: **Connect to GitHub**, then pick the new repo.
   If you'd rather use the Shell, the Git pane handles authentication for you once you've connected GitHub there:
   ```bash
   git remote add origin https://github.com/<you>/<name>.git
   git push -u origin main
   ```
3. On GitHub, check that the commit count and the latest commit match `git log` in Replit.

> If the push gets rejected because the GitHub repo already had a commit, run `git pull origin main --allow-unrelated-histories`, resolve any conflicts, then push again. Don't force-push unless you're sure the GitHub side has nothing worth keeping.

### Case C: No GitHub (bundle file)
This is useful for a one-time copy, or a client repo you can't push anywhere yet.
1. In the Replit Shell:
   ```bash
   git bundle create repo.bundle --all
   ```
2. Download `repo.bundle` from the Files panel (right-click, then **Download**).
3. Locally:
   ```bash
   git clone repo.bundle my-project
   ```
4. Delete `repo.bundle` from the Repl.

A bundle keeps the full history, but it's a snapshot. Ongoing two-way sync still needs a shared remote, so move to Case B when you can.

## Step 4: Clone and set up locally

```bash
cd /home/creole/Khush-Creole
gh repo clone <you>/<name> my-project      # or: git clone https://github.com/<you>/<name>.git
cd my-project

# Use your own identity for this repo
git config user.name  "Khush Shah"
git config user.email "khush.shah@creolestudios.com"

# Match the runtime in .replit (e.g. modules = ["nodejs-20"])
nvm install 20 && nvm use 20

# Recreate secrets: copy each key from Replit → Tools → Secrets
cp .env.example .env        # create .env.example first if the project has none

npm ci                      # install the exact versions from the lockfile
npm run dev
```

**Check that local and Replit are on the same commit.** Run this in both places and compare the output:
```bash
git rev-parse --short HEAD
```

## Step 5: Ongoing sync

```
local branch → push → PR → merge to main → Replit Git pane: Pull → Run → (Redeploy)
```

- **Edit in one place at a time.** If someone (or Agent) changes code in Replit, they should push from Replit right away, and you should `git pull` locally before you start work.
- **Replit never pulls from GitHub on its own.** Always pull in the Git pane after a merge.
- **A deployment is a snapshot.** After pulling, click **Redeploy** or the live app keeps running the old code.
- **Agent checkpoints are commits.** Rolling back a checkpoint in Replit can rewrite the branch. If your next push or pull is rejected, run `git fetch` and look at both histories first. Don't force-push to fix it.

## Gotchas

| Symptom | Cause / fix |
|---|---|
| `git push` rejected (non-fast-forward) | The other side has commits you don't. `git pull`, resolve, then push. |
| Local branch is `main`, Replit's is `master` | Rename one side (`git branch -m master main`) and update the default branch on GitHub. |
| App runs in Replit but not locally | A secret is missing from `.env`, or the runtime version doesn't match `.replit`. |
| Huge clone or slow push | Tool folders (`.cache`, `.upm`) were committed earlier. Untrack them (Step 2). |
| Deployed app shows old code | You pulled into the workspace but didn't redeploy. |

---

## Practice with a free Replit account

To recreate this situation from scratch:

1. On Replit, click **Create App** and choose the **Node.js** template. Don't import from GitHub.
2. In the Shell, run `git status`. Replit has already set up git. If it hasn't, run `git init -b main`.
3. Create a few commits in the Shell, for example by copying `server.js` from this demo and changing the text.
4. Run `git remote -v`. It should show nothing, so you're in **Case B**.
5. Follow Steps 2–5. You're done when `git rev-parse --short HEAD` matches in both places and Exercise A from the main lab works.
6. Optionally, try **Case C** with a bundle on the same Repl.

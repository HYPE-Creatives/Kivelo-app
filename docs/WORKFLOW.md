Family-Wellness Project Git Workflow

This project contains both frontend (family-wellness/) and backend (family-wellness-backend/) inside one repository.

Daily Workflow

Go to project root

cd C:\DevCorner\Project


Check project status

git status


Stage changes

To add everything:

git add .


Or add only what you want:

git add family-wellness-frontend/
git add family-wellness-backend/


Commit with a clear message

git commit -m "Describe what changed here"


Sync with remote before pushing

git pull origin dev-fatai


Push updates to GitHub

git push origin dev-fatai

Recovery Tips

Undo last commit but keep changes:

git reset --soft HEAD~1


Discard all local changes (use with care):

git reset --hard
git clean -fd


Recover lost commits:

git reflog
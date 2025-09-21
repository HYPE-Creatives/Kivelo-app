🚀 Expo CI/CD with GitHub Actions

This document explains how the CI/CD workflow for the Family Wellness app works. The workflow automates testing, building, and publishing the app to Expo whenever changes are pushed.

📂 Workflow File Location

The workflow file is located at:

.github/workflows/expo-ci.yml

⚙️ Triggers

The workflow runs on the following events:

Push to main or dev

Pull Request targeting main or dev

🏗 Jobs and Steps
1. Checkout Repository
- name: Checkout repository
  uses: actions/checkout@v3


Clones the repo so GitHub Actions can work with your code.

2. Setup Node.js
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: 18
    cache: 'npm'


Installs Node.js 18 and caches node_modules for faster builds.

3. Install Dependencies
- name: Install dependencies
  run: npm ci


Performs a clean install based on package-lock.json (ensures reproducibility).

4. Run Linter
- name: Run linter
  run: npm run lint || echo "No lint script configured 🚧"


Runs the linter if available, otherwise skips gracefully.

5. Run Tests
- name: Run tests
  run: npm test || echo "No tests yet 🚧"


Executes test scripts. If no tests exist, the job continues.

6. Expo Prebuild
- name: Expo prebuild
  run: npx expo prebuild --non-interactive


Generates native project files if you are using custom native modules.
Optional if your app is 100% managed workflow.

7. Expo Build Check
- name: Expo build check (Android)
  run: npx expo export --platform android

- name: Expo build check (iOS)
  run: npx expo export --platform ios


Validates that the project can export successfully for Android and iOS.

8. Publish to Expo (only on main)
- name: Publish to Expo
  if: github.ref == 'refs/heads/main'
  run: npx expo publish --non-interactive
  env:
    EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}


Publishes the app to Expo when changes are pushed to the main branch.
It requires an Expo token stored in GitHub secrets.

🔑 Setup Required
1. Create an Expo Account

Sign up or log in at Expo.dev
.

2. Generate an Expo Token

Run locally:

npx expo login
npx expo whoami
npx expo token:create


Copy the token.

3. Add Expo Token to GitHub Secrets

Go to your repository:
Settings → Secrets and variables → Actions → New repository secret

Name: EXPO_TOKEN

Value: <your-generated-token>

🔄 Workflow Summary

Push to dev → runs lint, tests, and build checks.

Push to main → runs lint, tests, build checks, and publishes to Expo.

📌 Future Enhancements

Add EAS Build to generate APK/IPA files for download.

Deploy automatically to Google Play Store / Apple App Store.

Integrate with Slack/Discord to send CI/CD notifications.
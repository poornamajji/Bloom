# Bloom

A private, offline-friendly cycle companion. Cycle details are optional during
first-run setup; estimates are only shown after a period start date is provided.
User data is stored in the browser on the current device.

## Local development

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

## GitHub Pages

The Vite base path and PWA start URL are configured for the `Bloom` repository
(`/Bloom/`). The GitHub Actions workflow deploys the `main` branch to GitHub
Pages after building the app.

For the first deployment, enable Pages once in the repository: open **Settings
> Pages**, set **Build and deployment > Source** to **GitHub Actions**, then
rerun the latest workflow from the **Actions** tab (or use **Run workflow**).
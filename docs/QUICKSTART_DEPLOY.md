---
title: "Quick Start: Deploying the Showcase"
---

## 🚀 Fastest Path to Production (15 minutes)

### Step 1: Choose Your Platform

We recommend **Vercel** for the fastest deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from repository root
cd /path/to/objectui
vercel --prod
```

### Step 2: Configure Build (if needed)

If Vercel doesn't auto-detect, create `vercel.json`:

```json
{
  "buildCommand": "pnpm install && pnpm build && cd examples/showcase && node ../../packages/cli/dist/cli.js build app.json",
  "outputDirectory": "examples/showcase/dist",
  "framework": null
}
```

### Step 3: Set Custom Domain

```bash
# In Vercel dashboard or CLI
vercel domains add showcase.objectui.org
```

### Step 4: Done! 🎉

Your showcase is now live at:
- Production: `https://your-project.vercel.app`
- Custom: `https://showcase.objectui.org` (after DNS setup)

## 📝 Alternative: GitHub Pages (Free)

### Quick Setup

1. **Create workflow file**: `.github/workflows/deploy-showcase.yml`

```yaml
name: Deploy Showcase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: pnpm install
      - run: pnpm build
      - run: cd examples/showcase && node ../../packages/cli/dist/cli.js build app.json
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./examples/showcase/dist
```

2. **Enable GitHub Pages** in repository settings
3. **Push to main** branch
4. **Access at**: `https://yourusername.github.io/objectui/`

## 🔧 Testing Locally First

Before deploying, test the build:

```bash
# From repository root
pnpm install
pnpm build

# Build showcase
cd examples/showcase
node ../../packages/cli/dist/cli.js build app.json --out-dir dist

# Test the built version
npx serve dist
# Visit http://localhost:3000
```

## 📊 Verify Deployment

After deployment, check:

- ✅ Homepage loads
- ✅ Navigation works
- ✅ Components render correctly
- ✅ Dark mode toggle works
- ✅ Mobile responsive

## 🎯 Next Steps

1. **Add to main website** - Link from your homepage
2. **Update DNS** - Point subdomain to deployment
3. **Setup analytics** - Track usage (Google Analytics, Plausible)
4. **Announce** - Share on social media, dev communities

## 💡 Pro Tips

### Enable Preview Deployments

**Vercel/Netlify**: Automatic preview URLs for pull requests

### Add Custom Branding

Edit `examples/showcase/app.json`:
```json
{
  "name": "YourCompany Showcase",
  "logo": "YourLogo",
  "title": "Component Library"
}
```

### Setup Monitoring

Add error tracking:
- Sentry for errors
- LogRocket for session replay
- Plausible for privacy-friendly analytics

### Performance Optimization

Already optimized! The build includes:
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Asset optimization
- ✅ Lazy loading

## 📞 Need Help?

- 📖 Full guide: `docs/deployment/showcase-deployment.md`
- 💬 Community: GitHub Discussions
- 🐛 Issues: GitHub Issues

---

**Time to first deploy**: 10-15 minutes
**Ongoing cost**: $0 (free tier)
**Maintenance**: Automatic updates via CI/CD

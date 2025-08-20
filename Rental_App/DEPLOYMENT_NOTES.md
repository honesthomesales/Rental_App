# DEPLOYMENT NOTES - CRITICAL INFORMATION

## 🚨 CRITICAL ISSUES TO REMEMBER:

### 1. ENVIRONMENT VARIABLES DON'T WORK IN STATIC EXPORT
- `process.env.NEXT_PUBLIC_*` variables are ONLY available at BUILD TIME
- They are NOT available at RUNTIME in the browser after static export
- GitHub Pages runs the built files, not the source code
- SOLUTION: Embed configuration values directly in the code

### 2. DOUBLE BASE PATH ISSUE
- Next.js with `basePath: '/Rental_App'` generates URLs like `/Rental_App/_next/...`
- GitHub Pages then adds the basePath again, creating `/Rental_App/Rental_App/_next/...`
- This causes 404 errors for all assets
- SOLUTION: Use `assetPrefix` and ensure sanitizer catches all cases

### 3. GIT SUBMODULE ISSUES
- The `../AI_Personal_Assistant` and `../Scrub Shop Road App` are git submodules
- They show as "modified" but are NOT part of this project
- IGNORE these - they're not related to the Rental App deployment
- Only commit changes in the `apps/web/` directory

## 🔧 CURRENT FIXES IMPLEMENTED:

### Supabase Configuration
- ✅ Created `apps/web/lib/config.ts` with embedded credentials
- ✅ Updated `packages/api/src/client.ts` to use embedded config
- ✅ Removed all `process.env` dependencies

### Next.js Configuration
- ✅ `next.config.js` has `basePath: '/Rental_App'` for production
- ✅ Added `assetPrefix: '/Rental_App'` to control asset loading
- ✅ Set `output: 'export'` for static generation

### Post-Build Sanitizer
- ✅ `scripts/fix-gh-pages-paths.mjs` fixes any remaining double prefixes
- ✅ Integrated into `build:static` script

## 📋 DEPLOYMENT STEPS:

1. **ONLY commit web app changes:**
   ```bash
   git add apps/web/
   git commit -m "Fix deployment issues"
   git push origin master
   ```

2. **IGNORE submodule changes** - they're not part of this project

3. **Monitor deployment** at GitHub Actions

## 🎯 EXPECTED RESULT:
- No more "Missing Supabase environment variables" errors
- No more double prefix 404s
- App loads and connects to database properly
- All functionality works including edit pages

## ⚠️ DO NOT FORGET:
- Environment variables don't work in static export
- Submodules are not part of this project
- Always use embedded configuration for runtime values
- The sanitizer is the final safeguard for double prefixes

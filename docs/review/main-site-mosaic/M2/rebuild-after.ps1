# Rebuilds the integrated source (current working tree) into M2/after-dist with the production build environment, without touching dist/.
$env:SITE_URL='https://odalo.sappl-digital.de'; $env:SITE_BASE='/'; $env:PUBLIC_NOINDEX='true'; $env:PUBLIC_AUDIT_TRANSPORT='netlify'
Set-Location "C:\Users\basti\source\repos\odalo\odalo"
npx astro build --outDir "docs\review\main-site-mosaic\M2\after-dist" 2>&1 | Select-Object -Last 2

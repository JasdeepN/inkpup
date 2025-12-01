# Dual-Path Hero Consolidation

## Purpose
Provide InkPup Tattoos with a Cloudflare-native web presence that combines the public marketing site and the internal gallery tooling while staying aligned with the studio brand.

## Target Users
- Prospective and returning tattoo clients in the Greater Toronto Area researching the studio.
- InkPup Tattoos staff and artists who curate gallery content and respond to inquiries.
- Developers responsible for the Cloudflare Workers deployment pipeline and storage automation.

## Project Summary

Merged separate ServiceExplainer section into the hero to surface both Flash and Custom pathways immediately, reducing scroll friction and clarifying user choices.



This project emphasizes the importance of memory management in coding practices, ensuring that tasks are manageable and context is regularly updated.



This project emphasizes the importance of memory management in coding practices, ensuring that tasks are manageable and context is regularly updated.



This project involves managing prompts and ensuring they save to the appropriate memory files instead of incorrect locations.



Create a comprehensive prompt file that outlines a task breakdown into actionable steps, utilizing available tools for project management and memory management.



Create a structured prompt file that outlines a task and breaks it down into actionable steps, incorporating memory management and project management principles.


Next.js App Router marketing and admin experience for InkPup Tattoos, deployed to Cloudflare Workers via OpenNext with Cloudflare R2-backed media and automated infrastructure scripts.

## Goals

- Improve first-impression clarity
- Reduce bounce by surfacing both paths above fold
- Maintain hero image prominence



- Implement efficient memory management practices
- Keep tasks small and concise
- Update context constantly



- Implement efficient memory management practices
- Keep tasks small and concise
- Update context constantly



- Enhance prompt functionality
- Improve memory management



- To create a structured prompt for breaking down tasks into actionable steps.
- To save each step as a #todo in memory for easy tracking and management.



- Develop a clear and concise prompt structure
- Ensure each step is actionable and can be tracked
- Utilize memory management for storing tasks


- Deliver a polished public marketing site with accurate business details, SEO metadata, and Instagram-driven portfolio highlights.
- Provide studio staff with a secure admin portal to upload, optimize, and curate Cloudflare R2 gallery assets.
- Keep Cloudflare deployment, analytics, and storage configuration reproducible through scripts, GitHub Actions, and Wrangler environments.

## Constraints

- Preserve existing hero image dimensions
- Maintain mobile accessibility
- Avoid breaking existing CTA flows



- Focus on memory management



- Focus on memory management



- Ensure prompts save to the correct memory files



- Ensure clarity and comprehensiveness in the prompt structure.
- Maintain a focus on actionable steps that can be easily followed.



- Must include #todos for each step
- Should be adaptable for various tasks


- Must deploy on Cloudflare Workers using the @opennextjs/cloudflare adapter and Wrangler-managed environments.
- All media lives in Cloudflare R2; credentials stay out of source control and the app must gracefully fall back when bindings are unavailable.
- Repository tests run under Jest and Playwright; CLI-driven Jest usage must include the --forceExit flag to avoid hung processes.

## Stakeholders

- Studio owner
- Potential clients (flash seekers, custom seekers)



- Project Managers
- Developers
- Researchers


- InkPup Tattoos prospects and clients browsing the public site.
- InkPup Tattoos studio staff and artists maintaining gallery content.
- Site maintainers responsible for Cloudflare infrastructure, analytics, and storage operations.

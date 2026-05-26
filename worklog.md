---
Task ID: 1
Agent: Main Agent
Task: Create Settings menu with church info (name, address, pastor, treasurer, secretary) and auto-flow treasurer data to finance report

Work Log:
- Read existing project files (church-app.tsx, finances.tsx, finance-report.tsx, schema.prisma)
- Added ChurchSetting model to Prisma schema with fields: churchName, address, pastor, treasurer, secretary
- Ran db:push to sync database schema
- Created API route at /api/settings/route.ts with GET and PUT (upsert) endpoints
- Created Settings UI component at /components/church/settings.tsx with:
  - Church identity section (name + address)
  - Church officials section (pastor, treasurer, secretary)
  - Info banner about data usage across the app
  - Preview card showing how report header will look
  - Save functionality with toast notifications
- Added "Sistem > Pengaturan" navigation section in church-app.tsx with Settings icon
- Updated finance-report.tsx to:
  - Fetch settings from /api/settings when dialog opens
  - Use church name in report header (replacing hardcoded "Gereja")
  - Show church address below church name when available
  - Use treasurer name in signature area (replacing "Bendahara Gereja")
  - Use church name in footer text
- Tested API endpoints: GET returns default settings, PUT upserts correctly
- Ran lint: no errors

Stage Summary:
- ChurchSetting model created with singleton pattern (id="default")
- Settings API working: GET /api/settings and PUT /api/settings
- Settings UI with church info form and report preview
- Finance report now dynamically uses church name, address, and treasurer name from settings
- Treasurer name flows automatically from Settings → Finance Report signature area

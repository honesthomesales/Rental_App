# Roadmap with Steps & Dependencies

Below is the **development roadmap**, broken into phases with clear dependencies.

| Phase | Task | Dependencies |
|------|------|---------------|
| **1. Planning** | Finalize requirements & user stories | — |
| **2. Design** | UX/UI wireframes for mobile & web | Phase 1 |
|  | Data model & API spec | Phase 1 |
| **3. Backend Setup** | Cloud database & hosting | Phase 2 |
|  | Implement core APIs (jobs, quotes, invoices, photos, time) | Data model |
| **4. Mobile App MVP** | Implement voice‑driven job creation | Backend API |
|  | GPS‑based time tracking | Backend API |
|  | Quote generation UI | Backend API |
|  | Photo capture & attachment | Backend API |
| **5. Web Dashboard MVP** | Job list & detail pages | Backend API |
|  | Invoice view/download | Backend API |
| **6. Testing & QA** | Field testing with real users | Phases 4 & 5 |
| **7. Deployment** | Release mobile app (App Store & Google Play) | QA |
|  | Deploy web dashboard | QA |
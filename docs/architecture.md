# BudgetMinds - Autonomous AI Budget Approval System

## System Architecture

The BudgetMinds system is composed of a generic multi-tier web application architecture:

```mermaid
graph TD
    UI[Frontend: React.js + TailwindCSS] --> API[Backend: FastAPI]
    API --> DB[(Database: SQLite)]
    API --> LG[Agent Framework: LangGraph]
    LG --> LLM[LLM: Gemini 1.5 Pro]
    LG --> Web[Web/Market Search]
```

## Agent Workflow Diagram

```mermaid
stateDiagram-v2
    [*] --> EventSubmitted: Coordinator Submits Budget
    
    state "AI Audit Process (LangGraph)" as AIAudit {
        EventSubmitted --> HistoricalData
        HistoricalData --> MarketPriceResearch
        MarketPriceResearch --> BudgetAnalyzer
        BudgetAnalyzer --> Negotiation
        Negotiation --> FinalDecision
    }
    
    AIAudit --> CoordinatorReview: AI Suggested Budget Generated
    CoordinatorReview --> FinancerReview: Forwarded by Coordinator
    
    FinancerReview --> Rejected: Financer Rejects
    FinancerReview --> PrincipalReview: Financer Approves
    
    PrincipalReview --> Rejected: Principal Rejects
    PrincipalReview --> Approved: Principal Approves
    
    Approved --> [*]
    Rejected --> [*]
```

## Database Schema

```mermaid
erDiagram
    users {
        int id PK
        string name
        string email
        string role "Coordinator, Financer, Principal"
    }
    
    events {
        int id PK
        int coordinator_id FK
        string name
        string description
        string status "Draft, AI_Audited, Pending_Financer, Pending_Principal, Approved, Rejected"
        float total_requested_budget
        float total_ai_suggested_budget
    }
    
    budget_items {
        int id PK
        int event_id FK
        string item_name
        float requested_amount
        float ai_suggested_amount
        string ai_reasoning
    }
    
    ai_audit {
        int id PK
        int event_id FK
        text historical_context
        text market_research_data
        text compliance_report
    }
    
    approvals {
        int id PK
        int event_id FK
        int approver_id FK
        string decision "Approved, Rejected"
        text comments
        timestamp created_at
    }

    users ||--o{ events : "coordinator"
    users ||--o{ approvals : "makes"
    events ||--o{ budget_items : "contains"
    events ||--o| ai_audit : "has"
    events ||--o{ approvals : "receives"
```

## API Endpoints

### Auth / Users
- `POST /api/users/login` - Authenticate user

### Coordinator
- `POST /api/events/` - Submit event budget
- `GET /api/events/{event_id}` - View event and AI Audit
- `POST /api/events/{event_id}/forward/financer` - Forward to Financer

### Financer
- `GET /api/events/pending/financer` - List pending events for Financer
- `POST /api/events/{event_id}/approve/financer` - Approve and forward to Principal
- `POST /api/events/{event_id}/reject` - Reject budget

### Principal
- `GET /api/events/pending/principal` - List pending events for Principal
- `POST /api/events/{event_id}/approve/principal` - Final validation
- `POST /api/events/{event_id}/reject` - Final rejection

## Folder Structure

```
BudgetMinds/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── agents.py
│   └── requirements.txt
├── frontend/ (React.js)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
└── docs/
    └── architecture.md
```

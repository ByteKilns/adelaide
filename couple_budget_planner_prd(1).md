# Personal Couple Budget Planner — Product Requirements Document

## 1. Product Overview

A **private, cloud-synced budgeting and expense-tracking web application for two partners**.

The application helps a couple answer four questions:

1. How much money do we have this month?
2. How much has each of us planned to spend?
3. How much have we actually spent?
4. Are we on track, or are we spending too quickly?

The product should feel like a **simple monthly financial control center**, not accounting software.

### Core philosophy

> **Plan → Spend → Compare → Adjust**

The application must prioritize **speed, simplicity, and mobile usability**.

---

## 2. Product Goals

### Primary goals

- Allow each partner to maintain an independent monthly budget.
- Allow shared/couple expenses to be budgeted separately.
- Track who paid for every expense.
- Track savings separately from expenses.
- Make adding an expense extremely fast.
- Show budget vs actual spending clearly.
- Warn users before they overspend.
- Estimate future spending based on current spending behavior.
- Provide a "Safe to Spend" amount.
- Provide useful weekly/monthly financial summaries.
- Keep both partners synchronized through the cloud.
- Work excellently on mobile and desktop.
- Be installable as a PWA.

### Secondary goals

- Identify recurring spending patterns.
- Help the couple understand where their money goes.
- Encourage consistent savings.
- Make monthly financial planning easier.

---

## 3. Non-Goals — V1

The following should **not** be implemented in V1:

- Bank account integrations
- eSewa integration
- Khalti integration
- Automatic bank transaction import
- WhatsApp notifications
- Investment portfolio management
- Net-worth tracking
- Tax management
- Cryptocurrency tracking
- Multi-currency accounting
- Complex debt management
- Accounting/bookkeeping features
- Business expenses
- Multiple households per user
- Complex expense splitting
- Automatic 50/50 shared expense settlement

The architecture should allow these to be added later without major restructuring.

---

## 4. Users

V1 supports exactly **two members in a household**.

### Member roles

- Member 1 — "Me"
- Member 2 — "Partner"

There should not be an admin/member permission hierarchy in V1.

Both members should have equal access to the household's financial data.

---

## 5. Household Model

After authentication, a user can:

### Create a household

Example:

> Nirjal & Partner

The creator becomes the first member.

They can invite/add their partner.

The household contains:

- Two members
- Categories
- Budgets
- Expenses
- Savings goals
- Recurring expenses
- Notification settings
- Monthly financial data

All financial data belongs to the household.

---

## 6. Financial Model

The application must distinguish between:

### Individual finances

- My income
- My budget
- My personal expenses
- My savings
- My financial obligations

### Partner finances

- Partner's income
- Partner's budget
- Partner's personal expenses
- Partner's savings
- Partner's financial obligations

### Shared finances

- Shared budget
- Shared expenses
- Household spending
- Couple activities
- Shared goals

These should be viewable independently and together.

---

## 7. Monthly Financial Structure

Every month has its own financial plan.

Example:

```text
My income             NPR 80,000
Partner income        NPR 60,000
--------------------------------
Combined income       NPR 140,000
```

The application should **not merge the two personal budgets into one budget**.

Instead:

```text
MY BUDGET
PARTNER'S BUDGET
SHARED BUDGET
```

The dashboard can provide a combined overview.

---

## 8. Budget Ownership

Every budget allocation has an owner:

- Me
- Partner
- Shared

Examples:

| Budget | Owner |
|---|---|
| My personal loan | Me |
| My parents | Me |
| Partner's loan | Partner |
| Partner's parents | Partner |
| Groceries | Shared |
| Petrol | Shared |
| Dates | Shared |
| Gifts | Personal/Shared |
| Personal shopping | Me/Partner |
| Vacation | Shared |

---

## 9. Income

Each month should allow each person to specify income independently.

Example:

```text
August 2026

My income
NPR 80,000

Partner income
NPR 60,000

Combined
NPR 140,000
```

Income should support:

- Amount
- Member
- Month
- Optional note

V1 can assume one primary monthly income amount per person.

The data model should nevertheless allow multiple income entries in the future.

---

## 10. Budget Allocation

Users create a monthly budget by allocating expected income.

Example:

### My Budget

```text
Personal loan       15,000
Parents             10,000
Personal spending    8,000
Savings             15,000
Shared contribution 20,000

Allocated           68,000
Income              80,000
Unallocated         12,000
```

The system should **never require the user to allocate 100% of income**.

Unallocated money is valid.

---

## 11. Shared Budget

Shared budgets are independent from personal budgets.

Example:

```text
SHARED BUDGET

Groceries            15,000
Petrol                8,000
Dates                 8,000
Utilities             7,000
Social                4,000
Gifts                 5,000

Total                 47,000
```

V1 does not need to determine how much each partner must contribute to the shared budget.

Instead, every actual shared expense records **who paid**.

---

## 12. Expenses

Every expense contains:

- Amount
- Category
- Owner
- Paid by
- Date
- Optional note
- Created timestamp

### Owner

Who is the expense for?

- Me
- Partner
- Shared

### Paid by

Who actually paid?

- Me
- Partner

---

## 13. Expense Rules

### Personal expense

Example:

> Headphones — NPR 4,000

```text
Owner: Me
Paid by: Me
Category: Personal
```

### Partner expense

```text
Owner: Partner
Paid by: Partner
Category: Personal
```

### Shared expense

Example:

> Dinner — NPR 2,000

```text
Owner: Shared
Paid by: Me
Category: Dates
```

The application must **not automatically assume 50/50 ownership**.

---

## 14. Expense Entry UX

Adding an expense must be extremely fast.

### Default interface

```text
Add Expense

Amount
[ NPR ______ ]

Category
[ Groceries ▼ ]

For
[ Shared ▼ ]

Paid by
[ Me ▼ ]

Note
[ Optional ]

Date
[ Today ]

[ Add Expense ]
```

If the user selects:

> For → Me

the application should automatically default:

> Paid by → Me

If:

> For → Shared

the user chooses the payer.

The application should minimize unnecessary fields.

---

## 15. Categories

Categories should be customizable.

### Recommended defaults

#### Family

- Parents
- Family Support

#### Obligations

- Personal Loan
- EMI
- Insurance
- Bills

#### Household

- Groceries
- Utilities
- Internet
- Household

#### Transportation

- Petrol
- Public Transport
- Vehicle Maintenance

#### Lifestyle

- Dates
- Dining Out
- Entertainment
- Gifts
- Social
- Shopping

#### Personal

- Personal
- Health/Wellness
- Other Personal

#### Financial

- Savings

#### Other

- Miscellaneous

Users can:

- Create category
- Rename category
- Archive category
- Set monthly budget
- Assign category type

---

## 16. Birthday / Gifts / Social Spending

The application should classify spending by **nature**, not by recipient.

Examples:

| Expense | Category |
|---|---|
| Friend's birthday gift | Gifts |
| Wedding gift | Gifts |
| Birthday dinner with friends | Social |
| Going out with friends | Social |
| Couple's restaurant date | Dates |
| Birthday cake | Gifts/Celebration |

The note can contain the specific occasion:

> "Suman's birthday"

Do not create categories such as:

> Friends → Birthday → Gifts

This would create unnecessary complexity.

---

## 17. Savings

Savings are **not expenses**.

Savings should have their own financial entity.

Example:

```text
Income              80,000

Expenses            50,000

Savings             20,000

Unallocated         10,000
```

Savings should not increase the "Expenses" statistic.

---

## 18. Savings Goals

V1 should support simple savings goals.

Example:

```text
Vietnam Trip

Saved
NPR 25,000

Target
NPR 80,000

Progress
31%
```

Other examples:

- Emergency Fund
- New Laptop
- Vacation
- Car
- Wedding
- General Savings

Savings goals can have:

- Name
- Target amount
- Current amount
- Owner
- Optional target date

---

## 19. Recurring Expenses

Users can create recurring expenses.

Examples:

- Loan
- Parents
- Internet
- Insurance
- Subscription

Fields:

```text
Name
Amount
Category
Owner
Paid by
Frequency
Day of month
Start date
End date (optional)
```

Default frequency:

> Monthly

Recurring items should be automatically generated or surfaced as upcoming planned expenses.

---

## 20. Dashboard

The dashboard is the primary screen.

It should be mobile-first.

### Top-level overview

```text
August 2026

Combined Income
NPR 140,000

Expenses
NPR 67,400

Savings
NPR 30,000

Unallocated
NPR 42,600
```

Then:

### Financial health

Example:

> 🟢 You're on track

or:

> 🟡 Spending faster than planned

or:

> 🔴 Projected to exceed budget

---

## 21. Personal Dashboard

Users should be able to switch between:

```text
Overview | Me | Partner | Shared
```

### Me

```text
Income
NPR 80,000

My expenses
NPR 28,000

Shared expenses paid by me
NPR 15,000

Savings
NPR 15,000

Remaining
NPR 22,000
```

Partner receives an equivalent view.

---

## 22. Shared Dashboard

Example:

```text
Shared Budget
NPR 47,000

Shared Spending
NPR 25,000

Remaining
NPR 22,000

Paid by me
NPR 15,000

Paid by partner
NPR 10,000
```

This gives the couple visibility without forcing a settlement calculation.

---

## 23. Budget Cards

Every category should show:

```text
Groceries

NPR 12,000 / NPR 15,000

80%

NPR 3,000 remaining
```

Visual progress indicators should communicate:

- Healthy
- Approaching limit
- Over budget

Avoid relying exclusively on color; use labels/icons/text too.

---

## 24. Budget vs Actual

Provide a detailed monthly comparison.

| Category | Budget | Actual | Difference |
|---|---:|---:|---:|
| Parents | 20,000 | 20,000 | 0 |
| Loans | 25,000 | 25,000 | 0 |
| Petrol | 8,000 | 6,200 | +1,800 |
| Groceries | 15,000 | 18,500 | -3,500 |
| Dates | 8,000 | 9,200 | -1,200 |

Positive difference means remaining budget.

Negative difference means overspending.

---

## 25. Safe-to-Spend

The application should calculate a **Safe to Spend** amount.

This is an estimate, not a bank balance.

Conceptually:

```text
Remaining available budget
÷
Remaining days
```

The calculation should account for:

- Current spending
- Remaining budget
- Days remaining
- Planned recurring expenses
- Existing allocations

Example:

> **Safe to spend today: NPR 1,150**

Supporting explanation:

> Based on your remaining budget and 16 days left in the month.

The user should be able to understand why the number was calculated.

---

## 26. Spending Velocity

The system should compare:

### Percentage of month elapsed

against:

### Percentage of budget consumed

Example:

```text
Month elapsed: 40%

Groceries used: 72%
```

The system should recognize that the category is spending faster than planned.

Example message:

> ⚠️ Groceries are running ahead of schedule.

---

## 27. Overspending Forecast

The application should estimate projected spending.

Example:

```text
Groceries

Budget
NPR 15,000

Spent
NPR 9,000

Projected
NPR 22,500

Projected overspend
NPR 7,500
```

The system should avoid making forecasts when there is insufficient data.

For example, don't make a meaningful projection from a single transaction immediately after the month begins.

---

## 28. Notification System

### Primary channels

1. In-app notifications
2. Web push notifications

### Optional

3. Email for weekly/monthly summaries

### Not V1

4. WhatsApp

---

## 29. Notification Types

### Budget warning

Trigger when a category reaches a configurable threshold.

Default:

**80%**

Example:

> ⚠️ Groceries are 80% used.

### Budget exceeded

Example:

> 🔴 You've exceeded your Dates budget by NPR 1,200.

### Spending velocity warning

Example:

> ⚠️ You're spending faster than planned on groceries.

### Forecast warning

Example:

> 🔴 At your current pace, you'll exceed your Petrol budget by approximately NPR 1,400.

### Savings milestone

Example:

> 🎯 You've reached your NPR 15,000 savings goal.

### Recurring expense reminder

Example:

> 🔔 Personal loan payment of NPR 15,000 is due tomorrow.

### Weekly summary

Example:

> 📊 Your weekly financial summary is ready.

### Monthly summary

Example:

> 📊 Your August financial summary is ready.

---

## 30. Notification Preferences

Each partner controls their own notifications.

Settings:

```text
Budget 80% warning       ON
Budget exceeded          ON
Overspending forecast    ON
Recurring reminders      ON
Savings milestones       ON
Weekly summary           ON
Monthly summary          ON
Shared expense alerts    ON
```

---

## 31. Quiet Hours

Users can configure:

```text
Quiet hours

10:00 PM → 7:00 AM
```

Non-critical notifications should be suppressed during quiet hours.

Critical notifications can optionally be allowed.

---

## 32. In-App Notification Center

A notification bell should display unread notifications.

Example:

```text
🔔 3
```

Notification center:

```text
Notifications

⚠️ Petrol budget is 82% used
Today

🎯 Savings goal reached
Yesterday

📊 Weekly summary available
Aug 15
```

Users can:

- Mark as read
- Mark all as read
- Open related budget/expense
- Clear notification

---

## 33. Recent Expenses

Dashboard should show recent transactions.

Example:

```text
Today

Bhatbhateni
Groceries
-NPR 2,450

Petrol Pump
Petrol
-NPR 1,500

Restaurant
Dates
-NPR 2,200
```

Provide:

> View all expenses

---

## 34. Expense History

Users should be able to:

- Search
- Filter by category
- Filter by member
- Filter by owner
- Filter by payer
- Filter by date
- Filter by amount
- Edit expense
- Delete expense

---

## 35. Monthly History

A history page should show previous months.

Example:

```text
August 2026
Income       140,000
Expenses      67,400
Savings       30,000

July 2026
Income       135,000
Expenses      72,100
Savings       25,000
```

Selecting a month opens its complete financial dashboard.

---

## 36. Monthly Rollover

V1 should **not automatically roll unused category budgets into the next month**.

Example:

August Petrol:

```text
Budget: 8,000
Spent: 6,000
Unused: 2,000
```

September Petrol remains:

```text
Budget: 8,000
```

The application can display the previous month's surplus in reports, but it should not automatically modify the next month's budget.

---

## 37. Budget Types

Budget categories can optionally be marked:

### Fixed

Expected/committed expenses.

Examples:

- Loans
- Parents
- Rent
- Insurance

### Flexible

Expenses users can adjust.

Examples:

- Dining
- Dates
- Entertainment
- Shopping

This allows future insights such as:

> 64% of your income is committed to fixed expenses.

---

## 38. Monthly Setup Flow

At the beginning of a month:

### Step 1 — Income

```text
Your income
[ 80,000 ]

Partner income
[ 60,000 ]
```

### Step 2 — Individual budgets

Each partner reviews their budget.

### Step 3 — Shared budget

Review shared categories.

### Step 4 — Savings

Set savings targets.

### Step 5 — Recurring expenses

Review upcoming recurring expenses.

The user should also be able to **copy the previous month's budget** and adjust it.

This is strongly recommended.

---

## 39. Copy Previous Month

Example:

> Copy July budget to August?

The system copies:

- Categories
- Budget allocations
- Savings goals where appropriate
- Recurring expenses

But **never copies actual expenses**.

This makes monthly planning significantly faster.

---

## 40. Responsive UX

### Mobile

Primary target.

Navigation should use a bottom navigation bar:

```text
Home | Expenses | Budget | Goals | More
```

A prominent:

**+ Add Expense**

button should always be easily accessible.

### Desktop

Use a sidebar/navigation layout.

Dashboard can use a wider multi-column layout.

The same functionality must remain available on both.

---

## 41. PWA

The application should be installable as a Progressive Web App.

Requirements:

- Web app manifest
- Installable
- Responsive
- App-like mobile interface
- Push notification support
- Appropriate icons
- Offline-friendly shell

Expense creation should ideally remain usable during temporary connectivity issues.

Cloud synchronization should happen when connectivity returns.

---

## 42. Offline Strategy

The application should use a local-first approach for short periods of connectivity loss.

At minimum:

- Cache application shell
- Cache recently loaded household data
- Allow expense creation offline where technically safe
- Queue unsynchronized changes
- Sync automatically when connection returns
- Clearly indicate sync status

Example:

> ✓ Synced

or:

> ⟳ Syncing...

or:

> ⚠ Offline — changes will sync when connected.

Conflict resolution should be designed conservatively because two users may add expenses simultaneously.

---

## 43. Authentication

V1 requires authentication.

Recommended options:

- Email/password
- Password reset
- Email verification

The architecture should allow OAuth providers later.

After authentication:

```text
User
 ↓
Household
 ↓
Financial data
```

Users must only be able to access households they belong to.

---

## 44. Security

Financial data is private.

Requirements:

- Authentication required
- Authorization on every protected API operation
- Household-level data isolation
- Server-side validation
- Never trust client-provided household IDs
- Passwords must never be stored directly
- Secure sessions/cookies
- HTTPS in production
- Environment secrets outside source control
- Proper database constraints
- Protection against unauthorized household access

---

## 45. Suggested Technical Stack

The implementation should use a modern TypeScript stack.

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Forms

- React Hook Form
- Zod

### Backend

Next.js server-side APIs/server actions where appropriate.

### Database

PostgreSQL.

### ORM

Drizzle ORM or Prisma.

Choose one and remain consistent.

### Authentication

A modern Next.js-compatible authentication solution.

### PWA

Service worker + manifest.

### Notifications

Web Push.

### Hosting

Vercel-compatible deployment.

Database can use a managed PostgreSQL provider.

---

## 46. Core Database Entities

The exact implementation can evolve, but the data model should conceptually include:

```text
User
Household
HouseholdMember

Category
MonthlyBudget
BudgetItem

Income
Expense

SavingsGoal
SavingsContribution

RecurringExpense

Notification
NotificationPreference
```

---

## 47. Expense Entity

Conceptually:

```text
Expense
- id
- householdId
- amount
- categoryId
- ownerMemberId
- paidByMemberId
- date
- note
- createdAt
- updatedAt
```

`ownerMemberId` identifies who the expense belongs to.

`paidByMemberId` identifies who actually paid.

Shared expenses can use a shared ownership representation.

---

## 48. Budget Entity

```text
MonthlyBudget
- id
- householdId
- year
- month
- createdAt
- updatedAt
```

Budget items:

```text
BudgetItem
- id
- monthlyBudgetId
- categoryId
- owner
- plannedAmount
- budgetType
```

Where owner is:

- Me
- Partner
- Shared

---

## 49. Savings Entity

```text
SavingsGoal
- id
- householdId
- ownerMemberId
- name
- targetAmount
- currentAmount
- targetDate
- status
```

Savings contributions should be separate records if transaction history is desired.

---

## 50. Recurring Expense Entity

```text
RecurringExpense
- id
- householdId
- name
- amount
- categoryId
- ownerMemberId
- paidByMemberId
- frequency
- dayOfMonth
- startDate
- endDate
- active
```

---

## 51. Important Business Rules

### Rule 1

Expenses reduce the relevant budget.

### Rule 2

Savings do not count as expenses.

### Rule 3

Income belongs to an individual.

### Rule 4

Budgets can belong to an individual or be shared.

### Rule 5

Every expense has an owner.

### Rule 6

Every expense has a payer.

### Rule 7

Shared expenses do not automatically become 50/50.

### Rule 8

Unallocated income is valid.

### Rule 9

Unused budget does not automatically roll over.

### Rule 10

Deleting an expense must immediately recalculate:

- Category spent
- Remaining budget
- Overall spending
- Safe-to-spend
- Forecast
- Relevant notifications

---

## 52. Dashboard Calculations

The dashboard should calculate:

### Combined income

```text
My income + Partner income
```

### Total expenses

```text
All expense transactions for the month
```

### Personal expenses

Filtered by owner.

### Shared expenses

Filtered by shared ownership.

### Savings

Savings contributions for the month.

### Remaining

Should be clearly defined and should not mix budget allocation concepts with bank balance concepts.

The UI must explain calculations where ambiguity exists.

---

## 53. Forecasting Rules

Forecasts should be conservative.

The system should consider:

- Days elapsed
- Days remaining
- Current category spending
- Planned budget
- Existing recurring commitments

If there is insufficient data, display:

> Not enough data to estimate.

Do not display misleading precision.

Forecasts should be presented as estimates, not financial guarantees.

---

## 54. Monthly Summary

At the end of a month, generate:

### Income

### Expenses

### Savings

### Budget performance

### Top spending categories

### Most overspent category

### Most under-budget category

### Shared spending

```text
You paid: NPR 19,200
Partner paid: NPR 13,300
```

### Savings rate

Example:

> You saved 21% of combined income.

---

## 55. Future Features

The architecture should leave room for:

- WhatsApp notifications
- Email alerts
- Bank integrations
- eSewa/Khalti integrations
- Automatic transaction import
- Expense splitting
- Settle-up calculations
- Investment tracking
- Net worth
- AI financial insights
- Advanced charts
- Budget rollover
- Multiple savings accounts
- Multiple households
- Family members
- Currency support
- Export to CSV/PDF

These should **not** complicate V1.

---

## 56. V1 Acceptance Criteria

### Authentication

- A user can register.
- A user can log in.
- A user can log out.
- Password reset works.
- Unauthorized users cannot access financial data.

### Household

- A household can be created.
- A second partner can join.
- Both partners can see synchronized household data.

### Income

- Each partner can enter monthly income.
- Combined income is displayed.

### Budget

- Users can create monthly budgets.
- Budgets can belong to Me, Partner, or Shared.
- Categories can be created and edited.
- Budget vs actual is calculated correctly.

### Expenses

- An expense can be added quickly.
- Owner can be selected.
- Payer can be selected.
- Expenses can be edited/deleted.
- Expense totals update immediately.

### Savings

- Savings can be recorded independently.
- Savings do not appear in expense totals.
- Savings goals display progress.

### Shared spending

- Shared expenses are supported.
- Payer is recorded.
- Spending by each partner can be viewed.

### Notifications

- In-app notifications work.
- Push notifications work where browser permissions are available.
- Budget threshold notifications work.
- Overspending notifications work.
- Notification preferences work.
- Quiet hours work.

### PWA

- Application is installable.
- Mobile experience is polished.
- Basic offline behavior works.

---

## 57. Design Principles

The application should feel:

**Simple**

Not like accounting software.

**Fast**

Adding an expense should take seconds.

**Calm**

Financial warnings should inform rather than create anxiety.

**Clear**

Users should immediately understand:

> Where is my money going?

**Mobile-first**

The majority of expense entries are expected to happen on phones.

**Opinionated**

Don't expose unnecessary configuration.

**Data-driven**

Show useful insights rather than merely storing transactions.

---

## 58. Core User Journey

The ideal experience is:

```text
LOGIN
  ↓
DASHBOARD
  ↓
See financial health
  ↓
+ ADD EXPENSE
  ↓
Amount → Category → Owner → Payer
  ↓
DONE
  ↓
Dashboard updates
  ↓
Budget engine recalculates
  ↓
Forecast recalculates
  ↓
Notifications evaluated
```

At the beginning of the month:

```text
NEW MONTH
   ↓
Income
   ↓
Copy previous budget
   ↓
Adjust allocations
   ↓
Set savings
   ↓
Review recurring expenses
   ↓
START MONTH
```

At the end:

```text
MONTH ENDS
   ↓
Monthly summary
   ↓
Budget vs actual
   ↓
Savings performance
   ↓
Shared spending
   ↓
Insights
   ↓
Copy budget → NEXT MONTH
```

---

## 59. Product Success Metric

The most important measure isn't the number of expenses recorded.

It's:

> **Can the couple maintain the habit of budgeting and understand their financial position in less than a minute?**

The application succeeds if either partner can open it and immediately understand:

**How much came in → how much was planned → how much was spent → how much is left → whether we're on track.**

That should guide every implementation decision.

---

# Final Product Definition

**A private, two-person, cloud-synchronized monthly budgeting application that combines individual finances with shared household spending, tracks actual expenses against planned budgets, treats savings separately, and proactively tells the couple when their spending behavior is drifting away from their plan.**

The key model is:

```text
             ┌──────────────────────┐
             │    COMBINED VIEW     │
             └──────────┬───────────┘
                        │
           ┌────────────┼────────────┐
           ↓            ↓            ↓
        MY MONEY    PARTNER MONEY   SHARED
           │            │            │
        Income        Income       Budget
        Budget        Budget       Expenses
        Expenses      Expenses     Payer
        Savings       Savings
           │            │            │
           └────────────┼────────────┘
                        ↓
                BUDGET ENGINE
                        ↓
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
       Dashboard     Forecasts     Notifications
          ↓             ↓             ↓
      Safe to Spend   Overspend    Push/In-app
```

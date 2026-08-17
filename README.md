# Mini Shop Hub

Build a Real Production-Ready PWA — “Mini Shop”

Build a fully functional, production-ready Progressive Web App (PWA) called “Mini Shop”, developed by Chanel.

IMPORTANT: This is NOT a demo, prototype, mockup, or UI-only project. I need a real working system with a real database, real authentication, real CRUD operations, real calculations, real approval workflows, real-time updates where appropriate, and persistent data.

DO NOT USE TANSTACK.

Do not create fake news, fake transactions, fake users, fake reports, fake statistics, placeholder business data, or demo content. The application must start with an empty database except for the default accounts described below.

1. Purpose of the System

Mini Shop is a work-management and financial reporting system for an employee and their Boss.

The employee performs several services during the day:

Selling/registering new Airtel SIM cards

Airtel SIM swaps

Selling movies and songs

Installing/fixing software on phones

Giving Airtime when selling/registering a new SIM card

Instead of manually calculating everything when reporting to the Boss, the employee should record every activity immediately inside Mini Shop.

At the end of the day, the system automatically calculates the daily report.

The system must also automatically generate:

Daily reports

Weekly reports

Monthly reports

Yearly reports

The Boss should be able to see activities as they are entered.

2. Technology Requirements

Use a modern, stable stack suitable for Lovable:

React

Vite

TypeScript

Tailwind CSS

Supabase

Supabase PostgreSQL

Supabase Authentication

Supabase Row Level Security (RLS)

PWA support

Service Worker

Web App Manifest

Absolutely do NOT use:

TanStack

TanStack Router

TanStack Start

Fake APIs

Local-only mock databases

Hardcoded transaction data

Demo statistics

The application must work with a real Supabase backend.

3. Branding

Application name:

Mini Shop

Developer credit:

Developed by Chanel

Main visual identity:

Red as the primary color

Glassmorphism design

Modern dark/light interface

Clean cards

Soft shadows

Smooth animations

Rounded corners

Professional dashboard

Mobile-first responsive design

The design should feel like a professional business application rather than a generic admin template.

4. Theme Selection Before Login

Before the login screen, show a beautiful welcome/theme-selection screen.

The user must be able to choose:

Dark Mode

or

Light Mode

Save the selected theme in local storage so it remains after reopening the application.

The user should also be able to change the theme later from Settings.

5. User Roles

There are exactly two main roles:

Employee

The employee records daily activities.

Employee can:

Add new transactions

View their own transactions

View their earnings

View daily/weekly/monthly/yearly reports

View transaction history

Send messages to Boss

Request edits to completed/locked transactions

View their dashboard

View approved changes

View Airtime expenses related to SIM sales

Employee must NOT be able to freely modify or delete finalized records after the working day is closed.

Boss / Admin

Boss has a complete management dashboard.

Boss can:

View all employee activities

View all financial data

View daily reports

View weekly reports

View monthly reports

View yearly reports

View employee earnings

View Boss earnings

Approve/reject edit requests

Edit transactions after approval

Delete transactions after approval

Manage users

View employee performance

View messages from employee

Reply to employee

Receive notifications

Configure business settings

Configure commission percentages

View audit logs

6. Default Login Accounts

Create a secure initial setup system for the two default accounts.

Do NOT expose passwords inside the frontend source code.

The credentials should be securely stored using Supabase Authentication.

Create:

Employee account

Name:
Chanel

Role:
employee

Boss account

Name:
Boss

Role:
boss

Provide a secure first-login/password-change flow so credentials can be changed.

Do not display passwords publicly.

7. Employee Dashboard

Create a beautiful mobile-first employee dashboard.

At the top display:

Hello, Chanel 👋

Then show today's summary:

Total activities today

Total revenue generated today

Airtime cost today

Net revenue today

Employee 40% share

Boss 60% share

Number of SIM cards sold

Number of SIM swaps

Movies & songs revenue

Phone software revenue

Also show:

Today's Earnings

Display clearly:

Employee Share: 40%

Boss Share: 60%

But calculate the percentage correctly according to the business rules below.

8. Business Calculation Rules

The default revenue-sharing model is:

Employee = 40%

Boss = 60%

However:

Airtime must be deducted BEFORE splitting revenue.

Example:

If a SIM-related transaction generates 5,000 RWF and Airtime costs 500 RWF:

Net amount:

5,000 - 500 = 4,500 RWF

Then:

Employee:

4,500 × 40% = 1,800 RWF

Boss:

4,500 × 60% = 2,700 RWF

The system must automatically calculate this.

Do NOT manually hardcode final amounts.

9. Transaction Types

Create a transaction system with these categories:

A. New Airtel SIM

Fields:

Transaction ID

Date

Time

SIM quantity

Price per SIM

Total SIM revenue

Airtime cost

Net revenue

Employee 40%

Boss 60%

Notes

Created by

Created timestamp

When adding a new SIM transaction, the employee must be able to enter Airtime cost.

B. Airtel SIM Swap

Fields:

Transaction ID

Date

Time

Number of SIM swaps

Price per swap

Total revenue

Employee 40%

Boss 60%

Notes

Created by

Created timestamp

C. Movies & Songs

Fields:

Transaction ID

Date

Time

Number of customers/items

Revenue

Employee 40%

Boss 60%

Notes

Created by

Created timestamp

D. Phone Software

Fields:

Transaction ID

Date

Time

Number of phones

Price per phone/service

Total revenue

Employee 40%

Boss 60%

Notes

Created by

Created timestamp

10. Quick Add Activity

The employee should have a prominent button:

+ Add Activity

When clicked, show four beautiful options:

📱 New SIM

🔄 SIM Swap

🎬 Movies & Songs

💻 Phone Software

Make transaction entry extremely fast because the employee will use it repeatedly during work.

11. Real-Time Boss Visibility

IMPORTANT:

As soon as the employee creates a transaction, the Boss should be able to see it without waiting for the end-of-day report.

Use Supabase real-time functionality where appropriate.

Example:

Employee records:

3 SIM cards

The Boss dashboard should immediately show the new activity.

Display:

New activity added by Chanel

with transaction details.

12. End-of-Day Report

At the end of every working day, automatically calculate the report.

Daily report should include:

SIM Cards

Number sold

Total SIM revenue

Total Airtime cost

Net SIM revenue

SIM Swaps

Number of swaps

Total revenue

Movies & Songs

Number of transactions/items

Total revenue

Phone Software

Number of phones/services

Total revenue

Financial Summary

Gross revenue

Airtime expenses

Net distributable revenue

Employee 40%

Boss 60%

Do not require the employee to manually calculate anything.

13. Weekly Reports

Automatically generate weekly reports.

Allow the user to select:

Current week

Previous week

Custom week/date range

Show:

Total SIM cards

Total SIM revenue

Total Airtime

Total SIM swaps

Total Movies & Songs revenue

Total software services

Gross revenue

Expenses

Net revenue

Employee earnings

Boss earnings

Include charts where useful.

14. Monthly Reports

Create a monthly reporting system.

Show:

Total activities

Total SIM cards

Total SIM swaps

Movies & Songs revenue

Software revenue

Total Airtime expenses

Gross revenue

Net revenue

Employee earnings

Boss earnings

Allow selecting any month from historical data.

15. Yearly Reports

Create yearly reports.

Show:

Monthly revenue comparison

Total annual revenue

Total annual Airtime expenses

Employee annual earnings

Boss annual earnings

Total activities

SIM performance

SIM swap performance

Movies & Songs performance

Software performance

Add useful charts.

16. Transaction Locking

This is VERY IMPORTANT.

The employee must NOT be allowed to secretly modify historical transactions.

During the current working day, allow normal transaction management according to permissions.

When the working day is closed/finalized:

Transactions become LOCKED.

Employee can no longer directly edit or delete them.

If the employee made a mistake, they must click:

Request Edit

Then enter:

Reason for correction

What needs to be changed

The Boss receives an approval request.

17. Boss Approval Workflow

Create an approval system.

Employee submits:

Edit Request #102

Boss receives notification.

Boss can:

Approve

or

Reject

If approved:

Employee gets permission to modify that specific transaction.

After modification:

Record the old value

Record the new value

Record who changed it

Record when it changed

Record approval information

Create a complete audit trail.

18. Audit Log

Create an audit_logs table.

Track important actions such as:

Transaction created

Transaction edited

Transaction deleted

Edit requested

Edit approved

Edit rejected

Login

Logout

Settings changed

Each audit entry should contain:

User

Action

Target record

Old data where appropriate

New data where appropriate

Timestamp

The employee must never be able to delete audit logs.

19. Delete Protection

The employee must never be able to permanently delete finalized transactions.

Boss can delete only when appropriate.

Prefer soft delete instead of permanently destroying financial records.

Store:

deleted_at

deleted_by

deletion_reason

20. Employee-to-Boss Messaging

Create a simple internal messaging feature.

Employee should have a button:

Message Boss

The employee can write messages such as:

Hari umuntu ushaka Boss.

or:

Hari customer ushaka kuvugana na Boss.

Boss receives the message immediately.

Boss can reply.

Include:

Unread count

Message timestamp

Read/unread status

Conversation history

Notifications

21. Notifications

Create a notification system.

Employee notifications:

Edit request approved

Edit request rejected

Boss replied

Important system notification

Boss notifications:

New transaction

New edit request

New employee message

Important report notification

Show notification badges.

22. Boss Dashboard

Create a separate professional Boss dashboard.

Show:

Today's Business

Gross revenue

Airtime expenses

Net revenue

Employee share

Boss share

SIM cards

SIM swaps

Movies & Songs

Software services

Performance

Show charts for:

Daily revenue

Weekly revenue

Monthly revenue

Service performance

Recent Activities

Show the latest employee transactions in real time.

23. Employee Dashboard Earnings

The employee should be able to clearly see:

Today

Revenue generated

Airtime expenses

Net revenue

My 40%

Boss 60%

This Week

My total earnings

This Month

My total earnings

This Year

My total earnings

Also allow filtering by date.

24. Reports Export

Add report export functionality.

Boss and authorized users should be able to export:

Daily report

Weekly report

Monthly report

Yearly report

Support:

PDF

CSV

The exported report should contain real database data.

25. Dashboard Filters

Add filters:

Today

Yesterday

This week

This month

This year

Custom date range

All numbers and charts must update dynamically.

26. Database Design

Use Supabase PostgreSQL.

Create proper relational tables such as:

profiles

id

full_name

role

avatar_url

created_at

updated_at

transactions

id

user_id

transaction_type

quantity

unit_price

gross_amount

airtime_cost

net_amount

employee_percentage

boss_percentage

employee_amount

boss_amount

notes

status

is_locked

created_at

updated_at

deleted_at

deleted_by

edit_requests

id

transaction_id

requested_by

reason

status

reviewed_by

reviewed_at

created_at

messages

id

sender_id

receiver_id

message

is_read

created_at

notifications

id

user_id

type

title

message

is_read

created_at

audit_logs

id

user_id

action

entity_type

entity_id

old_data

new_data

created_at

business_settings

employee_percentage

boss_percentage

updated_by

updated_at

Use appropriate foreign keys, indexes, timestamps, constraints, and RLS policies.

27. Security

Security is extremely important.

Use Supabase Row Level Security.

Employee:

Can create transactions

Can view permitted transactions

Can create edit requests

Can view their own requests

Can message Boss

Cannot approve requests

Cannot modify business percentages

Cannot manipulate financial calculations

Cannot delete audit logs

Cannot bypass locked transactions

Boss:

Can view all transactions

Can approve/reject requests

Can manage transactions

Can manage users

Can manage settings

Can view audit logs

Can access all reports

Do not trust frontend role checks alone.

Enforce permissions at database/RLS level.

28. Automatic Calculations

Never trust manually entered:

Employee share

Boss share

Net revenue

Calculate these securely from the source values.

The system should calculate:

net_amount = gross_amount - airtime_cost

Then:

employee_amount = net_amount × employee_percentage

boss_amount = net_amount × boss_percentage

Make the percentages configurable by Boss, with defaults:

Employee = 40%

Boss = 60%

The total percentages must equal 100%.

29. PWA Requirements

Make Mini Shop a real installable PWA.

Include:

manifest.json

Service Worker

Offline app shell

Install prompt

App icon

Splash/loading experience

Responsive layout

Mobile navigation

Desktop sidebar

Add a prominent button:

Install Mini Shop

The install button should only appear when the browser supports installation and should behave correctly.

After installation, Mini Shop should feel like a native mobile application.

30. Mobile UX

The employee will mainly use a phone.

Therefore:

Mobile-first design

Large touch targets

Bottom navigation

Floating Add Activity button

Fast transaction forms

Minimal typing

Clear financial numbers

Responsive tables

Mobile-friendly charts

Swipe-friendly cards where appropriate

Desktop should still have a professional dashboard layout.

31. Main Navigation

Employee

Dashboard

Add Activity

Transactions

Reports

Earnings

Messages

Notifications

Settings

Boss

Dashboard

Live Activities

Transactions

Reports

Employees

Edit Requests

Messages

Notifications

Audit Logs

Settings

32. Settings

Include:

Dark/light theme

Profile

Change password

Notification settings

Business percentage settings — Boss only

PWA installation information

Logout

33. Empty States

Do NOT populate the system with fake data.

If there are no transactions, show a useful empty state such as:

No activities recorded yet.

Do not invent statistics.

For example, do NOT show:

127 SIM Cards Sold

unless that number actually exists in the database.

34. Error Handling

Handle:

Offline connection

Supabase errors

Authentication errors

Invalid form data

Duplicate submissions

Failed transaction creation

Failed notifications

Permission errors

Show clear user-friendly messages.

Never silently lose a transaction.

35. Data Validation

Validate:

Quantity must be greater than 0

Prices cannot be negative

Airtime cannot be negative

Percentages must be valid

Required transaction fields cannot be empty

Financial values must use appropriate decimal/numeric types

Prevent accidental double submission.

36. UI Details

Use:

Red primary accent

Glassmorphism cards

Red gradient accents where appropriate

Modern icons

Smooth page transitions

Clean typography

Good spacing

Beautiful empty states

Loading skeletons

Toast notifications

Confirmation dialogs for destructive actions

Avoid excessive animation.

The application must remain fast.

37. Important Financial Integrity Rule

This application manages real business money.

Therefore:

Never calculate important financial totals only in React.

Use database-backed values and secure server/database logic where appropriate.

The Boss must be able to trust the numbers shown in:

Dashboard

Daily report

Weekly report

Monthly report

Yearly report

Every report must be generated from actual stored transactions.

38. Real-Time Data

Use Supabase real-time subscriptions for:

New transactions

Notifications

Messages

Edit requests

When the employee records an activity, Boss should see it without manually refreshing whenever real-time connectivity is available.

39. Authentication Flow

Create:

Welcome screen

Theme selection

Login

Role detection

Redirect to correct dashboard

Employee → Employee Dashboard

Boss → Boss Dashboard

Do not allow an employee to manually navigate to Boss pages and gain access.

40. Production Quality

Before finishing:

Remove all demo data

Remove placeholder statistics

Remove fake users

Remove fake reports

Remove fake transactions

Remove console errors

Check authentication

Check RLS

Check calculations

Check mobile responsiveness

Check PWA installation

Check real-time updates

Check edit approval flow

Check audit logs

Check report generation

Check all CRUD operations

41. Final Requirement

I do NOT want a beautiful frontend that only looks functional.

I need:

A REAL WORKING BUSINESS SYSTEM.

Every button must perform its actual function.

Every form must save to the real database.

Every report must use real transactions.

Every calculation must be accurate.

Every permission must be enforced.

Every edit request must actually require Boss approval.

Every notification and message must work.

Every dashboard statistic must come from real database data.

There must be ZERO fake/demo business content.

Build the entire application as a production-ready PWA called:

MINI SHOP

Developed by Chanel

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/34dce290-f04a-40dd-b926-b55a951be683).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

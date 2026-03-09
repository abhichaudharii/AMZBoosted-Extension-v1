# AMZBoosted API Endpoint Inventory & Audit

This document provides a comprehensive map of all API endpoints utilized by the AMZBoosted Extension to communicate with the `amzboosted.com` backend.

## 🔑 Authentication Service (`/auth`)
Managed in `lib/api/services/auth.ts`

| Endpoint | Method | Status | Payload | Returns | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/auth/login` | POST | **Active** | `{ email, password }` | `Session` | Authenticates user and returns JWT. |
| `/auth/register` | POST | **Active** | `{ fullName, email, password }` | `Session` | Creates new account and logs in. |
| `/auth/logout` | POST | **Active** | None | Success | Invalidates the current session token. |
| `/auth/session` | GET | **Active** | None | `Session` | Re-validates the token on app startup. |

---

## 👤 User & Subscription Service (`/user`, `/subscription`, `/plans`)
Managed in `lib/api/services/user.ts`

| Endpoint | Method | Status | Payload | Returns | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/user/profile` | GET | **Active** | None | `User` | Fetches personal info (name, email, etc). |
| `/user/profile/update`| PATCH | **Active** | `{ fullName?, timezone?, email? }` | `User` | Updates user profile fields. |
| `/user/usage` | GET | **Active** | None | `{ usage, plan, credits }`| **Critical**: Merged stats endpoint. |
| `/user/limits` | GET | **Active** | None | `PlanLimits` | Fetches quotas (max schedules, etc).|
| `/user/password` | POST | **Active** | `{ currentPassword, newPassword }` | boolean | Securely changes user password. |
| `/subscription/status`| GET | **Active** | None | `SubscriptionStatus`| Checks if trial/plan is active. |
| `/plans` | GET | **Active** | None | `any[]` | Fetches all plan definitions. |

---

## 📞 Integrations Service (`/integrations`)
Managed in `lib/api/services/integrations.ts`

| Endpoint | Method | Status | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/integrations/available` | GET | **Active** | - | Fetch listing of supported platforms |
| `/integrations/connect` | POST | **Active** | `definition_id`, `credentials` | Connecting a new external service |
| `/integrations/disconnect` | POST | **Active** | `definition_id` | Removing an integration |
| `/integrations/sync` | POST | **Placeholder** | `id` | Currently returns `{success: true}` locally |

---

## 🛠️ Tools & Permissions (`/tools`, `/permissions`, `/exports`)
Managed in `lib/api/services/tools.ts`, `features.ts`, and `tool-execution.service.ts`

| Endpoint | Method | Status | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/tools` | GET | **Active** | - | Fetches dynamic tool definitions |
| `/permissions/check` | POST | **Active** | `toolId`, `urlCount`, `action` | **Core**: Permission and credit deduction |
| `/exports/create` | POST | **Active** | Result data, format | Requesting data export generation |
| `/features/available` | GET | **Legacy** | n/a | **Inactive**: Logic migrated to `FeaturesService` |

---

## 📅 Automation & Schedules (`/schedules`)
Managed in `lib/api/services/schedules.ts` and `scheduler.service.ts`

| Endpoint | Method | Status | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/schedules/run` | POST | **Active** | `scheduleId`, `triggeredBy`, etc. | Signals start and deducts credits |
| `/schedules/complete` | POST | **Active** | `runId`, `success`, `duration` | Finalizes status and logs results |

---

## 📈 Analytics & Tracking (`/analytics`)
Managed in `lib/api/services/analytics.ts` (Unified)

| Endpoint | Method | Status | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/analytics/track` | POST | **Active** | `type`, `toolId`, `...` | Unified event tracking for all actions |
| `/analytics/event` | POST | **Legacy** | n/a | Replaced by unified `/analytics/track` |
| `/analytics/tool-run` | POST | **Legacy** | n/a | Replaced by unified `/analytics/track` |

---

## 💳 Billing (`/billing`)
Managed in `lib/api/services/billing.ts`

| Endpoint | Method | Status | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `Web Dashboard` | `Redirect` | **Active** | - | Users are redirected to the web dashboard for checkout and plan management. |
| `/billing/portal` | `POST` | **Placeholder** | - | Potential future endpoint for direct Dodo Payments portal access. |

---

## 🔔 Notifications (`/notifications`)
Managed in `lib/api/services/notifications.ts`

| Endpoint | Method | Status | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/notifications/send` | POST | **Active** | `message`, `channels` | Triggers alerts for schedule events |

---

## 📋 Audit Summary & Recommendations
- **Verified Activity:** Most endpoints are actively utilized and critical for extension operation.
- **Redundancy:** `/user/usage` and `/user/limits` have overlapping data; consider merging.
- **Cleanup:** `/features/available` is no longer called by the extension and can be retired.
- **Normalization:** `/analytics/track` successfully consolidated legacy tracking routes.
- **Payment Provider:** Confirmed usage of **Dodo Payments**. The extension currently delegates subscription management to the web dashboard.
- **Placeholders:** `/integrations/sync` is the functional placeholder found during the audit.

*Generated for AMZBoosted Technical Inventory Oversight.*

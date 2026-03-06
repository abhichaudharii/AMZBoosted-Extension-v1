# Extension-Side Credit Refund Implementation Guide

This guide details how to implement the credit refund logic in the Chrome extension for failed tasks.

## Overview

When a task fails after credits have already been deducted (e.g., scraping failure, network error, or incomplete data), the extension must trigger the refund endpoint to return the credits to the user's balance.

## Endpoint Details

- **URL:** `/api/v1/credits/refund`
- **Method:** `POST`
- **Authentication:** Required (Standard Auth Header)

### Request Payload

```typescript
interface RefundRequest {
  taskId: string;        // ID of the failed task
  transactionId: string; // ID of the original credit deduction transaction
  amount: number;        // Amount of credits to refund (positive integer)
}
```

### Response

```typescript
interface RefundResponse {
  success: boolean;
  refunded: number;      // Amount successfully refunded
  newBalance: number;    // User's updated credit balance
}
```

## Implementation Steps

### 1. Store Transaction IDs Locally

When a task starts and credits are deducted, you **must** store the `transactionId` returned by the deduction endpoint. You will need this ID to process a refund later if the task fails.

**Suggestion:** Store this in your local task state or storage.

```typescript
// Example State Object
interface TaskState {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  creditTransactionId?: string; // <--- IMPORTANT: Store this
  creditsDeducted: number;
}
```

### 2. Identify Failure Conditions

Determine what constitutes a "refundable failure". Common scenarios:
- **Scraping Error:** The scraper failed to retrieve data for a specific URL.
- **Validation Error:** The data is incomplete or invalid.
- **Timeout:** The operation took too long and was aborted.

**Note:** Do not refund for user-cancelled tasks unless that is your specific business logic.

### 3. Call Refund API

Create a helper function to call the API.

```typescript
async function refundCredits(taskId: string, transactionId: string, amount: number) {
  try {
    const response = await fetch('https://your-api-domain.com/api/v1/credits/refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}` // Your auth token retrieval logic
      },
      body: JSON.stringify({
        taskId,
        transactionId,
        amount
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Refund failed:', errorData);
        return false;
    }

    const result = await response.json();
    console.log(`Refund successful: ${result.refunded} credits returned. New balance: ${result.newBalance}`);
    return true;

  } catch (error) {
    console.error('Network error during refund:', error);
    return false;
  }
}
```

### 4. Integration Example

Here is how you might integrate this into your main task runner loop.

```typescript
async function processTask(task: Task) {
    let transactionId = null;
    const cost = 5; // Example cost

    try {
        // 1. Deduct Credits
        const deduction = await deductCredits(task.id, cost); // Your deduction logic
        if (!deduction.success) throw new Error("Insufficient credits");
        
        transactionId = deduction.transactionId; // Store this!

        // 2. Perform Work
        const data = await performScraping(task.url);
        
        if (!data) {
            throw new Error("Scraping failed - no data");
        }

        // 3. Success - Save data
        await saveData(task.id, data);

    } catch (error) {
        console.error(`Task ${task.id} failed:`, error);
        
        // 4. FAILURE HANDLING - REFUND
        if (transactionId) {
            console.log(`Attempting refund for task ${task.id}...`);
            await refundCredits(task.id, transactionId, cost);
        }
        
        updateTaskStatus(task.id, 'failed', error.message);
    }
}
```

## Best Practices

1.  **Idempotency:** The API checks for duplicate refunds, but you should also update your local task state to `refunded` to prevent UI controls from triggering multiple calls.
2.  **Rate Limiting:** The API limits user refunds to **10 per hour**. Implement client-side logic to handle `429 Too Many Requests` gracefully (e.g., fail the task without refund and notify support if mass failures occur).
3.  **Partial Refunds:** The API supports partial refunds (e.g., if a task partially succeeded). Just send an `amount` less than the original deduction.

# Split PR Feature - Remaining Amount Implementation

## Feature Overview
When splitting a Purchase Requisition (PR), the system now:
1. ✅ **Prevents splitting all items** - User must always leave at least one item in the original PR
2. ✅ **Calculates remaining amount** - Original PR updated with only remaining items
3. ✅ **Displays remaining amount** - Modal shows original total, split amount, and remaining amount
4. ✅ **Creates split PRs** - Each split item becomes a new PR with correct amount
5. ✅ **Marks original as split** - Original PR status changed to "Split" and removed from queues

## Implementation Details

### 1. SimpleItemSplitModal.tsx - User Interface
**Location:** `src/components/SimpleItemSplitModal.tsx`

**Validation (lines 43-50):**
```typescript
if (selectedItems.length === purchaseRequisition.items.length) {
  toast({
    title: "Invalid Selection",
    description: "Leave at least one item in the original PR.",
    variant: "destructive"
  });
  return;
}
```

**Remaining Amount Display (lines 172-207):**
- Shows original total amount in blue
- Shows selected items amount in purple
- Shows remaining in original in green (or red if trying to split all)
- Error message if remaining <= 0

**Split Button Status (line 216):**
```typescript
disabled={isSubmitting || selectedItems.length === 0 || remainingTotal <= 0}
```
Button is disabled when remaining amount would be zero or negative.

**Data Format (lines 55-73):**
```typescript
splitData.push({
  items: [{ ...item }],
  totalAmount: itemAmount,
  notes: `Split from original PR: Item "${item.description}"`,
  originalItemIndex: itemIndex  // ← NEW: Track which items are being split
});

onSplit({
  splitPRs: splitData,
  selectedItemNames: selectedItems.map(idx => purchaseRequisition.items[idx].description),
  selectedItemIndices: selectedItems  // ← NEW: Pass all selected indices
});
```

### 2. purchaseRequisitionService.ts - Business Logic
**Location:** `src/services/purchaseRequisitionService.ts`
**Function:** `splitRequisition(prId, splits, splitterName, splitterRole)`

**Calculate Remaining Items (lines 589-612):**
```typescript
// Get the indices of items being split (either from originalItemIndex or by matching)
const splitItemIndices = new Set<number>();
splits.forEach(split => {
  if (split.originalItemIndex !== undefined) {
    // Use provided index for accurate matching
    splitItemIndices.add(split.originalItemIndex);
  } else {
    // Fallback: match items by description, quantity, and unit price
    split.items.forEach((splitItem: any) => {
      originalPR.items.forEach((item: any, idx: number) => {
        if (
          item.description === splitItem.description &&
          item.quantity === splitItem.quantity &&
          parseFloat(item.unitPrice) === parseFloat(splitItem.unitPrice)
        ) {
          splitItemIndices.add(idx);
        }
      });
    });
  }
});

// Calculate remaining items and amount
const remainingItems = originalPR.items.filter((_: any, idx: number) => !splitItemIndices.has(idx));
const remainingAmount = remainingItems.reduce((sum: number, item: any) => 
  sum + (parseFloat(item.totalPrice) || 0), 0
);
```

**Update Original PR (lines 614-633):**
```typescript
const { error: updateError } = await supabase
  .from('purchase_requisitions')
  .update({
    status: 'Split',                    // Mark as split
    items: remainingItems,              // Update to remaining items only
    total_amount: remainingAmount,      // Update to remaining amount
    history: [
      ...originalPR.history,
      {
        action: 'Split Processed',
        by: splitterName,
        role: splitterRole,
        timestamp,
        splitInto: splitIds,
        remainingAmount: remainingAmount,  // Track remaining for audit
        itemsSplit: splits.length         // Track how many splits
      }
    ]
  })
  .eq('id', prId);
```

### 3. Portal Handlers - Integration

**HODPortal.tsx (lines 157-195):**
```typescript
const handleSplitPR = async (prId: string, splitData: any) => {
  try {
    const splitItems = splitData.splitPRs || [];
    
    // Calls service with split data (includes originalItemIndex)
    await prService.splitRequisition(
      prId,
      splitItems,  // ← Contains originalItemIndex from modal
      user?.name || 'Unknown',
      'HOD'
    );
    
    await loadPurchaseRequisitions();
    
    toast({
      title: "Transaction Split Successfully",
      description: `Created ${splitItems.length} new PR${splitItems.length !== 1 ? 's' : ''}.`
    });
  } catch (error) {
    // Error handling
  }
};
```

**FinancePortal.tsx (lines 156-194):**
- Identical to HODPortal, but with `'Finance'` role

**Dashboard.tsx (lines 228-274):**
- Identical flow but with `'Employee'` role

## Workflow Example

### Initial PR
```
PR ID: PR-001
Items:
  1. Laptops × 5 @ ZAR 2,000 each = ZAR 10,000
  2. Desks × 3 @ ZAR 1,000 each = ZAR 3,000
Total Amount: ZAR 13,000
Status: PENDING_HOD_APPROVAL
```

### User Selects Item 1 (Laptops) to Split
```
Modal Shows:
- Original Total:     ZAR 13,000 (blue)
- Selected Items:     ZAR 10,000 (purple)
- Remaining:          ZAR 3,000  (green) ✓
- Split Button:       Enabled
```

### After Split
```
Original PR (PR-001):
  Status:       Split
  Items:        Desks × 3 @ ZAR 1,000 each = ZAR 3,000
  Total:        ZAR 3,000
  Removed From: All approval queues

New PR (PR-001-SPLIT-1):
  Status:       PENDING_HOD_APPROVAL
  Items:        Laptops × 5 @ ZAR 2,000 each = ZAR 10,000
  Total:        ZAR 10,000
  Appears In:   HOD/Finance approval queue
  History:      [Original history + Split Processed entry]
```

## Validation Rules

### ✅ Valid Split Operations
- Original PR: 2+ items
- Select 1 item: Remaining = 1 item ✓
- Select N-1 items: Remaining = 1+ items ✓

### ❌ Invalid Split Operations
- Select 0 items: Error "Please select at least one item"
- Select all items: Error "Leave at least one item in the original PR"
- No remaining amount: Button disabled, error message shown

## Data Integrity

### Original PR After Split
```
{
  status: 'Split',                    // Marks as split
  items: [/* remaining items only */],
  total_amount: remainingAmount,      // Updated to remaining
  updated_at: new Date(),
  history: [
    ...original history,
    {
      action: 'Split Processed',
      by: 'HOD Name',
      role: 'HOD',
      timestamp: '2025-01-15T10:30:00Z',
      splitInto: ['new-pr-id-1', 'new-pr-id-2'],
      remainingAmount: 3000,          // Audit trail
      itemsSplit: 2
    }
  ]
}
```

### New Split PRs
```
Each split PR has:
- status: 'PENDING_HOD_APPROVAL'
- items: [/* split item(s) */]
- total_amount: splitAmount
- requested_by: original requester
- requested_by_name: original requester name
- requested_by_department: original department
- organization_id: original organization
- history: [original history + Split Processed entry]
```

## Database Constraints

### Status Constraint
```sql
CHECK (status IN ('PENDING_HOD_APPROVAL', 'PENDING_FINANCE_APPROVAL', 'APPROVED', 'DECLINED', 'Split'))
```

### Valid Status Values
| Status | Used For | Workflow |
|--------|----------|----------|
| PENDING_HOD_APPROVAL | New & split PRs | Awaiting HOD review |
| PENDING_FINANCE_APPROVAL | HOD approved | Awaiting Finance review |
| APPROVED | Finance approved | Complete approval |
| DECLINED | Any rejection | Rejected by HOD or Finance |
| Split | Original after split | Removed from queues |

## Testing Checklist

### Test 1: Cannot Split All Items
- [ ] Login as HOD/Finance
- [ ] Find PR with 2+ items
- [ ] Click Split
- [ ] Try to select all items
- [ ] ❌ Verify: Button disabled, error shown

### Test 2: Split Leaves Remaining Amount
- [ ] Select 1 item (not all)
- [ ] Verify remaining amount shown in green
- [ ] ✅ Verify: Split button enabled
- [ ] Click Split
- [ ] ✅ Verify: No errors

### Test 3: Remaining Amount in Original PR
- [ ] After split, check original PR
- [ ] ✅ Verify: Status = "Split"
- [ ] ✅ Verify: Items = only remaining items
- [ ] ✅ Verify: Total Amount = sum of remaining items
- [ ] ✅ Verify: Original PR removed from approval queues

### Test 4: New Split PR Created
- [ ] ✅ Verify: New PR appears in approval queue
- [ ] ✅ Verify: New PR has status "PENDING_HOD_APPROVAL"
- [ ] ✅ Verify: New PR contains split items only
- [ ] ✅ Verify: New PR amount = sum of split items
- [ ] ✅ Verify: New PR has same requester as original

### Test 5: Approval After Split
- [ ] Finalize split PR
- [ ] Approve it
- [ ] ✅ Verify: No errors
- [ ] ✅ Verify: Split PR status changes appropriately
- [ ] ✅ Verify: Both original (remaining) and split PRs can be approved independently

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Leave at least one item in the original PR" | Selected all items | Select fewer items, leave some in original |
| "Please select at least one item to split" | No items selected | Select items to split |
| Split button disabled with red remaining | Remaining amount ≤ 0 | Select fewer items |
| Database constraint error | Invalid status value | Use valid status ('Split' is valid) |

## Summary
- ✅ SimpleItemSplitModal prevents selecting all items
- ✅ Remaining amount calculated and displayed
- ✅ Original PR updated with remaining items only
- ✅ Original PR marked as "Split" and removed from queues
- ✅ New split PRs created with correct amounts
- ✅ All data integrity maintained
- ✅ Audit trail preserved in history

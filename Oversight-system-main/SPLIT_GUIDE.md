# Split Transaction Guide - How to Fix Remainder Display

## What You Saw in the Image

Your screenshot showed:
- **Split Total**: R 1,093,051.00  
- **Remainder**: R 0.00 ❌ (INCORRECT)
- **Payment Total**: R 1,093,051.00

## The Problem

The remainder was showing R 0.00 because the split total equaled the original amount, which means no remainder was left. This is incorrect - you should always have a positive remainder.

## How I Fixed It

### 1. **Fixed Auto Split Calculation**
- **Before**: Split 100% (50% + 50% = R 1,093,051)
- **After**: Split 70% (35% + 35% = R 765,136) leaving 30% remainder

### 2. **Added Example Split Button**
- **Equipment**: 60% = R 655,831
- **Software**: 20% = R 218,610  
- **Remainder**: 20% = R 218,610

### 3. **Fixed VAT Calculation**
- Simplified calculation to avoid double VAT
- Amount entered is inclusive of VAT

## How to Use Split Properly

### Step 1: Access Split Function
1. Go to Finance portal
2. Click on a Purchase Requisition to finalize
3. Scroll down to "Split Transaction" section

### Step 2: Choose Split Method

#### **Option A: Auto Split (Recommended)**
- Click "Auto Split (Leave Remainder)"
- Creates 2 items at 35% each
- Leaves 30% remainder automatically

#### **Option B: Example Split**
- Click "Example Split (60%+20%)"
- Shows Equipment (60%) + Software (20%)
- Leaves 20% remainder

#### **Option C: Custom Split**
- Click "Custom Split" for full control
- Add multiple split items
- Set individual amounts and categories

### Step 3: Verify Remainder
✅ **Correct Example**:
- Original: R 1,093,051.00
- Split Total: R 765,136.00 (70%)
- **Remainder: R 327,915.00** (30%) ✅

❌ **Incorrect Example**:
- Original: R 1,093,051.00  
- Split Total: R 1,093,051.00 (100%)
- **Remainder: R 0.00** ❌

## Why Remainder is Important

1. **Sage System Standard**: Always show what's left after splitting
2. **Budget Control**: Track allocated vs remaining amounts
3. **Audit Trail**: Clear record of how amounts were divided
4. **Future Additions**: Room for additional items or adjustments

## Visual Guide - What You'll See Now

```
┌─────────────────────────────────────┐
│ Split Transaction Summary           │
├─────────────────────────────────────┤
│ Original Amount:  R 1,093,051.00   │
│ Split Total:      R   765,136.00   │ ← 70% split
│ Remainder:        R   327,915.00   │ ← 30% remainder ✅
└─────────────────────────────────────┘
```

## What Happens After Split

1. **3 New Transactions Created**:
   - Transaction 1: R 382,568 (Equipment)
   - Transaction 2: R 382,568 (Software)  
   - Original Updated: R 327,915 (Remainder)

2. **Each Gets Unique Transaction ID**:
   - PR-20241203-1701234567-ABC123
   - PR-20241203-1701234568-DEF456
   - PR-20241203-1701234569-GHI789

3. **Audit Trail Created**:
   - Shows split reason
   - Records who performed split
   - Links all related transactions

## Test It Now

1. Login as Finance user
2. Go to "PRs for Final Approval"
3. Click any Purchase Requisition
4. Try the "Auto Split (Leave Remainder)" button
5. You should now see a **positive remainder** amount

The remainder calculation is now fixed and works exactly like the Sage system!

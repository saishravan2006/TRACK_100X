# Database Reset Migration Instructions

## Overview
This migration file (`99999999999999-complete-database-reset.sql`) provides a complete database reset that:

1. **Drops all existing tables** and their dependencies
2. **Recreates all tables** with the correct structure based on your application code
3. **Implements proper Row Level Security (RLS)** for user data isolation
4. **Includes all necessary functions and triggers** for automatic balance calculations
5. **Adds performance indexes** for better query performance

## What This Migration Does

### Tables Created:
- **`students`** - Student information with fees and user isolation
- **`classes`** - Class schedules with recurring class support
- **`payments`** - Payment transactions with multiple payment methods
- **`student_balances`** - Automatic balance tracking per student
- **`payment_uploads`** - Excel upload session tracking
- **`payment_errors`** - Error logging for failed uploads
- **`payments_archive`** - Archive table for monthly resets

### Key Features:
- **User Data Isolation**: All tables include `user_id` with RLS policies
- **Automatic Balance Calculation**: Triggers update student balances on payment insertion
- **Comprehensive Error Handling**: Proper constraints and validation
- **Performance Optimized**: Indexes on frequently queried columns

## How to Apply This Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# Navigate to your project directory
cd "c:\Users\Empir\Downloads\TRACK 100x\track-excel-flow"

# Apply the migration
npx supabase db reset
```

### Option 2: Manual Application
1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `99999999999999-complete-database-reset.sql`
4. Execute the SQL

### Option 3: Using Supabase Migration Command
```bash
# Push the migration to your remote database
npx supabase db push
```

## Important Notes

⚠️ **WARNING: This migration will DELETE ALL existing data in your database!**

### Before Running:
1. **Backup your data** if you have important information
2. **Test in a development environment** first
3. **Ensure you have the latest Supabase CLI** installed

### After Running:
1. **Test student creation** functionality
2. **Verify RLS policies** are working correctly
3. **Check that user data isolation** is functioning
4. **Test payment processing** and balance calculations

## Schema Structure

### Students Table
```sql
- id (UUID, Primary Key)
- student_id (TEXT, Unique)
- name (TEXT, Required)
- email (TEXT)
- phone (TEXT)
- class_name (TEXT, Required)
- fees (DECIMAL, Required)
- notes (TEXT)
- user_id (UUID, Foreign Key to auth.users)
- created_at, updated_at (Timestamps)
```

### Classes Table
```sql
- id (UUID, Primary Key)
- class_name (TEXT, Required)
- location (TEXT, Required)
- fees (DECIMAL)
- start_time, end_time (TIME)
- date (DATE)
- notes (TEXT)
- repeat_days (TEXT[])
- class_type (single/recurring)
- user_id (UUID, Foreign Key)
- created_at, updated_at (Timestamps)
```

### Payments Table
```sql
- id (UUID, Primary Key)
- student_id (UUID, Foreign Key)
- amount (DECIMAL, Required)
- payment_date (DATE)
- status (PAID/PENDING/EXCESS)
- method (Excel Upload/Manual Entry/Cash/Online/Bank Transfer)
- remarks (TEXT)
- transaction_ref (TEXT)
- user_id (UUID, Foreign Key)
- created_at, updated_at (Timestamps)
```

## Troubleshooting

### If Migration Fails:
1. Check Supabase connection
2. Verify you have proper permissions
3. Ensure no active connections to the database
4. Try running the SQL manually in chunks

### If Student Creation Still Fails:
1. Check browser console for detailed errors
2. Verify user authentication
3. Test RLS policies manually
4. Check if all required fields are provided

### Common Issues:
- **Authentication Error**: Ensure user is logged in
- **RLS Policy Violation**: Check user_id matches authenticated user
- **Missing Required Fields**: Verify all required fields are provided
- **Constraint Violations**: Check data types and constraints

## Testing the Migration

After applying the migration, test these functionalities:

1. **User Registration/Login**
2. **Student Creation** with all required fields
3. **Class Scheduling** and management
4. **Payment Processing** and balance updates
5. **Excel Upload** functionality
6. **Data Isolation** (users can only see their own data)

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Review the Supabase logs in your dashboard
3. Verify the migration was applied completely
4. Test with a fresh user account

This migration should resolve all database-related issues and provide a clean, properly structured database that matches your application requirements.
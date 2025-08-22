# ProcureFlow - Comprehensive Procurement Management System

A modern, full-featured procurement management application built with React, TypeScript, and advanced UI components. This system provides end-to-end purchase requisition management with role-based access control, advanced analytics, and comprehensive admin capabilities.

![ProcureFlow Logo](https://via.placeholder.com/800x200/4F46E5/FFFFFF?text=ProcureFlow+-+Professional+Procurement+Management)

## 🚀 Features Implemented

### 1. Professional Procurement Terminology
- **Purchase Requisition (PR)**: Internal request to the procurement team to purchase goods/services
- **Request for Quotation (RFQ)**: Document sent to suppliers asking for price quotes
- **Request for Proposal (RFP)**: Document inviting suppliers to submit proposals for large or complex projects
- **Purchase Order (PO)**: Formal order sent to a supplier once a purchase is approved
- **Goods Received Note (GRN)**: A confirmation that goods have been received
- **Invoice**: Bill sent by the supplier to request payment
- **Proof of Delivery (POD)**: Document signed by the buyer confirming delivery was successful
- **Three-Way Match**: Process that matches the PO, GRN, and Invoice to authorize payment

### 2. Enhanced Purchase Requisition Form
- ✅ **VAT Classification**: Select between "VAT Applicable" or "No VAT"
- ✅ **Due Dates**: Approval due date and payment due date fields
- ✅ **Transaction ID**: Automatic reference number generation (e.g., PR-20241201-1703123456789-ABC123)
- ✅ **Professional Fields**: Technical specifications, business justification, supporting documents
- ✅ **Amount Tracking**: ZAR currency formatting and validation
- ✅ **Multi-Item Support**: Add multiple items with individual VAT classifications
- ✅ **Urgency Levels**: Low, Normal, High, Urgent priority settings
- ✅ **Budget Codes**: Project and budget code tracking
- ✅ **Delivery Locations**: Specific delivery requirements

### 3. Split Functionality
- ✅ **Split Purchase Requisitions**: Finance and HOD can split requests with multiple items
- ✅ **Automatic Calculation**: Split total, remainder, and payment total tally
- ✅ **Individual Items**: Each split item gets its own VAT classification and specifications
- ✅ **Validation**: Ensures split amounts don't exceed original amount
- ✅ **Audit Trail**: Maintains complete history of split operations
- ✅ **Supplier Preferences**: Different suppliers for split items

### 4. Finalization System
- ✅ **Finalization Modal**: Professional approval workflow for Finance and HOD
- ✅ **HOD Finalize Report**: Special button for HOD to finalize reports
- ✅ **Approval Comments**: Required comments for all approval decisions
- ✅ **Payment Terms**: Optional payment terms and supplier details
- ✅ **Expected Delivery**: Delivery date tracking for approved requests
- ✅ **Risk Assessment**: Risk evaluation and compliance notes
- ✅ **Budget Confirmation**: Finance budget approval confirmation
- ✅ **Alternative Options**: Suggestions for declined requests

### 5. Enhanced Analytics
- ✅ **Date Range Filtering**: Monthly, quarterly, yearly, custom ranges
- ✅ **Approval Rate Analysis**: Detailed breakdown by date ranges
- ✅ **Group By Options**: Month, quarter, year, department, status
- ✅ **Comparison Tools**: Compare with previous periods or same period last year
- ✅ **Interactive Charts**: Visual representation of procurement data
- ✅ **KPI Dashboard**: Real-time procurement metrics
- ✅ **Value Analysis**: Financial impact tracking

### 6. Super Admin Panel
- ✅ **User Management**: Add, edit, delete users with role-based access
- ✅ **Email System**: Send emails with templates to users
- ✅ **Email Templates**: Pre-configured templates for approvals, rejections, reminders
- ✅ **System Statistics**: Overview of users, departments, and system usage
- ✅ **Role Management**: Employee, HOD, Finance, Admin, SuperUser roles
- ✅ **Template Editor**: Create and modify email templates with placeholders
- ✅ **System Settings**: SMTP configuration, security policies
- ✅ **Maintenance Tools**: Data export, backups, system maintenance

### 7. Role-Based Access Control
- ✅ **Employee Portal**: Submit purchase requisitions, view own requests
- ✅ **HOD Portal**: Approve employee requests, split requests, finalize reports
- ✅ **Finance Portal**: Final approval, split requests, comprehensive analytics
- ✅ **Admin Portal**: User management, email capabilities, system oversight
- ✅ **Super Admin**: Full system access, template management, system settings

## 🔐 Login Credentials

| Role | Email | Password | Access |
|------|-------|----------|---------|
| Employee | employee@company.com | password | Submit PRs, view own requests |
| HOD | hod@company.com | password | Approve employee PRs, split requests, finalize reports |
| Finance | finance@company.com | password | Final approval, analytics, split requests |
| Admin | admin@company.com | password | User management, email system |
| Super Admin | superuser@company.com | password | Full system access, templates, settings |

## 📊 Analytics Features

### Date Range Options
- **All Time**: Complete historical data
- **Month to Date**: Current month's data
- **Quarter to Date**: Current quarter's data
- **Year to Date**: Current year's data
- **Last Month**: Previous month's data
- **Last Quarter**: Previous quarter's data
- **Last Year**: Previous year's data
- **Custom Range**: User-defined date range

### Group By Options
- **Month**: Group data by month
- **Quarter**: Group data by quarter
- **Year**: Group data by year
- **Department**: Group by requesting department
- **Status**: Group by approval status
- **Urgency**: Group by priority level

### KPI Metrics
- **Total Purchase Requisitions**: Overall PR volume
- **Total Value**: Combined monetary value of all PRs
- **Approval Rate**: Percentage of approved requests
- **Pending Rate**: Percentage of pending requests
- **Decline Rate**: Percentage of declined requests
- **Average Processing Time**: Time from submission to approval
- **Budget Utilization**: Department-wise budget usage

## 🎯 Key Workflows

### Purchase Requisition Submission
1. Employee fills out PR form with VAT classification and due dates
2. System generates unique transaction ID
3. Request is routed to HOD for approval
4. HOD can approve, decline, or split the request using finalization modal
5. Approved requests go to Finance for final approval
6. Finance can approve, decline, or split the request
7. System sends email notifications based on templates

### Split Workflow
1. HOD/Finance identifies request with multiple items
2. Opens split modal with original request details
3. Defines individual items with amounts and specifications
4. System validates total split amount doesn't exceed original
5. Creates separate PR records for each item
6. Maintains audit trail linking to original request
7. Updates original PR with remaining amount

### Finalization Workflow
1. Approver opens finalization modal
2. Reviews PR details and business justification
3. Makes approve/decline decision with mandatory comments
4. For approvals: sets payment terms, delivery dates, supplier details
5. For declines: provides alternative suggestions
6. System updates PR status and sends notifications
7. Creates comprehensive audit trail

### Analytics Workflow
1. Select date range and grouping options
2. View filtered data in charts and tables
3. Click approval rate cards for detailed analysis
4. Analyze trends, patterns, and outliers
5. Export or share analytics reports
6. Compare with historical periods

## 🛠️ Technical Implementation

### Frontend Technologies
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for modern styling
- **Shadcn/ui** for premium UI components
- **Lucide React** for consistent icons
- **React Router** for seamless navigation
- **Recharts** for advanced data visualization
- **Date-fns** for date manipulation
- **React Hook Form** for form management

### Key Components
- `PurchaseRequisitionForm`: Enhanced PR submission with VAT and due dates
- `SplitPRModal`: Split functionality with validation and audit trail
- `FinalizationModal`: Professional approval workflow with comprehensive options
- `AdvancedAnalytics`: Comprehensive analytics with filtering and visualization
- `SuperAdminPanel`: Complete system administration interface
- `PurchaseRequisitionTable`: Enhanced table with professional procurement fields

### Data Storage
- **LocalStorage**: For demo purposes (replace with backend API)
- **Structured Data**: Properly normalized PR data with relationships
- **State Management**: React hooks for efficient component state
- **Audit Trail**: Complete history tracking for all operations

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Modern browser with ES6+ support

### Installation
1. **Clone or download the project**
   ```bash
   git clone [repository-url]
   cd procureflow
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open http://localhost:8080 (or shown port)
   - Login with any of the provided credentials
   - Explore different roles and features

### Build for Production
```bash
npm run build
npm run preview
```

## 📋 Usage Instructions

### For Employees
1. Login with employee credentials
2. Click "New Purchase Requisition"
3. Fill out comprehensive form with:
   - Multiple items with quantities and prices
   - VAT classifications per item
   - Technical specifications and business justification
   - Approval and payment due dates
   - Budget codes and project references
   - Supporting documents
4. Submit and track approval status through dashboard
5. Receive email notifications on status changes

### For HODs (Heads of Department)
1. Login with HOD credentials
2. View pending employee PRs with urgency indicators
3. Use finalization modal for comprehensive review:
   - Review all items and business justification
   - Assess risk and compliance requirements
   - Make approve/decline decision with comments
   - Set payment terms and delivery expectations
4. Split complex PRs into manageable components
5. Access departmental analytics and reports

### For Finance
1. Login with Finance credentials
2. Review PRs for final financial approval
3. Confirm budget availability and allocation
4. Use advanced splitting for vendor management
5. Access comprehensive procurement analytics
6. Monitor financial KPIs and budget utilization

### For Admins
1. Login with admin credentials
2. Manage users across all departments
3. Send targeted email communications
4. Monitor system usage and performance
5. Configure basic system settings

### For Super Admins
1. Login with super admin credentials
2. Complete user lifecycle management
3. Create and modify email templates
4. Configure system-wide settings:
   - SMTP and email configuration
   - Security policies and session management
   - Procurement rules and thresholds
5. Access system maintenance tools
6. Export data and generate comprehensive reports

## 🔧 Customization

### Adding New Email Templates
1. Access Super Admin panel
2. Navigate to "Email Templates" tab
3. Click "New Template"
4. Use available placeholders:
   - `{EMPLOYEE_NAME}` - Requestor's name
   - `{TRANSACTION_ID}` - PR reference number
   - `{AMOUNT}` - Total amount
   - `{APPROVER_NAME}` - Person approving/declining
   - `{DELIVERY_DATE}` - Expected delivery date
   - `{DECLINE_REASON}` - Reason for decline
   - `{ALTERNATIVES}` - Alternative suggestions
   - `{SPLIT_COUNT}` - Number of split items
   - `{PENDING_COUNT}` - Number of pending items

### Modifying User Roles
1. Access Super Admin panel
2. Edit user roles and permissions
3. Update role-based access controls in code
4. Test with different user accounts

### Customizing Workflows
1. Modify approval routes in PR submission
2. Adjust auto-approval thresholds
3. Configure escalation rules
4. Set up automated reminders

## 📈 Advanced Features

### Split Intelligence
- **Smart Detection**: Automatically suggests PRs suitable for splitting
- **Vendor Optimization**: Split by preferred suppliers
- **Budget Allocation**: Distribute across different budget codes
- **Delivery Scheduling**: Separate items by delivery requirements

### Email Automation
- **Template System**: Professional email templates with placeholders
- **Bulk Communications**: Send to groups (all HODs, all Finance, etc.)
- **Automated Notifications**: Status change notifications
- **Reminder System**: Automated pending approval reminders

### Analytics Intelligence
- **Predictive Analytics**: Forecast procurement patterns
- **Trend Analysis**: Identify seasonal and departmental trends
- **Performance Metrics**: Measure approval efficiency
- **Cost Analysis**: Track spending patterns and budget utilization

### Security Features
- **Role-Based Access**: Granular permission system
- **Audit Trail**: Complete action history with timestamps
- **Session Management**: Configurable timeout and security policies
- **Data Protection**: Secure handling of sensitive procurement data

## 🔒 Security Considerations

- All user actions are logged with complete audit trails
- Role-based access prevents unauthorized data access
- Session timeouts prevent unauthorized use
- Input validation prevents injection attacks
- File upload restrictions prevent malicious files

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop computers (optimal experience)
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)
- All major browsers (Chrome, Firefox, Safari, Edge)

## 🌟 Future Enhancements

- **API Integration**: Replace localStorage with real backend
- **Document Management**: Enhanced file storage and version control
- **Supplier Portal**: External supplier integration
- **Mobile App**: Native iOS and Android applications
- **Advanced Reporting**: PDF generation and scheduled reports
- **Integration**: ERP, accounting, and inventory system integration
- **AI Features**: Intelligent PR categorization and approval recommendations

## 🤝 Support

For technical support or feature requests:
- Review the comprehensive documentation above
- Test different user roles and workflows
- Utilize the Super Admin panel for system management
- Contact your system administrator for access issues

## 📄 License

This project is developed for demonstration purposes. Contact the development team for licensing information.

---

**ProcureFlow** - Streamlining procurement processes with modern technology and intelligent workflows.

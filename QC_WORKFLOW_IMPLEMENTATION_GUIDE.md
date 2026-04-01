# QC Workflow System - Implementation Guide

## 📋 Overview
Complete QC workflow system with Regular, Correction, and Rework statuses.

## ✅ Created Frontend Components

### 1. **QCHistoryTimeline.jsx** 
Location: `src/components/common/QCHistoryTimeline.jsx`
- Visual timeline showing complete QC workflow history
- Displays initial QC, corrections, and rework attempts
- Shows scores, errors, participants, and file links

### 2. **AgentQCReportPage.jsx**
Location: `src/pages/AgentQCReportPage.jsx`
- Agent-side QC report view
- Upload interface for rework files (multiple attempts)
- Upload interface for correction files (ONE attempt only)
- Status indicators and error details

### 3. **QAAgentQCFormReport.jsx**
Location: `src/components/dashboard/QAAgentQCFormReport.jsx`
- QA Agent view of all submitted QC forms
- Statistics dashboard
- Search and filter capabilities

### 4. **QAAgentReworkCorrectionReview.jsx**
Location: `src/components/dashboard/QAAgentReworkCorrectionReview.jsx`
- QA Agent review interface for rework/correction files
- Navigate to QC form for performing QC
- Track review attempts

### 5. **ManagerQCReportsOverview.jsx**
Location: `src/components/dashboard/ManagerQCReportsOverview.jsx`
- Manager/Admin comprehensive overview
- Advanced filtering by agent, QA, status, date
- Statistics cards with percentages
- Full history access

### 6. **Updated qcService.js**
Location: `src/services/qcService.js`
Added functions:
- `getAgentQCRecords(agent_id)`
- `getQAAgentQCRecords(qa_user_id)`
- `getPendingReviews(qa_user_id)`
- `uploadReworkFile(formData)`
- `uploadCorrectionFile(formData)`
- `getAllQCRecords(filters)`
- `getQCStatistics()`
- `submitReworkQC(payload)`
- `submitCorrectionQC(payload)`

---

## 🔧 Frontend Integration Steps

### Step 1: Update Routing

In your `src/routes/AppRoutes.jsx` or routing file:

```jsx
import AgentQCReportPage from '../pages/AgentQCReportPage';
import QAAgentQCFormReport from '../components/dashboard/QAAgentQCFormReport';
import QAAgentReworkCorrectionReview from '../components/dashboard/QAAgentReworkCorrectionReview';
import ManagerQCReportsOverview from '../components/dashboard/ManagerQCReportsOverview';

// Add routes based on user roles:

// For Agent role
<Route path="/agent/qc-reports" element={<AgentQCReportPage />} />

// For QA Agent role
<Route path="/qa/qc-forms" element={<QAAgentQCFormReport />} />
<Route path="/qa/review-files" element={<QAAgentReworkCorrectionReview />} />

// For Manager/Admin/SuperAdmin roles
<Route path="/manager/qc-overview" element={<ManagerQCReportsOverview />} />
```

### Step 2: Update Navigation/Sidebar

Add menu items based on user roles:

```jsx
// For Agents
{
  title: 'My QC Reports',
  path: '/agent/qc-reports',
  icon: <FileCheck />,
  roles: ['agent']
}

// For QA Agents
{
  title: 'QC Form Reports',
  path: '/qa/qc-forms',
  icon: <FileCheck />,
  roles: ['qa_agent']
},
{
  title: 'Review Files',
  path: '/qa/review-files',
  icon: <RefreshCw />,
  roles: ['qa_agent']
}

// For Managers/Admins
{
  title: 'QC Overview',
  path: '/manager/qc-overview',
  icon: <BarChart3 />,
  roles: ['manager', 'admin', 'superadmin']
}
```

### Step 3: Update Dashboard TabsNavigation

If you have tab-based navigation in dashboard, update the tabs:

For Agent Dashboard:
```jsx
const agentTabs = [
  { id: 'tracker', label: 'Tracker', icon: <Calendar /> },
  { id: 'qc_report', label: 'QC Reports', icon: <FileCheck /> }
];
```

For QA Agent Dashboard:
```jsx
const qaTabs = [
  { id: 'qc_forms', label: 'QC Forms', icon: <FileCheck /> },
  { id: 'review_files', label: 'Review Files', icon: <RefreshCw /> },
  { id: 'audit', label: 'Audit', icon: <Award /> }
];
```

---

## 🗄️ Backend Implementation Guide

### Backend API Endpoints Required

Create these endpoints in your **qc-backend** (Node.js/TypeScript):

```typescript
// routes/qc-records.routes.ts

// Agent endpoints
router.get('/qc-records/agent/:agentId', getAgentQCRecords);
router.post('/qc-records/upload-rework', uploadReworkFile);
router.post('/qc-records/upload-correction', uploadCorrectionFile);

// QA Agent endpoints
router.get('/qc-records/qa-agent/:qaId', getQAAgentQCRecords);
router.get('/qc-records/pending-review/:qaId', getPendingReviews);
router.post('/qc-records/review-rework', reviewReworkFile);
router.post('/qc-records/review-correction', reviewCorrectionFile);

// Manager/Admin endpoints
router.get('/qc-records/all', getAllQCRecords);
router.get('/qc-records/statistics', getQCStatistics);
```

### Controller Implementation Examples

#### 1. Get Agent QC Records
```typescript
export const getAgentQCRecords = async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Query main QC records
    const qcRecords = await db.query(`
      SELECT 
        qr.*,
        u1.user_name as agent_name,
        u2.user_name as qa_user_name,
        p.project_name,
        t.task_name
      FROM qc_records qr
      LEFT JOIN users u1 ON qr.agent_id = u1.user_id
      LEFT JOIN users u2 ON qr.qa_user_id = u2.user_id
      LEFT JOIN projects p ON qr.project_id = p.project_id
      LEFT JOIN tasks t ON qr.task_id = t.task_id
      WHERE qr.agent_id = ?
      ORDER BY qr.created_at DESC
    `, [agentId]);
    
    // Get correction history for each record
    for (const record of qcRecords) {
      const corrections = await db.query(`
        SELECT * FROM qc_correction_history
        WHERE qc_record_id = ?
        ORDER BY created_at DESC
      `, [record.id]);
      
      const reworks = await db.query(`
        SELECT * FROM qc_rework_history
        WHERE qc_record_id = ?
        ORDER BY created_at DESC
      `, [record.id]);
      
      record.correction_history = corrections;
      record.rework_history = reworks;
    }
    
    res.json({ success: true, data: qcRecords });
  } catch (error) {
    console.error('Error fetching agent QC records:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

#### 2. Upload Rework File
```typescript
export const uploadReworkFile = async (req, res) => {
  try {
    const { qc_record_id, agent_id } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: 'hrms/rework_files',
      resource_type: 'raw'
    });
    
    // Get current rework count
    const reworkCount = await db.query(`
      SELECT COUNT(*) as count 
      FROM qc_rework_history 
      WHERE qc_record_id = ?
    `, [qc_record_id]);
    
    // Create rework history entry
    await db.query(`
      INSERT INTO qc_rework_history 
      (qc_record_id, rework_file_path, rework_count, rework_status, created_at)
      VALUES (?, ?, ?, 'rework', NOW())
    `, [qc_record_id, uploadResult.secure_url, (reworkCount[0].count || 0) + 1]);
    
    // Send email notification to QA Agent
    // await sendEmailNotification(...);
    
    res.json({ 
      success: true, 
      message: 'Rework file uploaded successfully',
      file_path: uploadResult.secure_url
    });
  } catch (error) {
    console.error('Error uploading rework file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

#### 3. Upload Correction File (Similar with ONE attempt limit)
```typescript
export const uploadCorrectionFile = async (req, res) => {
  try {
    const { qc_record_id, agent_id } = req.body;
    const file = req.file;
    
    // Check if correction already submitted
    const existingCorrection = await db.query(`
      SELECT * FROM qc_correction_history 
      WHERE qc_record_id = ?
    `, [qc_record_id]);
    
    if (existingCorrection.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Correction file already submitted. Only one attempt allowed.' 
      });
    }
    
    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: 'hrms/correction_files',
      resource_type: 'raw'
    });
    
    // Create correction history entry
    await db.query(`
      INSERT INTO qc_correction_history 
      (qc_record_id, correction_file_path, correction_count, correction_status, created_at)
      VALUES (?, ?, 1, 'correction', NOW())
    `, [qc_record_id, uploadResult.secure_url]);
    
    res.json({ 
      success: true, 
      message: 'Correction file uploaded successfully',
      file_path: uploadResult.secure_url
    });
  } catch (error) {
    console.error('Error uploading correction file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

#### 4. Get Pending Reviews for QA
```typescript
export const getPendingReviews = async (req, res) => {
  try {
    const { qaId } = req.params;
    
    const pendingReviews = [];
    
    // Get pending rework files
    const reworks = await db.query(`
      SELECT 
        rh.*,
        qr.*,
        u.user_name as agent_name,
        p.project_name,
        t.task_name
      FROM qc_rework_history rh
      INNER JOIN qc_records qr ON rh.qc_record_id = qr.id
      INNER JOIN users u ON qr.agent_id = u.user_id
      LEFT JOIN projects p ON qr.project_id = p.project_id
      LEFT JOIN tasks t ON qr.task_id = t.task_id
      WHERE qr.qa_user_id = ? 
        AND rh.rework_status = 'rework'
      ORDER BY rh.created_at DESC
    `, [qaId]);
    
    reworks.forEach(r => {
      pendingReviews.push({
        ...r,
        review_type: 'rework',
        file_path: r.rework_file_path,
        attempt_count: r.rework_count
      });
    });
    
    // Get pending correction files
    const corrections = await db.query(`
      SELECT 
        ch.*,
        qr.*,
        u.user_name as agent_name,
        p.project_name,
        t.task_name
      FROM qc_correction_history ch
      INNER JOIN qc_records qr ON ch.qc_record_id = qr.id
      INNER JOIN users u ON qr.agent_id = u.user_id
      LEFT JOIN projects p ON qr.project_id = p.project_id
      LEFT JOIN tasks t ON qr.task_id = t.task_id
      WHERE qr.qa_user_id = ? 
        AND ch.correction_status = 'correction'
      ORDER BY ch.created_at DESC
    `, [qaId]);
    
    corrections.forEach(c => {
      pendingReviews.push({
        ...c,
        review_type: 'correction',
        file_path: c.correction_file_path,
        attempt_count: c.correction_count
      });
    });
    
    res.json({ success: true, data: pendingReviews });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 📧 Email Notifications

### Email Templates Required

1. **QC Status - Regular (Passed)**
   - To: Agent
   - Subject: "✅ QC Passed - [Project Name]"
   - Content: Congratulations message

2. **QC Status - Correction Required**
   - To: Agent
   - Subject: "⚠️ Correction Required - [Project Name]"
   - Content: Upload correction file (one attempt)

3. **QC Status - Rework Required**
   - To: Agent
   - Subject: "🔄 Rework Required - [Project Name]"
   - Content: Fix errors and resubmit

4. **File Uploaded - Notification to QA**
   - To: QA Agent
   - Subject: "📥 New File for Review - [Agent Name]"
   - Content: Rework/Correction file ready for QC

5. **Final Status - Correction Passed/Failed**
   - To: Agent
   - Subject: Based on result
   - Content: No more attempts if failed

---

## 🔄 Complete Workflow Flow

### Regular Flow (100% Score)
1. QA performs QC → Score: 100%
2. Status: `regular`
3. Email to Agent: "Passed ✅"
4. Display in all reports as passed
5. **END**

### Correction Flow (98-99.99% Score)
1. QA performs QC → Score: 98-99.99%
2. Status: `correction`
3. Email to Agent: "Upload correction file"
4. Agent uploads correction file (ONE attempt)
5. Entry created in `qc_correction_history`
6. Email to QA: "Review correction file"
7. QA performs QC on correction file
8. **If Passed**: Status → `completed`, Email: "Passed ✅", **END**
9. **If Failed**: Status → `completed` (no changes allowed), Email: "Failed ❌", **END**

### Rework Flow (<98% Score)
1. QA performs QC → Score: <98%
2. Status: `rework`
3. Email to Agent: "Upload rework file"
4. Agent uploads rework file
5. Entry created in `qc_rework_history`
6. Email to QA: "Review rework file"
7. QA performs QC on rework file
8. **If Score >= 98**: Go to Correction Flow
9. **If Score < 98**: Repeat Rework Flow (cycle continues)
10. **If Score = 100%**: Status → `regular`, Email: "Passed ✅", **END**

---

## 🎨 UI/UX Features

### Color Coding
- **Green**: Passed (Regular, 100%)
- **Yellow**: Correction Required (98-99.99%)
- **Red**: Rework Required (<98%)

### Icons
- ✅ CheckCircle2: Passed
- ⚠️ AlertCircle: Correction
- 🔄 RefreshCw: Rework
- 📊 BarChart3: Statistics
- 👤 User: Agent/QA
- 📅 Calendar: Dates

### Responsive Design
- Mobile-friendly tables
- Scrollable dropdowns
- Touch-friendly buttons
- Adaptive grid layouts

---

## 🧪 Testing Checklist

- [ ] Agent can view QC reports
- [ ] Agent can upload rework files (multiple times)
- [ ] Agent can upload correction file (ONE time only)
- [ ] QA sees pending reviews
- [ ] QA can perform QC on rework/correction files
- [ ] Manager sees all QC activities
- [ ] Filters work correctly
- [ ] History timeline displays properly
- [ ] Email notifications sent
- [ ] File downloads work
- [ ] Correction attempt limit enforced
- [ ] Rework cycle functions correctly
- [ ] Status transitions accurately

---

## 📱 Mobile Responsiveness

All components use:
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` for adaptive layouts
- `overflow-x-auto` for table scrolling
- `flex-col md:flex-row` for flexible layouts
- Touch-friendly button sizes (min `py-2.5`)

---

## 🚀 Deployment Checklist

### Frontend
- [ ] Install dependencies: `npm install`
- [ ] Build: `npm run build`
- [ ] Test routes
- [ ] Verify API endpoints

### Backend
- [ ] Create database tables (qc_records, qc_correction_history, qc_rework_history)
- [ ] Implement API endpoints
- [ ] Configure Cloudinary
- [ ] Setup email service
- [ ] Test file uploads
- [ ] Deploy to server

---

## 📚 Additional Notes

- All dates use format: "DD MMM YYYY, HH:MM AM/PM"
- File uploads support: .xlsx, .xls, .csv
- Maximum file size should be configured in backend
- Cloudinary folders: `hrms/qc_samples`, `hrms/rework_files`, `hrms/correction_files`
- Error lists stored as JSON in database

---

**Created by**: GitHub Copilot  
**Date**: March 30, 2026  
**Version**: 1.0

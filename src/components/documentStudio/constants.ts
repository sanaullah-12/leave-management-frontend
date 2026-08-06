/**
 * Document Studio - seed content: the built-in template library and the
 * placeholder catalogue. Everything here is data, not UI, so it can later be
 * served from the backend (or authored by AI) without touching components.
 */
import type {
  DocumentTemplate,
  PlaceholderDef,
  TemplateCategory,
} from "./types";

export const PAGE_FONT_FAMILIES = [
  "Georgia, 'Times New Roman', serif",
  "'Geist', ui-sans-serif, system-ui, sans-serif",
  "'Times New Roman', Times, serif",
  "Arial, Helvetica, sans-serif",
  "'Courier New', monospace",
] as const;

export const CATEGORY_META: Record<
  TemplateCategory,
  { label: string; tint: string }
> = {
  Onboarding: { label: "Onboarding", tint: "emerald" },
  Compensation: { label: "Compensation", tint: "blue" },
  Recognition: { label: "Recognition", tint: "amber" },
  Disciplinary: { label: "Disciplinary", tint: "red" },
  Offboarding: { label: "Offboarding", tint: "slate" },
  Leave: { label: "Leave", tint: "violet" },
  Verification: { label: "Verification", tint: "cyan" },
  Certificate: { label: "Certificate", tint: "indigo" },
  Custom: { label: "Custom", tint: "gray" },
};

/** The catalogue of tokens HR can drop into a document. */
export const PLACEHOLDERS: PlaceholderDef[] = [
  { key: "Employee Name", label: "Employee Name", group: "Employee", glyph: "employee", hint: "Full legal name" },
  { key: "Employee ID", label: "Employee ID", group: "Employee", glyph: "employeeId", hint: "Company employee code" },
  { key: "Department", label: "Department", group: "Employee", glyph: "department", hint: "Assigned department" },
  { key: "Designation", label: "Designation", group: "Employee", glyph: "designation", hint: "Job title / role" },
  { key: "Joining Date", label: "Joining Date", group: "Employee", glyph: "joiningDate", hint: "Date of joining" },
  { key: "Salary", label: "Salary", group: "Employee", glyph: "money", hint: "Monthly / annual salary" },
  { key: "Manager Name", label: "Manager Name", group: "Employee", glyph: "manager", hint: "Reporting manager" },
  { key: "Email", label: "Email", group: "Employee", glyph: "email", hint: "Work email address" },
  { key: "Phone", label: "Phone", group: "Employee", glyph: "phone", hint: "Contact number" },
  { key: "Company Name", label: "Company Name", group: "Company", glyph: "company", hint: "Legal company name" },
  { key: "Address", label: "Address", group: "Company", glyph: "address", hint: "Registered address" },
  { key: "Issue Date", label: "Issue Date", group: "Date", glyph: "issueDate", hint: "Date the letter is issued" },
  { key: "Current Date", label: "Current Date", group: "Date", glyph: "currentDate", hint: "Today's date" },
];

const now = "2024-01-01T00:00:00.000Z";

/**
 * Wraps raw body markup in the shared letter scaffold so every built-in
 * template reads consistently. Kept tiny + inline-styled so it survives copy,
 * export and print unchanged.
 */
const letter = (body: string) => body.trim();

export const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "tpl-offer-letter",
    name: "Offer Letter",
    description: "Formal employment offer with role, compensation and start date.",
    category: "Onboarding",
    icon: "offer",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 42,
    content: letter(`
      <h1 style="text-align:center;">Offer of Employment</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p>Dear {{Employee Name}},</p>
      <p>We are delighted to extend an offer of employment at <strong>{{Company Name}}</strong>. Following our recent discussions, we are pleased to offer you the position of <strong>{{Designation}}</strong> within the {{Department}} department.</p>
      <p>Your anticipated start date is <strong>{{Joining Date}}</strong>. Your gross remuneration will be <strong>{{Salary}}</strong>, subject to the standard statutory deductions and company policies.</p>
      <p>You will report directly to {{Manager Name}}. We are confident that your skills and experience will be a valuable addition to our team.</p>
      <p>Please sign and return a copy of this letter to indicate your acceptance of this offer.</p>
      <p>We look forward to welcoming you aboard.</p>
      <p>Sincerely,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-appointment-letter",
    name: "Appointment Letter",
    description: "Confirms appointment, terms and conditions of employment.",
    category: "Onboarding",
    icon: "contract",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 31,
    content: letter(`
      <h1 style="text-align:center;">Letter of Appointment</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p>Dear {{Employee Name}},</p>
      <p>With reference to your application and the subsequent interview, we are pleased to confirm your appointment as <strong>{{Designation}}</strong> in the {{Department}} department at {{Company Name}}, effective <strong>{{Joining Date}}</strong>.</p>
      <p>Your Employee ID is <strong>{{Employee ID}}</strong>. Your employment will be governed by the terms and conditions set out in the company handbook.</p>
      <p>We warmly welcome you to the organisation and wish you a long and successful career with us.</p>
      <p>Yours sincerely,</p>
      <p><br/>_____________________<br/>Authorised Signatory<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-experience-letter",
    name: "Experience Letter",
    description: "Certifies tenure, role and conduct for a departing employee.",
    category: "Offboarding",
    icon: "internship",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 27,
    content: letter(`
      <h1 style="text-align:center;">Experience Certificate</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p><strong>TO WHOM IT MAY CONCERN</strong></p>
      <p>This is to certify that {{Employee Name}} (Employee ID: {{Employee ID}}) was employed with {{Company Name}} as <strong>{{Designation}}</strong> in the {{Department}} department since {{Joining Date}}.</p>
      <p>During the tenure with us, {{Employee Name}} was found to be sincere, hardworking and professional. Their conduct and performance were satisfactory throughout the period of employment.</p>
      <p>We wish them every success in their future endeavours.</p>
      <p>Sincerely,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-promotion-letter",
    name: "Promotion Letter",
    description: "Announces a promotion to a new role and compensation.",
    category: "Recognition",
    icon: "promotion",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 18,
    content: letter(`
      <h1 style="text-align:center;">Letter of Promotion</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p>Dear {{Employee Name}},</p>
      <p>In recognition of your outstanding performance and dedication, we are pleased to promote you to the position of <strong>{{Designation}}</strong> within the {{Department}} department, effective {{Current Date}}.</p>
      <p>Along with this new role, your revised compensation will be <strong>{{Salary}}</strong>. We are confident you will continue to excel and contribute meaningfully to {{Company Name}}.</p>
      <p>Congratulations on this well-deserved achievement.</p>
      <p>Warm regards,</p>
      <p><br/>_____________________<br/>{{Manager Name}}<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-salary-certificate",
    name: "Salary Certificate",
    description: "Official certification of an employee's salary details.",
    category: "Compensation",
    icon: "salary",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 39,
    content: letter(`
      <h1 style="text-align:center;">Salary Certificate</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p><strong>TO WHOM IT MAY CONCERN</strong></p>
      <p>This is to certify that {{Employee Name}} (Employee ID: {{Employee ID}}) is employed with {{Company Name}} as <strong>{{Designation}}</strong> in the {{Department}} department since {{Joining Date}}.</p>
      <p>The current gross salary drawn by the employee is <strong>{{Salary}}</strong> per month.</p>
      <p>This certificate is issued upon the request of the employee for official purposes.</p>
      <p>Sincerely,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-salary-increment",
    name: "Salary Increment Letter",
    description: "Communicates a salary revision and effective date.",
    category: "Compensation",
    icon: "appraisal",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 22,
    content: letter(`
      <h1 style="text-align:center;">Salary Increment Letter</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p>Dear {{Employee Name}},</p>
      <p>We are pleased to inform you that, in recognition of your valuable contribution and performance, your salary has been revised to <strong>{{Salary}}</strong>, effective {{Current Date}}.</p>
      <p>Your continued commitment as <strong>{{Designation}}</strong> in the {{Department}} department is greatly appreciated. We look forward to your ongoing success at {{Company Name}}.</p>
      <p>Best regards,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-warning-letter",
    name: "Warning Letter",
    description: "Formal disciplinary warning documenting a concern.",
    category: "Disciplinary",
    icon: "warning",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 9,
    content: letter(`
      <h1 style="text-align:center;">Warning Letter</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p>Dear {{Employee Name}},</p>
      <p>This letter serves as a formal warning regarding your conduct/performance as <strong>{{Designation}}</strong> in the {{Department}} department.</p>
      <p>It has been observed that [describe the specific concern here]. Such behaviour is not in line with the standards expected at {{Company Name}} and must be addressed immediately.</p>
      <p>You are advised to take corrective action without delay. Failure to demonstrate improvement may result in further disciplinary action.</p>
      <p>We trust you will treat this matter with the seriousness it warrants.</p>
      <p>Regards,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-termination-letter",
    name: "Termination Letter",
    description: "Formally ends the employment relationship.",
    category: "Offboarding",
    icon: "policy",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 6,
    content: letter(`
      <h1 style="text-align:center;">Termination Letter</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p>Dear {{Employee Name}},</p>
      <p>We regret to inform you that your employment with {{Company Name}} as <strong>{{Designation}}</strong> in the {{Department}} department will be terminated effective {{Current Date}}.</p>
      <p>This decision follows [state the reason / reference prior communication]. Please arrange to return all company property and complete the exit formalities with the Human Resources department.</p>
      <p>We thank you for your service and wish you the best in your future endeavours.</p>
      <p>Sincerely,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-leave-approval",
    name: "Leave Approval Letter",
    description: "Confirms approval of a leave request.",
    category: "Leave",
    icon: "approval",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 48,
    content: letter(`
      <h1 style="text-align:center;">Leave Approval</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p>Dear {{Employee Name}},</p>
      <p>We are pleased to inform you that your leave request has been <strong>approved</strong>. Kindly ensure a proper handover of your responsibilities as <strong>{{Designation}}</strong> in the {{Department}} department prior to your leave.</p>
      <p>Should there be any change in your plans, please notify your manager, {{Manager Name}}, at the earliest.</p>
      <p>Best regards,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-leave-rejection",
    name: "Leave Rejection Letter",
    description: "Communicates that a leave request cannot be granted.",
    category: "Leave",
    icon: "termination",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 7,
    content: letter(`
      <h1 style="text-align:center;">Leave Request - Update</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p>Dear {{Employee Name}},</p>
      <p>Thank you for your leave request. After careful consideration, we regret to inform you that we are unable to approve your leave for the requested dates due to [operational reasons / business requirements].</p>
      <p>We would be happy to work with you to identify alternative dates. Please reach out to your manager, {{Manager Name}}, to discuss further.</p>
      <p>We appreciate your understanding.</p>
      <p>Regards,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-resignation-acceptance",
    name: "Resignation Acceptance",
    description: "Acknowledges and accepts an employee's resignation.",
    category: "Offboarding",
    icon: "agreement",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 14,
    content: letter(`
      <h1 style="text-align:center;">Acceptance of Resignation</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p>Dear {{Employee Name}},</p>
      <p>We acknowledge receipt of your resignation from the position of <strong>{{Designation}}</strong> in the {{Department}} department. Your resignation is hereby accepted, and your last working day will be {{Current Date}}.</p>
      <p>We thank you for your contributions to {{Company Name}} and wish you continued success in your career.</p>
      <p>Please coordinate with Human Resources to complete the exit process.</p>
      <p>Sincerely,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-noc",
    name: "No Objection Certificate",
    description: "States the company has no objection (travel, visa, etc.).",
    category: "Verification",
    icon: "visa",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 16,
    content: letter(`
      <h1 style="text-align:center;">No Objection Certificate</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p><strong>TO WHOM IT MAY CONCERN</strong></p>
      <p>This is to certify that {{Employee Name}} (Employee ID: {{Employee ID}}) is currently employed with {{Company Name}} as <strong>{{Designation}}</strong> in the {{Department}} department since {{Joining Date}}.</p>
      <p>The company has <strong>no objection</strong> to the employee's application for [purpose - e.g. travel visa, higher studies]. This certificate is issued upon their request.</p>
      <p>Sincerely,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-internship-certificate",
    name: "Internship Certificate",
    description: "Certifies completion of an internship programme.",
    category: "Certificate",
    icon: "award",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 11,
    content: letter(`
      <h1 style="text-align:center;">Internship Certificate</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p><strong>TO WHOM IT MAY CONCERN</strong></p>
      <p>This is to certify that {{Employee Name}} successfully completed an internship at {{Company Name}} in the {{Department}} department, serving as <strong>{{Designation}}</strong>.</p>
      <p>During the internship, they demonstrated a strong work ethic, a willingness to learn and a professional attitude. We wish them the very best in their future pursuits.</p>
      <p>Sincerely,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
  {
    id: "tpl-employment-verification",
    name: "Employment Verification Letter",
    description: "Verifies current employment status for third parties.",
    category: "Verification",
    icon: "verification",
    system: true,
    createdAt: now,
    updatedAt: now,
    usageCount: 25,
    content: letter(`
      <h1 style="text-align:center;">Employment Verification</h1>
      <p style="text-align:right;">Date: {{Issue Date}}</p>
      <p><strong>TO WHOM IT MAY CONCERN</strong></p>
      <p>This letter confirms that {{Employee Name}} (Employee ID: {{Employee ID}}) is employed with {{Company Name}} as <strong>{{Designation}}</strong> in the {{Department}} department, and has been with us since {{Joining Date}}.</p>
      <p>Should you require any further information, please do not hesitate to contact the Human Resources department at {{Email}}.</p>
      <p>Sincerely,</p>
      <p><br/>_____________________<br/>Human Resources<br/>{{Company Name}}</p>
    `),
  },
];

/** A blank canvas users start from when creating a brand-new document. */
export const BLANK_TEMPLATE: DocumentTemplate = {
  id: "tpl-custom-blank",
  name: "Blank Document",
  description: "Start from a clean page and build your own layout.",
  category: "Custom",
  icon: "blank",
  system: true,
  createdAt: now,
  updatedAt: now,
  usageCount: 0,
  content: letter(`
    <h1 style="text-align:center;">Document Title</h1>
    <p style="text-align:right;">Date: {{Issue Date}}</p>
    <p>Dear {{Employee Name}},</p>
    <p>Start typing your content here. Drag placeholders from the right-hand panel to insert dynamic fields such as {{Department}} or {{Designation}}.</p>
    <p>Regards,</p>
    <p><br/>{{Company Name}}</p>
  `),
};

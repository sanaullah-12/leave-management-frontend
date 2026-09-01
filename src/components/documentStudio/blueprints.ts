/**
 * Document Studio - template blueprints.
 *
 * A blueprint is the declarative description of an HR document: its title, who
 * it is addressed to, the paragraphs it says, the extra merge fields it needs
 * and how it should be laid out. {@link buildTemplateContent} turns one into
 * the HTML that ships as a template.
 *
 * Adding a new document type - a transfer letter, an appreciation letter, a
 * show cause notice - means appending one object to {@link BLUEPRINTS}. The
 * library card, the page layout, the generation form and the print output all
 * follow from the blueprint; no component needs to learn about it.
 */
import type {
  TemplateCategory,
  TemplateField,
  TemplateVariant,
} from "./types";

export interface BlueprintFacts {
  label: string;
  value: string;
}

export interface TemplateBlueprint {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** Key into the studio icon registry (see `icons.ts`). */
  icon: string;
  variant: TemplateVariant;
  /** Short code used when minting reference numbers, e.g. "OFR". */
  refCode: string;
  /** Printed title, e.g. "Offer of Employment". */
  title: string;
  subtitle?: string;
  /** Bold "Subject:" line under the salutation. */
  subject?: string;
  /** Who the document speaks to. Certificates address "whom it may concern". */
  addressee?: "employee" | "concern" | "none";
  /** Two-column fact table printed above the body. */
  facts?: BlueprintFacts[];
  paragraphs: string[];
  /** Numbered terms block, used by appointment-style letters. */
  terms?: { intro?: string; items: string[] };
  closing?: string;
  /** Whose name sits under the signature line. */
  signatory?: "company" | "manager";
  /** Adds a counter-signature strip for the employee. */
  acknowledgement?: string;
  /** Small italic footnote under the signature. */
  note?: string;
  /** Extra merge fields the generation form must collect for this document. */
  fields?: TemplateField[];
  /** Seeds the "most used" overview card on a fresh install. */
  usageCount?: number;
}

/* ------------------------------------------------------------------ */
/* Reusable field definitions                                          */
/* ------------------------------------------------------------------ */

const FIELD: Record<string, TemplateField> = {
  salary: {
    key: "Salary",
    label: "Gross salary",
    type: "text",
    placeholder: "e.g. PKR 250,000 per month",
    source: "salary",
  },
  revisedSalary: {
    key: "Revised Salary",
    label: "Revised salary",
    type: "text",
    placeholder: "e.g. PKR 310,000 per month",
  },
  previousSalary: {
    key: "Previous Salary",
    label: "Previous salary",
    type: "text",
    placeholder: "e.g. PKR 250,000 per month",
    source: "salary",
  },
  manager: {
    key: "Manager Name",
    label: "Reporting manager",
    type: "text",
    placeholder: "Full name",
  },
  effectiveDate: { key: "Effective Date", label: "Effective from", type: "date" },
  lastWorkingDay: { key: "Last Working Day", label: "Last working day", type: "date" },
  workLocation: {
    key: "Work Location",
    label: "Work location",
    type: "text",
    placeholder: "e.g. Head Office, Lahore",
  },
  probation: {
    key: "Probation Period",
    label: "Probation period",
    type: "text",
    placeholder: "e.g. three (3) months",
  },
  workingHours: {
    key: "Working Hours",
    label: "Working hours",
    type: "text",
    placeholder: "e.g. 09:00 to 18:00, Monday to Friday",
  },
  noticePeriod: {
    key: "Notice Period",
    label: "Notice period",
    type: "text",
    placeholder: "e.g. thirty (30) days",
  },
  newDesignation: {
    key: "New Designation",
    label: "New designation",
    type: "text",
    placeholder: "e.g. Senior Software Engineer",
  },
  newDepartment: {
    key: "New Department",
    label: "New department",
    type: "text",
    placeholder: "e.g. Platform Engineering",
  },
  newLocation: {
    key: "New Location",
    label: "New location",
    type: "text",
    placeholder: "e.g. Karachi Office",
  },
  incidentDate: { key: "Incident Date", label: "Date of incident", type: "date" },
  concern: {
    key: "Concern Details",
    label: "What happened",
    type: "textarea",
    placeholder: "Describe the conduct or performance concern in one paragraph.",
    wide: true,
  },
  responseDeadline: {
    key: "Response Deadline",
    label: "Reply required by",
    type: "date",
  },
  purpose: {
    key: "Purpose",
    label: "Purpose",
    type: "text",
    placeholder: "e.g. visa application for tourism",
    wide: true,
  },
  reason: {
    key: "Reason",
    label: "Reason",
    type: "textarea",
    placeholder: "State the reason recorded for this decision.",
    wide: true,
  },
  achievement: {
    key: "Achievement",
    label: "What is being recognised",
    type: "textarea",
    placeholder: "e.g. leading the payroll migration two weeks ahead of plan.",
    wide: true,
  },
  leaveType: {
    key: "Leave Type",
    label: "Leave type",
    type: "text",
    placeholder: "e.g. Annual leave",
  },
  leaveFrom: { key: "Leave From", label: "Leave from", type: "date" },
  leaveTo: { key: "Leave To", label: "Leave to", type: "date" },
  totalDays: { key: "Total Days", label: "Total days", type: "number", placeholder: "5" },
  stipend: {
    key: "Stipend",
    label: "Monthly stipend",
    type: "text",
    placeholder: "e.g. PKR 40,000",
  },
  startDate: { key: "Start Date", label: "Start date", type: "date" },
  endDate: { key: "End Date", label: "End date", type: "date" },
  validTill: { key: "Offer Valid Till", label: "Offer valid till", type: "date" },
  confirmationDate: {
    key: "Confirmation Date",
    label: "Confirmation date",
    type: "date",
  },
};

/* ------------------------------------------------------------------ */
/* The built-in library                                                */
/* ------------------------------------------------------------------ */

export const BLUEPRINTS: TemplateBlueprint[] = [
  {
    id: "tpl-offer-letter",
    name: "Offer Letter",
    description: "Formal employment offer with role, compensation and start date.",
    category: "Onboarding",
    icon: "offer",
    variant: "letter",
    refCode: "OFR",
    title: "Letter of Offer",
    subject: "Offer of employment for the position of {{Designation}}",
    addressee: "employee",
    usageCount: 42,
    fields: [
      FIELD.salary,
      FIELD.manager,
      FIELD.workLocation,
      FIELD.probation,
      FIELD.validTill,
    ],
    paragraphs: [
      "Following our recent discussions, we are pleased to offer you the position of <strong>{{Designation}}</strong> in the {{Department}} department at <strong>{{Company Name}}</strong>.",
      "Your employment is expected to commence on <strong>{{Joining Date}}</strong> at {{Work Location}}. You will report to {{Manager Name}}, and your gross remuneration will be <strong>{{Salary}}</strong>, subject to statutory deductions and the company's compensation policy.",
      "This offer is made in good faith and is subject to satisfactory reference checks and verification of the documents submitted by you.",
      "Kindly confirm your acceptance by signing and returning a copy of this letter on or before {{Offer Valid Till}}.",
    ],
    terms: {
      intro: "The principal terms of this offer are as follows:",
      items: [
        "Position: {{Designation}}, {{Department}} department.",
        "Reporting to: {{Manager Name}}.",
        "Gross remuneration: {{Salary}}.",
        "Probation: {{Probation Period}} from the date of joining.",
        "Place of work: {{Work Location}}.",
      ],
    },
    closing: "We look forward to welcoming you on board.",
    signatory: "company",
    acknowledgement: "Accepted and agreed",
  },
  {
    id: "tpl-appointment-letter",
    name: "Appointment Letter",
    description: "Confirms appointment and the terms and conditions of employment.",
    category: "Onboarding",
    icon: "contract",
    variant: "letter",
    refCode: "APT",
    title: "Letter of Appointment",
    subject: "Appointment as {{Designation}}",
    addressee: "employee",
    usageCount: 31,
    fields: [
      FIELD.salary,
      FIELD.manager,
      FIELD.workLocation,
      FIELD.probation,
      FIELD.workingHours,
      FIELD.noticePeriod,
    ],
    paragraphs: [
      "With reference to your application and the subsequent interview, we are pleased to confirm your appointment as <strong>{{Designation}}</strong> in the {{Department}} department of {{Company Name}}, with effect from <strong>{{Joining Date}}</strong>.",
      "Your employee identification number is <strong>{{Employee ID}}</strong>. Please quote it in all correspondence with the Human Resources department.",
    ],
    terms: {
      intro: "Your employment is governed by the following terms:",
      items: [
        "Remuneration: {{Salary}}, payable monthly after statutory deductions.",
        "Probation: {{Probation Period}}, extendable at the company's discretion.",
        "Working hours: {{Working Hours}}.",
        "Place of posting: {{Work Location}}. You may be transferred to any other location or department as the business requires.",
        "Notice period: {{Notice Period}} by either party after confirmation.",
        "You are required to observe the company's code of conduct, confidentiality obligations and all policies in force from time to time.",
      ],
    },
    closing:
      "We welcome you to {{Company Name}} and wish you a long and rewarding career with us.",
    signatory: "company",
    acknowledgement: "I accept the appointment on the terms stated above",
  },
  {
    id: "tpl-confirmation-letter",
    name: "Confirmation Letter",
    description: "Confirms an employee in service on completion of probation.",
    category: "Employment",
    icon: "approval",
    variant: "letter",
    refCode: "CNF",
    title: "Confirmation of Employment",
    subject: "Confirmation in the position of {{Designation}}",
    addressee: "employee",
    fields: [FIELD.confirmationDate, FIELD.salary, FIELD.manager, FIELD.probation],
    paragraphs: [
      "We are pleased to inform you that, on successful completion of your probation period of {{Probation Period}}, your services with {{Company Name}} stand <strong>confirmed</strong> as <strong>{{Designation}}</strong> in the {{Department}} department with effect from <strong>{{Confirmation Date}}</strong>.",
      "Your performance during probation has been assessed as satisfactory by {{Manager Name}}. Your remuneration on confirmation is {{Salary}}, and all other terms of your appointment letter remain unchanged.",
      "We record our appreciation of the commitment you have shown and look forward to your continued contribution.",
    ],
    closing: "Congratulations on your confirmation.",
    signatory: "company",
  },
  {
    id: "tpl-promotion-letter",
    name: "Promotion Letter",
    description: "Announces a promotion to a new role and compensation.",
    category: "Recognition",
    icon: "promotion",
    variant: "letter",
    refCode: "PRM",
    title: "Letter of Promotion",
    subject: "Promotion to the position of {{New Designation}}",
    addressee: "employee",
    usageCount: 18,
    fields: [
      FIELD.newDesignation,
      FIELD.revisedSalary,
      FIELD.effectiveDate,
      FIELD.manager,
    ],
    paragraphs: [
      "In recognition of your consistent performance and the responsibility you have taken on, we are pleased to promote you from <strong>{{Designation}}</strong> to <strong>{{New Designation}}</strong> in the {{Department}} department with effect from <strong>{{Effective Date}}</strong>.",
      "Consequent to this promotion, your revised gross remuneration will be <strong>{{Revised Salary}}</strong>. You will continue to report to {{Manager Name}}.",
      "All other terms and conditions of your employment remain unchanged.",
    ],
    closing: "Congratulations on this well-deserved advancement.",
    signatory: "company",
  },
  {
    id: "tpl-salary-increment",
    name: "Salary Increment Letter",
    description: "Communicates a salary revision and its effective date.",
    category: "Compensation",
    icon: "appraisal",
    variant: "letter",
    refCode: "INC",
    title: "Salary Revision",
    subject: "Revision of compensation with effect from {{Effective Date}}",
    addressee: "employee",
    usageCount: 22,
    fields: [FIELD.previousSalary, FIELD.revisedSalary, FIELD.effectiveDate],
    facts: [
      { label: "Present gross salary", value: "{{Previous Salary}}" },
      { label: "Revised gross salary", value: "{{Revised Salary}}" },
      { label: "Effective from", value: "{{Effective Date}}" },
    ],
    paragraphs: [
      "Following the annual performance review, we are pleased to inform you that your compensation as <strong>{{Designation}}</strong> in the {{Department}} department has been revised as set out below.",
      "The revised amount is subject to statutory deductions and will be reflected in the payroll cycle following the effective date. All other terms of your employment remain unchanged.",
    ],
    closing: "We thank you for your contribution and look forward to your continued success.",
    signatory: "company",
  },
  {
    id: "tpl-salary-certificate",
    name: "Salary Certificate",
    description: "Official certification of an employee's salary details.",
    category: "Compensation",
    icon: "salary",
    variant: "certificate",
    refCode: "SAL",
    title: "Salary Certificate",
    addressee: "concern",
    usageCount: 39,
    fields: [FIELD.salary, FIELD.purpose],
    facts: [
      { label: "Employee name", value: "{{Employee Name}}" },
      { label: "Employee ID", value: "{{Employee ID}}" },
      { label: "Designation", value: "{{Designation}}" },
      { label: "Department", value: "{{Department}}" },
      { label: "Date of joining", value: "{{Joining Date}}" },
      { label: "Gross monthly salary", value: "{{Salary}}" },
    ],
    paragraphs: [
      "This is to certify that <strong>{{Employee Name}}</strong> is employed with {{Company Name}} and draws the remuneration recorded below.",
      "This certificate is issued at the request of the employee for {{Purpose}} and does not constitute a guarantee of continued employment.",
    ],
    signatory: "company",
    note: "This certificate is valid only when it carries the company seal and an authorised signature.",
  },
  {
    id: "tpl-appreciation-letter",
    name: "Appreciation Letter",
    description: "Recognises outstanding work or a specific contribution.",
    category: "Recognition",
    icon: "award",
    variant: "letter",
    refCode: "APR",
    title: "Letter of Appreciation",
    addressee: "employee",
    fields: [FIELD.achievement, FIELD.manager],
    paragraphs: [
      "On behalf of {{Company Name}}, I would like to place on record our sincere appreciation for your work as <strong>{{Designation}}</strong> in the {{Department}} department.",
      "In particular, we recognise {{Achievement}} The effort, ownership and professionalism you brought to it did not go unnoticed.",
      "A copy of this letter will be placed in your personnel file. We hope it encourages you to keep setting this standard.",
    ],
    closing: "With appreciation and best wishes for your continued success.",
    signatory: "manager",
  },
  {
    id: "tpl-transfer-letter",
    name: "Transfer Letter",
    description: "Records a transfer of location, department or reporting line.",
    category: "Employment",
    icon: "transfer",
    variant: "letter",
    refCode: "TRF",
    title: "Letter of Transfer",
    subject: "Transfer to {{New Location}} with effect from {{Effective Date}}",
    addressee: "employee",
    fields: [
      FIELD.newLocation,
      FIELD.newDepartment,
      FIELD.newDesignation,
      FIELD.effectiveDate,
      FIELD.manager,
    ],
    facts: [
      { label: "Present posting", value: "{{Department}}" },
      { label: "New department", value: "{{New Department}}" },
      { label: "New designation", value: "{{New Designation}}" },
      { label: "New location", value: "{{New Location}}" },
      { label: "Effective from", value: "{{Effective Date}}" },
      { label: "Reporting to", value: "{{Manager Name}}" },
    ],
    paragraphs: [
      "In the interest of business requirements, and in accordance with the terms of your appointment, you are hereby transferred as detailed below with effect from <strong>{{Effective Date}}</strong>.",
      "You are requested to complete a proper handover of your present responsibilities and report at the new location on the effective date. Your compensation and all other terms of employment remain unchanged.",
    ],
    closing: "We wish you every success in your new assignment.",
    signatory: "company",
    acknowledgement: "Acknowledged and accepted",
  },
  {
    id: "tpl-warning-letter",
    name: "Warning Letter",
    description: "Formal disciplinary warning documenting a specific concern.",
    category: "Disciplinary",
    icon: "warning",
    variant: "notice",
    refCode: "WRN",
    title: "Written Warning",
    subject: "Formal warning regarding conduct and performance",
    addressee: "employee",
    usageCount: 9,
    fields: [FIELD.incidentDate, FIELD.concern, FIELD.responseDeadline],
    paragraphs: [
      "This letter serves as a formal written warning in your capacity as <strong>{{Designation}}</strong> in the {{Department}} department.",
      "On {{Incident Date}}, it was observed that {{Concern Details}}",
      "Conduct of this nature falls short of the standards expected at {{Company Name}} and of the obligations set out in your appointment letter and the employee handbook.",
      "You are required to correct this immediately and to demonstrate sustained improvement by <strong>{{Response Deadline}}</strong>. Any repetition may lead to further disciplinary action, up to and including termination of employment.",
      "You may submit a written explanation to the Human Resources department if you wish to place your account of the matter on record.",
    ],
    closing: "This warning will be retained in your personnel file.",
    signatory: "company",
    acknowledgement: "Receipt acknowledged by the employee",
  },
  {
    id: "tpl-show-cause-notice",
    name: "Show Cause Notice",
    description: "Requires a written explanation before any disciplinary decision.",
    category: "Disciplinary",
    icon: "notice",
    variant: "notice",
    refCode: "SCN",
    title: "Show Cause Notice",
    subject: "Notice to show cause",
    addressee: "employee",
    fields: [FIELD.incidentDate, FIELD.concern, FIELD.responseDeadline],
    paragraphs: [
      "You are employed with {{Company Name}} as <strong>{{Designation}}</strong> in the {{Department}} department under Employee ID {{Employee ID}}.",
      "It has been reported that, on {{Incident Date}}, {{Concern Details}}",
      "The above, if established, amounts to misconduct under the company's code of conduct and the terms of your appointment.",
      "You are hereby required to show cause in writing, on or before <strong>{{Response Deadline}}</strong>, as to why disciplinary action should not be taken against you in this matter.",
      "Should no reply be received within the stated period, the company will proceed on the basis of the material available on record.",
    ],
    closing: "This notice is issued without prejudice to any other right available to the company.",
    signatory: "company",
    acknowledgement: "Receipt acknowledged by the employee",
  },
  {
    id: "tpl-termination-letter",
    name: "Termination Letter",
    description: "Formally ends the employment relationship on stated grounds.",
    category: "Offboarding",
    icon: "termination",
    variant: "letter",
    refCode: "TRM",
    title: "Termination of Employment",
    subject: "Termination of employment with effect from {{Last Working Day}}",
    addressee: "employee",
    usageCount: 6,
    fields: [FIELD.lastWorkingDay, FIELD.reason, FIELD.noticePeriod],
    paragraphs: [
      "We write with reference to your employment with {{Company Name}} as <strong>{{Designation}}</strong> in the {{Department}} department.",
      "Your employment stands terminated with effect from the close of business on <strong>{{Last Working Day}}</strong>, in accordance with the notice period of {{Notice Period}} provided in your appointment letter.",
      "The decision has been recorded on the following grounds: {{Reason}}",
      "You are requested to return all company property in your possession, including access cards, devices and documents, and to complete the exit formalities with the Human Resources department. Your final settlement will be released after clearance.",
    ],
    closing: "We thank you for your service and wish you well in your future endeavours.",
    signatory: "company",
    acknowledgement: "Receipt acknowledged by the employee",
  },
  {
    id: "tpl-resignation-acceptance",
    name: "Resignation Acceptance",
    description: "Acknowledges and accepts an employee's resignation.",
    category: "Offboarding",
    icon: "agreement",
    variant: "letter",
    refCode: "RSG",
    title: "Acceptance of Resignation",
    subject: "Acceptance of your resignation dated {{Issue Date}}",
    addressee: "employee",
    usageCount: 14,
    fields: [FIELD.lastWorkingDay, FIELD.manager],
    paragraphs: [
      "We acknowledge receipt of your resignation from the position of <strong>{{Designation}}</strong> in the {{Department}} department.",
      "Your resignation is hereby accepted, and your last working day with {{Company Name}} will be <strong>{{Last Working Day}}</strong>.",
      "Please complete a formal handover of your responsibilities to {{Manager Name}} and obtain clearance from all departments before your last working day. Your full and final settlement, along with your relieving and experience documents, will be issued thereafter.",
    ],
    closing: "We thank you for your contribution and wish you continued success.",
    signatory: "company",
  },
  {
    id: "tpl-relieving-letter",
    name: "Relieving Letter",
    description: "Releases an employee from duties after exit formalities.",
    category: "Offboarding",
    icon: "relieving",
    variant: "letter",
    refCode: "RLV",
    title: "Relieving Letter",
    addressee: "employee",
    fields: [FIELD.lastWorkingDay],
    paragraphs: [
      "This is to confirm that you have been relieved from your duties as <strong>{{Designation}}</strong> in the {{Department}} department of {{Company Name}} at the close of business on <strong>{{Last Working Day}}</strong>.",
      "You joined the organisation on {{Joining Date}} under Employee ID {{Employee ID}}. All company property in your possession has been returned and your dues have been settled in accordance with company policy.",
      "We confirm that there are no obligations outstanding between you and the company as at the date of this letter.",
    ],
    closing: "We wish you the very best in your future assignments.",
    signatory: "company",
  },
  {
    id: "tpl-experience-letter",
    name: "Experience Letter",
    description: "Certifies tenure, role and conduct for a departing employee.",
    category: "Offboarding",
    icon: "internship",
    variant: "certificate",
    refCode: "EXP",
    title: "Experience Certificate",
    addressee: "concern",
    usageCount: 27,
    fields: [FIELD.lastWorkingDay],
    facts: [
      { label: "Employee name", value: "{{Employee Name}}" },
      { label: "Employee ID", value: "{{Employee ID}}" },
      { label: "Designation held", value: "{{Designation}}" },
      { label: "Department", value: "{{Department}}" },
      { label: "Period of service", value: "{{Joining Date}} to {{Last Working Day}}" },
    ],
    paragraphs: [
      "This is to certify that <strong>{{Employee Name}}</strong> was employed with {{Company Name}} in the capacity recorded below.",
      "During the tenure of service, {{Employee Name}} was found to be diligent, professional and dependable. Conduct and performance throughout the period of employment were satisfactory.",
      "This certificate is issued at the request of the employee.",
    ],
    closing: "We wish {{Employee Name}} every success in future endeavours.",
    signatory: "company",
  },
  {
    id: "tpl-internship-certificate",
    name: "Internship Certificate",
    description: "Certifies completion of an internship programme.",
    category: "Certificate",
    icon: "award",
    variant: "certificate",
    refCode: "INT",
    title: "Certificate of Internship",
    addressee: "concern",
    usageCount: 11,
    fields: [FIELD.startDate, FIELD.endDate, FIELD.stipend],
    facts: [
      { label: "Intern name", value: "{{Employee Name}}" },
      { label: "Department", value: "{{Department}}" },
      { label: "Role", value: "{{Designation}}" },
      { label: "Duration", value: "{{Start Date}} to {{End Date}}" },
    ],
    paragraphs: [
      "This is to certify that <strong>{{Employee Name}}</strong> has successfully completed an internship programme with {{Company Name}}.",
      "During the internship, the intern demonstrated a strong work ethic, a willingness to learn and a professional attitude towards the assignments undertaken.",
    ],
    closing: "We wish {{Employee Name}} the very best in future studies and career.",
    signatory: "company",
  },
  {
    id: "tpl-noc",
    name: "No Objection Certificate",
    description: "States the company has no objection (travel, visa, studies).",
    category: "Verification",
    icon: "visa",
    variant: "certificate",
    refCode: "NOC",
    title: "No Objection Certificate",
    addressee: "concern",
    usageCount: 16,
    fields: [FIELD.purpose, FIELD.startDate, FIELD.endDate],
    facts: [
      { label: "Employee name", value: "{{Employee Name}}" },
      { label: "Employee ID", value: "{{Employee ID}}" },
      { label: "Designation", value: "{{Designation}}" },
      { label: "Employed since", value: "{{Joining Date}}" },
    ],
    paragraphs: [
      "This is to certify that <strong>{{Employee Name}}</strong> is presently employed with {{Company Name}} on a full-time basis.",
      "The company has <strong>no objection</strong> to the employee's application for {{Purpose}} during the period {{Start Date}} to {{End Date}}.",
      "The employee is expected to resume duties on the conclusion of the said period. This certificate is issued at the employee's request and carries no financial obligation on the part of the company.",
    ],
    signatory: "company",
  },
  {
    id: "tpl-employment-verification",
    name: "Employment Verification Letter",
    description: "Verifies current employment status for third parties.",
    category: "Verification",
    icon: "verification",
    variant: "certificate",
    refCode: "EMV",
    title: "Employment Verification",
    addressee: "concern",
    usageCount: 25,
    fields: [FIELD.salary],
    facts: [
      { label: "Employee name", value: "{{Employee Name}}" },
      { label: "Employee ID", value: "{{Employee ID}}" },
      { label: "Designation", value: "{{Designation}}" },
      { label: "Department", value: "{{Department}}" },
      { label: "Employed since", value: "{{Joining Date}}" },
      { label: "Employment status", value: "Active, full-time" },
    ],
    paragraphs: [
      "This letter confirms that <strong>{{Employee Name}}</strong> is currently employed with {{Company Name}} on the terms recorded below.",
      "Should you require any further information regarding this verification, please contact the Human Resources department at {{Company Email}} or {{Company Phone}}.",
    ],
    signatory: "company",
  },
  {
    id: "tpl-leave-approval",
    name: "Leave Approval Letter",
    description: "Confirms approval of a leave request.",
    category: "Leave",
    icon: "approval",
    variant: "memo",
    refCode: "LVA",
    title: "Leave Approval",
    addressee: "none",
    usageCount: 48,
    fields: [
      FIELD.leaveType,
      FIELD.leaveFrom,
      FIELD.leaveTo,
      FIELD.totalDays,
      FIELD.manager,
    ],
    facts: [
      { label: "To", value: "{{Employee Name}}, {{Designation}}" },
      { label: "From", value: "Human Resources, {{Company Name}}" },
      { label: "Date", value: "{{Issue Date}}" },
      { label: "Subject", value: "Approval of {{Leave Type}}" },
    ],
    paragraphs: [
      "Your request for <strong>{{Leave Type}}</strong> has been <strong>approved</strong> for the period <strong>{{Leave From}}</strong> to <strong>{{Leave To}}</strong>, totalling {{Total Days}} day(s).",
      "Please complete a handover of your responsibilities to {{Manager Name}} before proceeding on leave, and ensure your contact details are current in case of an urgent business need.",
      "Any change to these dates must be communicated to your reporting manager and the Human Resources department in advance.",
    ],
    signatory: "company",
  },
  {
    id: "tpl-leave-rejection",
    name: "Leave Rejection Letter",
    description: "Communicates that a leave request cannot be granted.",
    category: "Leave",
    icon: "termination",
    variant: "memo",
    refCode: "LVR",
    title: "Leave Request Update",
    addressee: "none",
    usageCount: 7,
    fields: [FIELD.leaveType, FIELD.leaveFrom, FIELD.leaveTo, FIELD.reason, FIELD.manager],
    facts: [
      { label: "To", value: "{{Employee Name}}, {{Designation}}" },
      { label: "From", value: "Human Resources, {{Company Name}}" },
      { label: "Date", value: "{{Issue Date}}" },
      { label: "Subject", value: "Your request for {{Leave Type}}" },
    ],
    paragraphs: [
      "Thank you for your request for <strong>{{Leave Type}}</strong> from {{Leave From}} to {{Leave To}}.",
      "After careful consideration, we are unable to approve the leave for the requested dates. The reason recorded is: {{Reason}}",
      "We would be glad to help you identify alternative dates. Please reach out to {{Manager Name}} or the Human Resources department to discuss the options available.",
    ],
    signatory: "company",
  },
];

/* ------------------------------------------------------------------ */
/* Blueprint -> HTML                                                   */
/* ------------------------------------------------------------------ */

const metaRow = () =>
  `<div class="doc-meta"><span>Ref: {{Reference No}}</span><span>Date: {{Issue Date}}</span></div>`;

const titleBlock = (bp: TemplateBlueprint) =>
  `<h1 class="doc-title">${bp.title}</h1>${
    bp.subtitle ? `<p class="doc-subtitle">${bp.subtitle}</p>` : ""
  }<div class="doc-title-rule"></div>`;

const addresseeBlock = (bp: TemplateBlueprint) => {
  if (bp.addressee === "concern")
    return `<p class="doc-concern">TO WHOM IT MAY CONCERN</p>`;
  if (bp.addressee === "none") return "";
  return `<div class="doc-addressee"><strong>{{Employee Name}}</strong><br />{{Designation}}<br />{{Department}} Department<br />Employee ID: {{Employee ID}}</div><p class="doc-salutation">Dear {{Employee Name}},</p>`;
};

const factsBlock = (bp: TemplateBlueprint) =>
  bp.facts && bp.facts.length
    ? `<table class="doc-facts"><tbody>${bp.facts
        .map(
          (f) => `<tr><td>${f.label}</td><td>${f.value}</td></tr>`
        )
        .join("")}</tbody></table>`
    : "";

const termsBlock = (bp: TemplateBlueprint) => {
  if (!bp.terms) return "";
  const intro = bp.terms.intro ? `<p>${bp.terms.intro}</p>` : "";
  return `${intro}<ol class="doc-terms">${bp.terms.items
    .map((item) => `<li>${item}</li>`)
    .join("")}</ol>`;
};

const signatureBlock = (bp: TemplateBlueprint) => {
  const closing = bp.closing ? `<p>${bp.closing}</p>` : "";
  const name =
    bp.signatory === "manager" ? "{{Manager Name}}" : "{{Signatory Name}}";
  const role =
    bp.signatory === "manager"
      ? "Reporting Manager"
      : "{{Signatory Designation}}";
  return `${closing}<p class="doc-closing">Yours sincerely,</p>
<div class="doc-signature">
  <div class="doc-sign-image" data-sign-slot="1"></div>
  <div class="doc-sign-line"></div>
  <p class="doc-signatory">${name}</p>
  <p class="doc-signatory-role">${role}</p>
  <p class="doc-signatory-role">{{Company Name}}</p>
</div>`;
};

const acknowledgementBlock = (bp: TemplateBlueprint) =>
  bp.acknowledgement
    ? `<div class="doc-ack">
  <p class="doc-ack-title">${bp.acknowledgement}</p>
  <div class="doc-ack-grid">
    <div><div class="doc-sign-line"></div><p class="doc-signatory-role">{{Employee Name}}</p></div>
    <div><div class="doc-sign-line"></div><p class="doc-signatory-role">Date</p></div>
  </div>
</div>`
    : "";

/**
 * Assemble a blueprint into the template body. The order of blocks is what
 * gives every Nexora document the same rhythm: reference and date, title,
 * who it is for, what it says, who signed it.
 */
export function buildTemplateContent(bp: TemplateBlueprint): string {
  const subject = bp.subject
    ? `<p class="doc-subject">Subject: ${bp.subject}</p>`
    : "";
  const body = bp.paragraphs.map((p) => `<p>${p}</p>`).join("\n");
  const note = bp.note ? `<p class="doc-note">${bp.note}</p>` : "";

  // A memo leads with its To/From/Subject block; everywhere else the fact
  // table is what the preceding paragraph points at, so it follows the prose.
  const facts = factsBlock(bp);
  const isMemo = bp.variant === "memo";

  return [
    // A memo carries its date inside that block, so the reference row would
    // only repeat it.
    isMemo ? "" : metaRow(),
    titleBlock(bp),
    addresseeBlock(bp),
    subject,
    isMemo ? facts : "",
    body,
    isMemo ? "" : facts,
    termsBlock(bp),
    signatureBlock(bp),
    acknowledgementBlock(bp),
    note,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Every extra field declared across the library, deduplicated by key. */
export function allBlueprintFields(): TemplateField[] {
  const seen = new Map<string, TemplateField>();
  BLUEPRINTS.forEach((bp) =>
    (bp.fields ?? []).forEach((f) => {
      if (!seen.has(f.key)) seen.set(f.key, f);
    })
  );
  return [...seen.values()];
}

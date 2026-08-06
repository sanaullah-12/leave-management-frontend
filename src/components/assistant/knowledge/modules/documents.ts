/**
 * Knowledge pack - Document Studio.
 */
import type { KnowledgeModule } from "../../types";

const documents: KnowledgeModule = {
  id: "documents",
  name: "Document Studio",
  icon: "document",
  primaryRoute: "/document-studio",
  routes: ["/document-studio"],
  roles: ["admin"],
  summary:
    "Document Studio is the HR letter factory - reusable templates with employee placeholders, a rich editor with your letterhead, one-click generation for any employee, and PDF export with a history of everything issued.",
  quickActions: [
    { label: "Open Document Studio", to: "/document-studio", icon: "document", roles: ["admin"] },
  ],
  entries: [
    {
      id: "documents.generate",
      module: "documents",
      question: "How do I generate an HR document?",
      aliases: [
        "create an offer letter",
        "make an experience certificate",
        "generate a letter for an employee",
      ],
      keywords: [
        "document",
        "letter",
        "generate",
        "create",
        "certificate",
        "offer",
        "template",
        "hr",
      ],
      answer:
        "Pick a template, pick the employee, and Document Studio fills in the details for you.",
      steps: [
        "Open Documents → Document Studio.",
        "Choose a template from the library - offer letter, experience certificate, and so on.",
        "Click Generate and select the employee it is for.",
        "Placeholders like name, designation and joining date fill in automatically.",
        "Review it on the canvas, edit anything you need, then export to PDF.",
      ],
      tips: [
        "Generated documents are kept in the studio's history, so you can reissue one later.",
      ],
      actions: [
        { label: "Open Document Studio", to: "/document-studio", icon: "create", roles: ["admin"] },
      ],
      related: ["documents.template", "documents.letterhead"],
      roles: ["admin"],
      featured: true,
      weight: 2,
    },
    {
      id: "documents.template",
      module: "documents",
      question: "How do I create a document template?",
      aliases: ["add a new letter template", "import a word document as a template"],
      keywords: ["template", "create", "new", "import", "placeholder", "reusable"],
      answer:
        "Templates are written once in the studio editor and reused for every employee.",
      steps: [
        "Open Documents → Document Studio.",
        "Create a new template from the library, or import an existing Word file.",
        "Write the body in the editor and insert placeholders from the placeholder panel where employee details belong.",
        "Save. It joins the library, ready to generate from.",
      ],
      actions: [
        { label: "Open Document Studio", to: "/document-studio", icon: "create", roles: ["admin"] },
      ],
      related: ["documents.generate"],
      roles: ["admin"],
    },
    {
      id: "documents.letterhead",
      module: "documents",
      question: "How do I add our letterhead or logo?",
      aliases: ["company branding on documents", "add signature to letters"],
      keywords: ["letterhead", "logo", "branding", "signature", "stamp", "header"],
      answer:
        "Branding assets are uploaded once in the studio and applied to every document.",
      steps: [
        "Open Documents → Document Studio and go to the letterhead manager.",
        "Upload your header, footer, logo, signature or stamp.",
        "Toggle the letterhead on in the page settings to see it behind the document.",
        "It is included in the PDF export.",
      ],
      actions: [
        { label: "Open Document Studio", to: "/document-studio", icon: "settings", roles: ["admin"] },
      ],
      related: ["documents.generate"],
      roles: ["admin"],
    },
  ],
};

export default documents;

/**
 * Knowledge pack - Account & Settings.
 *
 * Profile, security, appearance, language and notifications - the questions
 * every user asks regardless of role.
 */
import type { KnowledgeModule } from "../../types";

const account: KnowledgeModule = {
  id: "account",
  name: "Settings",
  icon: "settings",
  primaryRoute: "/profile",
  routes: ["/profile", "/theme", "/notifications"],
  summary:
    "Settings is where you manage your own account - profile details, password, notifications - and, if you are an admin, your organisation's profile and the app's appearance.",
  quickActions: [
    { label: "Profile settings", to: "/profile", icon: "settings" },
    { label: "Appearance", to: "/theme", icon: "settings" },
  ],
  entries: [
    {
      id: "account.change-password",
      module: "account",
      question: "How do I change my password?",
      aliases: [
        "update my password",
        "reset my password",
        "i want a new password",
        "change login password",
      ],
      keywords: [
        "password",
        "change",
        "update",
        "reset",
        "security",
        "login",
        "credentials",
      ],
      answer:
        "Your password is changed from Profile Settings - you will need your current one to confirm it is you.",
      steps: [
        "Open Settings → Profile Settings.",
        "Scroll to the Change Password section.",
        "Enter your current password, then your new one twice.",
        "Save. You stay signed in; the new password applies from your next sign-in.",
      ],
      tips: [
        "Locked out instead? Use \"Forgot password\" on the sign-in screen to get a reset link by email.",
      ],
      actions: [
        { label: "Open Profile Settings", to: "/profile", icon: "settings" },
      ],
      related: ["account.profile"],
      featured: true,
      weight: 3,
    },
    {
      id: "account.profile",
      module: "account",
      question: "How do I update my profile?",
      aliases: ["change my photo", "edit my details", "update phone number"],
      keywords: ["profile", "photo", "picture", "avatar", "details", "phone", "edit"],
      answer:
        "Profile Settings holds your personal details and profile picture.",
      steps: [
        "Open Settings → Profile Settings.",
        "Edit your name, phone or other details on the profile tab.",
        "Click your picture to upload a new one.",
        "Save your changes.",
      ],
      tips: [
        "Department and position are managed by HR - ask an admin if either is wrong.",
      ],
      actions: [{ label: "Open Profile Settings", to: "/profile", icon: "settings" }],
      related: ["account.change-password"],
    },
    {
      id: "account.theme",
      module: "account",
      question: "How do I change the theme or dark mode?",
      aliases: ["switch to dark mode", "change the colours", "appearance settings"],
      keywords: ["theme", "dark", "light", "mode", "colour", "color", "appearance"],
      answer:
        "Nexora ships light and dark modes plus a set of accent colours, switchable at any time.",
      steps: [
        "Open Settings → Theme, or use the avatar menu in the header and pick Theme.",
        "Choose light or dark, then an accent colour.",
        "It applies instantly and is remembered on your next visit.",
      ],
      actions: [{ label: "Open Theme", to: "/theme", icon: "settings" }],
      related: ["account.language"],
      featured: true,
    },
    {
      id: "account.language",
      module: "account",
      question: "How do I change the language?",
      aliases: ["switch language", "use urdu", "translate the app"],
      keywords: ["language", "translate", "locale", "english", "urdu", "rtl"],
      answer:
        "The language switcher sits in the header and changes the whole interface at once.",
      steps: [
        "Click the language control in the top-right of the header.",
        "Pick your language - each is shown in its own script.",
        "Right-to-left languages flip the layout automatically.",
      ],
      related: ["account.theme"],
    },
    {
      id: "account.payslip-employee",
      module: "account",
      question: "Where can I see my payslip?",
      aliases: ["my salary slip", "download my payslip"],
      keywords: ["payslip", "salary", "my pay", "slip", "salary slip"],
      answer:
        "Payslips are issued by your HR team. If you cannot find yours, ask an admin to send it from Payroll → Payslips.",
      steps: [
        "Check your notifications and email for an issued payslip.",
        "If it has not arrived, contact your HR admin.",
        "You can also raise it through Employee Voice under HR support.",
      ],
      actions: [
        { label: "Ask HR via Employee Voice", to: "/employee-voice", icon: "megaphone", roles: ["employee"] },
      ],
      roles: ["employee"],
    },
    {
      id: "account.logout",
      module: "account",
      question: "How do I sign out?",
      aliases: ["log out", "exit the app"],
      keywords: ["logout", "log out", "sign out", "exit", "leave"],
      answer:
        "Use the sign-out action at the bottom of the icon rail, or from the avatar menu in the header.",
      steps: [
        "Click your avatar in the top-right and choose Log out.",
        "Or use the sign-out icon at the bottom of the left rail.",
      ],
    },
  ],
};

export default account;

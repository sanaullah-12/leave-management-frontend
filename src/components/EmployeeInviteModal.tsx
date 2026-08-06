import React from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { authAPI, attendanceAPI } from "../services/api";
// import { useNotifications } from "../components/NotificationSystem"; // Removed for Socket.IO implementation
import Modal from "./Modal";
import Select from "./ui/Select";
import DatePicker from "./ui/DatePicker";
import LoadingSpinner from "./LoadingSpinner";

const DEPARTMENT_OPTIONS = [
  "Engineering",
  "Product & Development",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
  "Operations",
  "Customer Success",
].map((d) => ({ value: d, label: d }));

const POSITION_OPTIONS = [
  "Intern",
  "Jr.Software Engineer",
  "Sr.Software Engineer",
  "Sr.Project Manager",
  "Product Manager",
  "UX/UI Designer",
  "Marketing Specialist",
  "Sales Representative",
  "HR Specialist",
  "Financial Analyst",
  "Operations Manager",
].map((p) => ({ value: p, label: p }));

// Shared themed input styling - matches the Select / DatePicker triggers.
const INPUT =
  "w-full rounded-xl bg-[var(--card-surface)] px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-inset ring-gray-200/70 transition-shadow placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 dark:text-gray-100 dark:placeholder-gray-500 dark:ring-white/10";
import {
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CalendarIcon,
  TagIcon,
  XMarkIcon,
  HashtagIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import {
  PHONE_HINT,
  PHONE_PLACEHOLDER,
  phoneValidationRules,
} from "../utils/phone";

type InviteEmployeeData = {
  name: string;
  email: string;
  phone?: string; // E.164; enables WhatsApp notifications for this employee
  department: string;
  position: string;
  joinDate: string;
  employeeId?: string; // Optional custom employee ID
  tags?: string[];
};

interface EmployeeInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeInviteModal: React.FC<EmployeeInviteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  // const { addNotification } = useNotifications(); // Removed for Socket.IO implementation
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [selectedEmployee, setSelectedEmployee] = React.useState<any>(null);
  const [useCustomName, setUseCustomName] = React.useState(false);

  // Fetch machine employees
  const { data: machineEmployees, isLoading: machineLoading } = useQuery({
    queryKey: ["machineEmployees"],
    queryFn: () => attendanceAPI.getEmployeesFromMachine("192.168.1.201"),
    enabled: isOpen, // Only fetch when modal is open
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
  });

  const machineEmployeesList = machineEmployees?.data?.employees || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<InviteEmployeeData>();

  // Handle machine employee selection
  const handleEmployeeSelect = (employeeId: string) => {
    const employee = machineEmployeesList.find(
      (emp: any) => emp.employeeId === employeeId
    );
    if (employee) {
      setSelectedEmployee(employee);
      setValue("name", employee.name);
      setValue("employeeId", employee.employeeId);
      setUseCustomName(false);
    }
  };

  // Handle custom name toggle
  const handleCustomNameToggle = () => {
    setUseCustomName(!useCustomName);
    if (!useCustomName) {
      // Switching to custom name
      setSelectedEmployee(null);
      setValue("name", "");
      setValue("employeeId", "");
    }
  };

  const inviteEmployeeMutation = useMutation({
    mutationFn: authAPI.inviteEmployee,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      reset();
      setTags([]);
      onClose();

      // Check email delivery status from updated backend response
      if (response.data.emailSent === false) {
        console.warn(
          "Employee invitation created but email failed:",
          response.data.emailError
        );
        console.warn("Warning:", response.data.warning);
        // addNotification({
        //   type: "warning",
        //   title: "Employee Added - Email Failed",
        //   message: `Employee ${variables.name} added but invitation email failed: ${response.data.emailError}`,
        // });
      } else if (response.data.emailSent === true) {
        console.log(
          "Employee invitation email sent successfully to",
          variables.email
        );
        console.log("Email Message ID:", response.data.emailMessageId);
        // addNotification({
        //   type: "success",
        //   title: "Employee Invited Successfully",
        //   message: `Invitation email sent to ${variables.email} successfully!`,
        // });
      } else {
        // Fallback for any other response format
        console.log("Employee invitation processed for", variables.email);
        // addNotification({
        //   type: "success",
        //   title: "Employee Invited",
        //   message: `Invitation processed for ${variables.email}.`,
        // });
      }
    },
    onError: (error: any) => {
      // addNotification({
      //   type: "error",
      //   title: "Invitation Failed",
      //   message:
      //     error?.response?.data?.message ||
      //     "Failed to send employee invitation. Please try again.",
      // });
      console.error(
        "Employee invitation failed:",
        error?.response?.data?.message || error.message
      );
    },
  });

  const onSubmit = async (data: InviteEmployeeData) => {
    // Validate name is selected when using machine dropdown
    if (!useCustomName && !selectedEmployee) {
      alert(
        "Please select an employee from the machine list or switch to custom name input."
      );
      return;
    }

    const formData = { ...data, tags };
    await inviteEmployeeMutation.mutateAsync(formData);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleClose = () => {
    reset();
    setTags([]);
    setTagInput("");
    setSelectedEmployee(null);
    setUseCustomName(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Employee"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee Selection */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                Employee Name
              </label>
              <button
                type="button"
                onClick={handleCustomNameToggle}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {useCustomName ? "Select from Machine" : "Enter Custom Name"}
              </button>
            </div>

            {!useCustomName && machineEmployeesList.length > 0 ? (
              // Machine Employee Dropdown
              <Select
                value={selectedEmployee?.employeeId || ""}
                onChange={handleEmployeeSelect}
                placeholder="Select employee from machine"
                options={machineEmployeesList.map((employee: any) => ({
                  value: employee.employeeId,
                  label: `${employee.name} (ID: ${employee.employeeId})`,
                }))}
              />
            ) : (
              // Custom Name Input
              <input
                type="text"
                {...register("name", { required: "Full name is required" })}
                className={INPUT}
                placeholder="Enter full name"
              />
            )}

            {machineLoading && (
              <p className="mt-2 text-sm text-blue-600 flex items-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Loading machine employees...</span>
              </p>
            )}

            {!machineLoading &&
              machineEmployeesList.length === 0 &&
              !useCustomName && (
                <p className="mt-2 text-sm text-yellow-600 flex items-center">
                  <ExclamationTriangleIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                  No machine employees found. Using custom name input.
                </p>
              )}

            {errors.name && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Employee ID */}
          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              <HashtagIcon className="w-4 h-4 mr-2 text-gray-400" />
              Employee ID
            </label>
            <input
              type="text"
              {...register("employeeId")}
              className={INPUT}
              placeholder="Auto-generated or from machine selection"
              readOnly={!useCustomName && selectedEmployee}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {!useCustomName && selectedEmployee
                ? "Auto-filled from machine employee selection"
                : "Leave empty for auto-generation (EMP0001, EMP0002, etc.)"}
            </p>
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
              Email Address
            </label>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className={INPUT}
              placeholder="employee@company.com"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone - the delivery address for WhatsApp notifications */}
          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              {...register("phone", phoneValidationRules)}
              className={INPUT}
              placeholder={PHONE_PLACEHOLDER}
            />
            {errors.phone ? (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                {errors.phone.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {PHONE_HINT}
              </p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
              Department
            </label>
            <Controller
              name="department"
              control={control}
              rules={{ required: "Department is required" }}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select department"
                  options={DEPARTMENT_OPTIONS}
                />
              )}
            />
            {errors.department && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                {errors.department.message}
              </p>
            )}
          </div>

          {/* Position */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              <BriefcaseIcon className="w-4 h-4 mr-2 text-gray-400" />
              Position
            </label>
            <Controller
              name="position"
              control={control}
              rules={{ required: "Position is required" }}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select position"
                  options={POSITION_OPTIONS}
                />
              )}
            />
            {errors.position && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                {errors.position.message}
              </p>
            )}
          </div>

          {/* Join Date */}
          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
              Join Date
            </label>
            <Controller
              name="joinDate"
              control={control}
              rules={{ required: "Join date is required" }}
              render={({ field }) => (
                <DatePicker
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select date"
                />
              )}
            />
            {errors.joinDate && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                {errors.joinDate.message}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              <TagIcon className="w-4 h-4 mr-2 text-gray-400" />
              Tags (Optional)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className={INPUT}
              placeholder="Add tags and press Enter"
            />

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary px-6 py-3"
            disabled={inviteEmployeeMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={inviteEmployeeMutation.isPending}
            className="btn-primary px-8 py-3 inline-flex items-center"
          >
            {inviteEmployeeMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Sending Invitation Email...</span>
              </>
            ) : (
              <>
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeInviteModal;

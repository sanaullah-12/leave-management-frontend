import React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authAPI } from "../services/api";
// import { useNotifications } from "../components/NotificationSystem"; // Removed for Socket.IO implementation
import Modal from "./Modal";
import LoadingSpinner from "./LoadingSpinner";
import {
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CalendarIcon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type InviteEmployeeData = {
  name: string;
  email: string;
  department: string;
  position: string;
  joinDate: string;
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteEmployeeData>();

  const inviteEmployeeMutation = useMutation({
    mutationFn: authAPI.inviteEmployee,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      reset();
      setTags([]);
      onClose();

      // Check if email delivery failed (status 202 = partial success)
      if (response.warning && response.warning === 'Email delivery failed') {
        console.warn('Employee invitation created but email failed:', response.emailError);
        // addNotification({
        //   type: "warning",
        //   title: "Employee Added - Email Failed",
        //   message: `Employee ${variables.name} added but invitation email failed. Share the link manually: ${response.manualInviteUrl}`,
        // });
      } else {
        console.log('Employee invitation sent successfully to', variables.email);
        // addNotification({
        //   type: "success",
        //   title: "Employee Invited",
        //   message: `Invitation sent to ${variables.email} successfully.`,
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
      console.error('Employee invitation failed:', error?.response?.data?.message || error.message);
    },
  });

  const onSubmit = async (data: InviteEmployeeData) => {
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
          {/* Full Name */}
          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
              Full Name
            </label>
            <input
              type="text"
              {...register("name", { required: "Full name is required" })}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                ⚠ {errors.name.message}
              </p>
            )}
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
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              placeholder="employee@company.com"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                ⚠ {errors.email.message}
              </p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
              Department
            </label>
            <select
              {...register("department", {
                required: "Department is required",
              })}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select department</option>
              <option value="Engineering">Engineering</option>
              <option value="Product & Development">
                Product & Development
              </option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Customer Success">Customer Success</option>
            </select>
            {errors.department && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                ⚠ {errors.department.message}
              </p>
            )}
          </div>

          {/* Position */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              <BriefcaseIcon className="w-4 h-4 mr-2 text-gray-400" />
              Position
            </label>
            <select
              {...register("position", { required: "Position is required" })}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select position</option>
              <option value="Intern">Intern</option>
              <option value="Jr.Software Engineer">Jr.Software Engineer</option>
              <option value="Sr.Software Engineer">Sr.Software Engineer</option>
              <option value="Sr.Project Manager">Sr.Project Manager</option>
              <option value="Product Manager">Product Manager</option>
              <option value="UX/UI Designer">UX/UI Designer</option>
              <option value="Marketing Specialist">Marketing Specialist</option>
              <option value="Sales Representative">Sales Representative</option>
              <option value="HR Specialist">HR Specialist</option>
              <option value="Financial Analyst">Financial Analyst</option>
              <option value="Operations Manager">Operations Manager</option>
            </select>
            {errors.position && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                ⚠ {errors.position.message}
              </p>
            )}
          </div>

          {/* Join Date */}
          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
              <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
              Join Date
            </label>
            <input
              type="date"
              {...register("joinDate", { required: "Join date is required" })}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
            {errors.joinDate && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                ⚠ {errors.joinDate.message}
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
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
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
                <span className="ml-2">Sending...</span>
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

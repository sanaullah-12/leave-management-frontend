import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Employee {
  machineId: string;
  name: string;
  employeeId: string;
  cardNumber?: string | null;
  department: string;
  enrolledAt: Date;
  isActive: boolean;
  idMapping?: {
    uid: string | number;
    userId?: string | number;
    cardno?: string | number | null;
    source: string;
  };
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onFetchRecords: (employee: Employee, forceRefresh?: boolean) => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  employee,
  onFetchRecords,
}) => {
  const [isGeneratingPDF] = useState(false);

  if (!employee) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Attendance Records - {employee.name}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Employee Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>{" "}
                        <span className="font-medium">{employee.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Employee ID:</span>{" "}
                        <span className="font-medium">{employee.employeeId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Machine ID:</span>{" "}
                        <span className="font-medium">{employee.machineId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Department:</span>{" "}
                        <span className="font-medium">{employee.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Attendance records will be displayed here.
                    </p>
                    <button
                      onClick={() => onFetchRecords(employee, true)}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      disabled={isGeneratingPDF}
                    >
                      Fetch Attendance Records
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AttendanceModal;
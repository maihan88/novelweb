// src/components/ConfirmationModal.tsx
import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react'; // Bạn cần cài đặt: npm install @headlessui/react
import { ExclamationTriangleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void; // Dùng onClose thay vì onCancel để đóng modal
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  isDestructive?: boolean; // Tùy chọn để đổi màu nút confirm (ví dụ: nút xóa)
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  confirmButtonClass,
  isDestructive = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose(); // Tự động đóng modal sau khi xác nhận
  };

  // Xác định class cho nút confirm dựa trên isDestructive
  const defaultConfirmClass = isDestructive
    ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500' // Màu đỏ cho hành động nguy hiểm
    : 'bg-orange-600 hover:bg-orange-700 focus-visible:ring-orange-500'; // Màu cam mặc định

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Lớp phủ */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Lớp phủ nền mờ */}
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        {/* Nội dung Modal */}
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-stone-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-200 dark:border-stone-700">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold leading-6 text-slate-900 dark:text-white flex items-center gap-2"
                >
                  {/* Icon cảnh báo nếu là hành động nguy hiểm */}
                  {isDestructive && <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0" aria-hidden="true" />}
                  {title}
                </Dialog.Title>
                <div className="mt-3">
                  {/* Nội dung thông báo */}
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {message}
                  </div>
                </div>

                {/* Nút bấm */}
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
                   {/* Nút Hủy */}
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-slate-300 dark:border-stone-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-800 transition-colors sm:w-auto sm:order-1"
                    onClick={onClose}
                  >
                     <XMarkIcon className="h-5 w-5 mr-1 -ml-1" aria-hidden="true" />
                    {cancelText}
                  </button>
                  {/* Nút Xác nhận */}
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-800 transition-colors sm:w-auto sm:order-2 ${confirmButtonClass || defaultConfirmClass}`}
                    onClick={handleConfirm}
                  >
                     <CheckIcon className="h-5 w-5 mr-1 -ml-1" aria-hidden="true" />
                    {confirmText}
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

export default ConfirmationModal;

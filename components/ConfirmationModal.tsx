import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  isDestructive?: boolean;
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
    onClose();
  };

  // Nút confirm: Nếu destructive thì dùng màu đỏ, ngược lại dùng sukem-primary
  const defaultConfirmClass = isDestructive
    ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
    : 'bg-sukem-primary hover:opacity-90 focus-visible:ring-sukem-primary';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" aria-hidden="true" />
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
              {/* Panel: bg-sukem-card */}
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-sukem-card p-6 text-left align-middle shadow-xl transition-all border border-sukem-border">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold leading-6 text-sukem-text flex items-center gap-2"
                >
                  {isDestructive && <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0" aria-hidden="true" />}
                  {title}
                </Dialog.Title>
                <div className="mt-3">
                  <div className="text-sm text-sukem-text-muted">
                    {message}
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-sukem-border px-4 py-2 text-sm font-medium text-sukem-text-muted hover:bg-sukem-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-sukem-primary focus-visible:ring-offset-2 transition-colors sm:w-auto sm:order-1"
                    onClick={onClose}
                  >
                     <XMarkIcon className="h-5 w-5 mr-1 -ml-1" aria-hidden="true" />
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-opacity sm:w-auto sm:order-2 ${confirmButtonClass || defaultConfirmClass}`}
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
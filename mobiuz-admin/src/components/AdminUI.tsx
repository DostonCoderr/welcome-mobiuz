
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import {
  Search,
  Plus,
  X,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";

// ==================== PAGE HEADER ====================

interface PageHeaderProps {
  title: string;
  description?: string;
  buttonText?: string;
  onAdd?: () => void;
}

export function PageHeader({
  title,
  description,
  buttonText = "Добавить",
  onAdd,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>

        {description && (
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        )}
      </div>

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
        >
          <Plus size={18} />
          {buttonText}
        </button>
      )}
    </div>
  );
}

// ==================== SEARCH ====================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Поиск...",
}: SearchInputProps) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
      />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#171717] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-red-500"
      />
    </div>
  );
}

// ==================== MODAL ====================

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#171717] p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        {children}
      </motion.div>
    </div>
  );
}

// ==================== INPUT ====================

interface FormInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}: FormInputProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#202020] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}

// ==================== TEXTAREA ====================

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
}

export function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
}: FormTextareaProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <textarea
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl border border-white/10 bg-[#202020] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}

// ==================== LOADING ====================

export function LoadingState() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Loader2 className="animate-spin text-red-500" size={30} />
    </div>
  );
}

// ==================== EMPTY ====================

interface EmptyStateProps {
  text?: string;
}

export function EmptyState({
  text = "Данные не найдены",
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

// ==================== DELETE BUTTON ====================

interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function DeleteButton({
  onClick,
  disabled = false,
}: DeleteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 size={14} />
      Удалить
    </button>
  );
}

// ==================== ERROR ====================

interface ErrorStateProps {
  message: string;
}

export function ErrorState({
  message,
}: ErrorStateProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
      <AlertCircle size={18} />
      {message}
    </div>
  );
}

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, FileText, X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { CategoryCombobox } from '@/components/ui/CategoryCombobox';
import { DatePicker } from '@/components/ui/DatePicker';
import { parseFile, parseText, type ParsedTransaction, type ParseResult } from '@/utils/parserEngine';
import { cn } from '@/utils/cn';

interface ParseConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<ParsedTransaction, 'source' | 'confidence' | 'missingFields' | 'rawText'>) => Promise<void>;
  initialData?: ParsedTransaction | null;
}

const defaultCategories = [
  'Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities',
  'Healthcare', 'Groceries', 'Personal', 'Other',
];

export function ParseConfirmation({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ParseConfirmationProps) {
  const [formData, setFormData] = useState({
    amount: initialData?.amount?.toString() || '',
    merchant: initialData?.merchant || '',
    category: initialData?.category || 'Other',
    date: initialData?.date ? initialData.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    type: initialData?.type || 'expense',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confidenceColor =
    initialData?.confidence === 'high'
      ? 'text-emerald-400'
      : initialData?.confidence === 'medium'
      ? 'text-amber-400'
      : 'text-rose-400';

  const handleSave = async () => {
    const amount = parseFloat(formData.amount);
    if (!isFinite(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        amount,
        merchant: formData.merchant,
        category: formData.category,
        date: new Date(formData.date),
        type: formData.type as 'expense' | 'income',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: initialData?.amount?.toString() || '',
      merchant: initialData?.merchant || '',
      category: initialData?.category || 'Other',
      date: initialData?.date ? initialData.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      type: initialData?.type || 'expense',
    });
    setError(null);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Review Transaction" className="max-h-[90vh]">
      <div className="space-y-6">
        {/* Confidence indicator */}
        {initialData && (
          <div className={cn('flex items-center gap-2 rounded-xl bg-secondary/30 p-3 text-sm', confidenceColor)}>
            {initialData.confidence === 'high' ? (
              <Check className="h-4 w-4" />
            ) : initialData.confidence === 'medium' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="font-medium">
              {initialData.confidence === 'high'
                ? 'High confidence - ready to save'
                : initialData.confidence === 'medium'
                ? 'Review suggested - some fields may need adjustment'
                : 'Low confidence - please verify all fields'}
            </span>
          </div>
        )}

        {/* Amount */}
        <PremiumInput
          label="Amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          prefix="₹"
          size="large"
          placeholder="0"
          error={error?.includes('amount') ? error || undefined : undefined}
        />

        {/* Merchant */}
        <PremiumInput
          label="Merchant"
          value={formData.merchant}
          onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
          placeholder="Store or service name"
          size="large"
        />

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Category</label>
          <CategoryCombobox
            value={formData.category}
            options={defaultCategories}
            onChange={(category) => setFormData({ ...formData, category })}
            placeholder="Select category"
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Date</label>
          <DatePicker
            value={formData.date}
            onChange={(date) => date && setFormData({ ...formData, date })}
          />
        </div>

        {/* Type toggle */}
        <div className="flex rounded-xl border border-border bg-secondary/30 p-1">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            className={cn(
              'flex-1 rounded-lg py-2.5 text-sm font-medium transition-all',
              formData.type === 'expense'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            className={cn(
              'flex-1 rounded-lg py-2.5 text-sm font-medium transition-all',
              formData.type === 'income'
                ? 'bg-emerald-500 text-white shadow'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Income
          </button>
        </div>

        {/* Error message */}
        {error && !error.includes('amount') && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !formData.amount}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Transaction'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

interface FileUploadProps {
  onParsed: (result: ParseResult) => void;
  onTextParsed?: (text: string) => void;
}

export function FileUpload({ onParsed, onTextParsed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const result = await parseFile(file);
      onParsed(result);
    } finally {
      setIsProcessing(false);
    }
  };

  const processText = (text: string) => {
    if (onTextParsed) {
      onTextParsed(text);
    } else {
      const result = parseText(text);
      onParsed(result);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type.includes('image') || file.type.includes('pdf'))) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 transition-all',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-secondary/20 hover:border-primary/50 hover:bg-secondary/30',
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          aria-label="Upload transaction image or PDF"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Processing...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-center text-sm font-medium text-foreground">
              Drop an image or PDF here, or click to browse
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Receipts, screenshots, bank statements
            </p>
          </>
        )}
      </div>

      {/* Text input alternative */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Or paste text manually</label>
        <textarea
          ref={textInputRef}
          className="min-h-[120px] w-full resize-none rounded-2xl border border-border bg-background/50 p-4 text-sm text-foreground outline-none focus:border-primary"
          placeholder="Paste SMS, receipt text, or transaction details..."
          onBlur={(e) => {
            if (e.target.value.trim()) {
              processText(e.target.value.trim());
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <ImageIcon className="h-4 w-4" />
          Upload Image
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <FileText className="h-4 w-4" />
          Upload PDF
        </Button>
      </div>
    </div>
  );
}

interface SmartInputProps {
  onSave: (transaction: Omit<ParsedTransaction, 'source' | 'confidence' | 'missingFields' | 'rawText'>) => Promise<void>;
}

export function SmartInput({ onSave }: SmartInputProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<ParsedTransaction | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleParsed = (result: ParseResult) => {
    if (result.errors.length > 0) {
      setParseError(result.errors[0]);
      return;
    }

    setParseError(null);

    if (result.transactions.length === 0) {
      setParseError('No transaction data found. Please try again with a clearer image or text.');
      return;
    }

    // If single clear result, show confirmation
    if (result.transactions.length === 1) {
      setPendingTransaction(result.transactions[0]);
      setShowConfirmation(true);
    }
  };

  const handleSave = async (transaction: Omit<ParsedTransaction, 'source' | 'confidence' | 'missingFields' | 'rawText'>) => {
    await onSave(transaction);
    setShowUpload(false);
    setShowConfirmation(false);
    setPendingTransaction(null);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Smart Import</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>

        {parseError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {parseError}
          </div>
        )}
      </div>

      <BottomSheet isOpen={showUpload} onClose={() => setShowUpload(false)} title="Import Transaction">
        <FileUpload onParsed={handleParsed} />
      </BottomSheet>

      <ParseConfirmation
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setPendingTransaction(null);
        }}
        onSave={handleSave}
        initialData={pendingTransaction}
      />
    </>
  );
}

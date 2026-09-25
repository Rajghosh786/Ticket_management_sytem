import { useState } from "react";
import { createTicket } from "../services/ticketService.js";
import StyledSelect from "./StyledSelect.jsx";

const CATEGORIES = ["FEES", "ATTENDANCE", "CERTIFICATES", "IT_SUPPORT"];

function validateForm(values) {
    const errors = {};
    if (!values.category) errors.category = "Category is required";
    if (!values.title.trim()) errors.title = "Title is required";
    if (!values.description.trim()) errors.description = "Description is required";
    return errors;
}

export default function RaiseTicketModal({ open, onClose, onCreated }) {
    const [category, setCategory] = useState("FEES");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!open) {
        return null;
    }

    const resetForm = () => {
        setCategory("FEES");
        setTitle("");
        setDescription("");
        setFieldErrors({});
        setSubmitError("");
        setSuccessMessage("");
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetForm();
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitError("");
        setSuccessMessage("");

        const errors = validateForm({ category, title, description });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            const ticket = await createTicket({
                category,
                title: title.trim(),
                description: description.trim(),
            });
            setSuccessMessage(`Ticket ${ticket.ticketId} created successfully.`);
            onCreated?.(ticket);
            setTimeout(() => {
                resetForm();
                onClose();
            }, 800);
        } catch (error) {
            setSubmitError(error.message || "Unable to create ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="modal-surface max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6"
                role="dialog"
                aria-modal="true"
                aria-labelledby="raise-ticket-title"
            >
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h2 id="raise-ticket-title" className="text-xl font-bold text-slate-900 dark:text-slate-50">
                            Raise New Ticket
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Department, SLA, and default priority (MEDIUM) are assigned automatically.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="rounded-lg px-2 py-1 text-slate-500 hover:bg-black/5 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-slate-200"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Category</label>
                        <StyledSelect
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={isSubmitting}
                            options={CATEGORIES.map((item) => ({ value: item, label: item.replaceAll("_", " ") }))}
                            ariaLabel="Category"
                        />
                        {fieldErrors.category ? (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
                        ) : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isSubmitting}
                            className="field-control w-full rounded-xl px-3 py-2"
                            placeholder="Brief summary of your request"
                        />
                        {fieldErrors.title ? (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
                        ) : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isSubmitting}
                            rows={4}
                            className="field-control w-full rounded-xl px-3 py-2"
                            placeholder="Provide details for the support team"
                        />
                        {fieldErrors.description ? (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                        ) : null}
                    </div>

                    {submitError ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                            {submitError}
                        </p>
                    ) : null}

                    {successMessage ? (
                        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
                            {successMessage}
                        </p>
                    ) : null}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="rounded-xl border border-(--line) px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="primary-button rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70"
                        >
                            {isSubmitting ? "Creating..." : "Create Ticket"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

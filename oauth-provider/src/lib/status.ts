


const statusConfig: Record<string, { label: string; className: string }> = {
    completed:  { label: 'Completed',  className: 'bg-green-50 text-green-600 border border-green-100' },
    pending:    { label: 'Pending',    className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    processing: { label: 'Processing', className: 'bg-blue-50 text-blue-600 border border-blue-100' },
    failed:     { label: 'Failed',     className: 'bg-red-50 text-red-600 border border-red-100' },
    refunded:   { label: 'Refunded',   className: 'bg-gray-50 text-gray-500 border border-gray-100' },
};


export { statusConfig }
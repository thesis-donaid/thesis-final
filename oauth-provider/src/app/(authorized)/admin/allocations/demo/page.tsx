"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Wallet,
  Building2,
  Calendar,
  User,
  FileText,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Banknote,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { AvailableFunds } from "@/types/allocation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { useSession } from "next-auth/react";

// Types for API responses
interface BeneficiaryRequestData {
  id: number;
  purpose: string;
  amount: number;
  date_needed: string;
  email: string;
  additional_notes?: string;
  urgency_level: "LOW" | "MEDIUM" | "HIGH";
  status: string;
  created_at: string;
  allocatedAmount: number;
  remainingToAllocate: number;
  beneficiary: {
    id: number;
    firstName?: string;
    lastName?: string;
    username: string;
    type: string;
    email?: string;
  };
  documents: {
    id: number;
    file_name: string;
    file_type: string;
    file_url?: string;
  }[];
  allocations: {
    id: number;
    amount: number;
    source_type: string;
    pool?: { name: string };
  }[];
}

interface RequestListItem {
  id: number;
  purpose: string;
  amount: number;
  status: string;
  urgency_level: string;
  allocatedAmount: number;
  remainingToAllocate: number;
  beneficiary: {
    firstName?: string;
    lastName?: string;
    type: string;
  };
}

type SourceType = "UNRESTRICTED" | "RESTRICTED";

interface AllocationEntry {
  id: string;
  sourceType: SourceType;
  poolId?: string;
  amount: number;
}

export default function AllocationDemoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestIdParam = searchParams.get("requestId");

  // Data fetching state
  const [loading, setLoading] = useState(true);
  const [requestsList, setRequestsList] = useState<RequestListItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<BeneficiaryRequestData | null>(null);
  const [availableFunds, setAvailableFunds] = useState<AvailableFunds | null>(null);

  // Form state
  const [allocations, setAllocations] = useState<AllocationEntry[]>([]);
  const [disbursementDate, setDisbursementDate] = useState("");
  const [disbursementNotes, setDisbursementNotes] = useState("");
  const [notifyDonors, setNotifyDonors] = useState(true);
  const [notifyBeneficiary, setNotifyBeneficiary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch pending requests on mount
  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // Fetch specific request when requestId changes
  useEffect(() => {
    if (requestIdParam) {
      fetchRequestDetails(parseInt(requestIdParam));
    }
  }, [requestIdParam]);

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch("/api/admin/requests?status=PENDING,UNDER_REVIEW");
      const data = await res.json();
      if (data.success) {
        setRequestsList(data.data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetails = async (requestId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedRequest(data.data.request);
        setAvailableFunds(data.data.availableFunds);
        // Reset form
        setAllocations([]);
        setDisbursementDate("");
        setDisbursementNotes("");
        setResult(null);
      }
    } catch (error) {
      console.error("Failed to fetch request details:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectRequest = (requestId: number) => {
    router.push(`/admin/allocations/demo?requestId=${requestId}`);
  };

  const goBackToList = () => {
    setSelectedRequest(null);
    setAvailableFunds(null);
    router.push("/admin/allocations/demo");
  };

  // Calculations
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remainingToAllocate = selectedRequest 
    ? selectedRequest.amount - selectedRequest.allocatedAmount - totalAllocated 
    : 0;

  // Add new allocation entry
  const addAllocation = () => {
    setAllocations([
      ...allocations,
      {
        id: crypto.randomUUID(),
        sourceType: "UNRESTRICTED",
        amount: 0,
      },
    ]);
  };

  // Remove allocation entry
  const removeAllocation = (id: string) => {
    setAllocations(allocations.filter((a) => a.id !== id));
  };

  // Update allocation entry
  const updateAllocation = (id: string, updates: Partial<AllocationEntry>) => {
    setAllocations(
      allocations.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  // Get available balance for a source
  const getAvailableBalance = (sourceType: SourceType, poolId?: string) => {
    if (!availableFunds) return 0;
    if (sourceType === "UNRESTRICTED") {
      return availableFunds.unrestricted.available;
    }
    const pool = availableFunds.restricted.find((p) => p.poolId === poolId);
    return pool?.available ?? 0;
  };

  // Validate allocations
  const validateAllocations = () => {
    const errors: string[] = [];

    if (!selectedRequest) {
      errors.push("No request selected");
      return errors;
    }

    if (allocations.length === 0) {
      errors.push("Add at least one allocation");
    }

    for (const allocation of allocations) {
      if (allocation.amount <= 0) {
        errors.push("All allocation amounts must be greater than 0");
        break;
      }

      if (allocation.sourceType === "RESTRICTED" && !allocation.poolId) {
        errors.push("Select a pool for restricted allocations");
        break;
      }

      const available = getAvailableBalance(allocation.sourceType, allocation.poolId);
      if (allocation.amount > available) {
        const poolName = availableFunds?.restricted.find(p => p.poolId === allocation.poolId)?.poolName;
        errors.push(`Insufficient funds in ${allocation.sourceType === "UNRESTRICTED" ? "Unrestricted" : poolName}`);
        break;
      }
    }

    if (totalAllocated > selectedRequest.remainingToAllocate) {
      errors.push("Total allocation exceeds remaining amount to allocate");
    }

    if (!disbursementDate) {
      errors.push("Set a disbursement date");
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedRequest) return;

    const errors = validateAllocations();
    if (errors.length > 0) {
      setResult({ success: false, message: errors.join(", ") });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const payload = {
        requestId: selectedRequest.id,
        allocations: allocations.map((a) => ({
          sourceType: a.sourceType,
          poolId: a.poolId,
          amount: a.amount,
        })),
        disbursementDate,
        disbursementNotes,
        notifyDonors,
        notifyBeneficiary,
      };

      const res = await fetch("/api/admin/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: `Successfully allocated ₱${totalAllocated.toLocaleString()} to Request #${selectedRequest.id}. ${data.data?.notifications?.donorCount ? `${data.data.notifications.donorCount} donors notified. ` : ""}${data.data?.notifications?.beneficiaryNotified ? "Beneficiary notified." : ""}`,
        });
        // Refresh the request details
        fetchRequestDetails(selectedRequest.id);
        // Clear allocations form
        setAllocations([]);
      } else {
        setResult({
          success: false,
          message: data.errors?.join(", ") || data.error || "Allocation failed",
        });
      }
    } catch (error) {
      console.error("Allocation error:", error);
      setResult({
        success: false,
        message: "An error occurred while processing the allocation",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Request List View (when no request is selected)
  if (!selectedRequest) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Budget Allocation</h1>
            <p className="text-gray-600 mt-1">
              Select a request to allocate funds
            </p>
          </div>

          {requestsList.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
              <p className="text-gray-500">There are no requests waiting for allocation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requestsList.map((request) => (
                <div
                  key={request.id}
                  onClick={() => selectRequest(request.id)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">Request #{request.id}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          request.status === "PENDING" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {request.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          request.urgency_level === "HIGH" 
                            ? "bg-red-100 text-red-700"
                            : request.urgency_level === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {request.urgency_level}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{request.purpose}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {request.beneficiary.firstName} {request.beneficiary.lastName}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {request.beneficiary.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-primary">
                        ₱{request.amount.toLocaleString()}
                      </p>
                      {request.allocatedAmount > 0 && (
                        <p className="text-sm text-gray-500">
                          ₱{request.allocatedAmount.toLocaleString()} allocated
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Request Detail View (allocation form)
  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={goBackToList}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to requests
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Budget Allocation</h1>
          <p className="text-gray-600 mt-1">
            Allocate funds to Request #{selectedRequest.id}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Request Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Request Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Request #{selectedRequest.id}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedRequest.status === "PENDING" 
                    ? "bg-yellow-100 text-yellow-800" 
                    : selectedRequest.status === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {selectedRequest.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Beneficiary</p>
                    <p className="font-medium">
                      {selectedRequest.beneficiary.firstName} {selectedRequest.beneficiary.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{selectedRequest.beneficiary.type}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Purpose</p>
                    <p className="font-medium">{selectedRequest.purpose}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Banknote className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Amount Requested</p>
                    <p className="font-medium text-xl text-primary">
                      ₱{selectedRequest.amount.toLocaleString()}
                    </p>
                    {selectedRequest.allocatedAmount > 0 && (
                      <p className="text-sm text-green-600">
                        ₱{selectedRequest.allocatedAmount.toLocaleString()} already allocated
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date Needed</p>
                    <p className="font-medium">
                      {new Date(selectedRequest.date_needed).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  selectedRequest.urgency_level === "HIGH" 
                    ? "bg-red-50 text-red-700"
                    : selectedRequest.urgency_level === "MEDIUM"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-green-50 text-green-700"
                }`}>
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{selectedRequest.urgency_level} Urgency</span>
                </div>
              </div>

              {/* Documents */}
              {selectedRequest.documents.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Attached Documents</p>
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        {doc.file_name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Allocations */}
              {selectedRequest.allocations.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Existing Allocations</p>
                  <div className="space-y-2">
                    {selectedRequest.allocations.map((alloc) => (
                      <div key={alloc.id} className="flex items-center justify-between text-sm bg-green-50 p-2 rounded">
                        <span className="text-green-800">
                          {alloc.source_type === "UNRESTRICTED" ? "Unrestricted" : alloc.pool?.name}
                        </span>
                        <span className="font-medium text-green-900">
                          ₱{alloc.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Available Funds Overview */}
            {availableFunds && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Available Funds</h3>
                
                {/* Unrestricted */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Unrestricted</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    ₱{availableFunds.unrestricted.available.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600/70">
                    of ₱{availableFunds.unrestricted.total.toLocaleString()} total
                  </p>
                </div>

                {/* Restricted Pools */}
                {availableFunds.restricted.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-700">Restricted Pools</span>
                    </div>
                    {availableFunds.restricted.map((pool) => (
                      <div key={pool.poolId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{pool.poolName}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          ₱{pool.available.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Allocation Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Allocation Entries */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Allocate Funds</h3>
                <Button onClick={addAllocation} size="sm">
                  <Plus className="w-4 h-4" />
                  Add Source
                </Button>
              </div>

              {allocations.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No allocations added yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click &quot;Add Source&quot; to start allocating funds
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allocations.map((allocation, index) => (
                    <div
                      key={allocation.id}
                      className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-600">
                          Source #{index + 1}
                        </span>
                        <button
                          onClick={() => removeAllocation(allocation.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Source Type */}
                        <div>
                          <Label className="text-sm">Fund Source</Label>
                          <select
                            value={allocation.sourceType}
                            onChange={(e) =>
                              updateAllocation(allocation.id, {
                                sourceType: e.target.value as SourceType,
                                poolId: undefined,
                              })
                            }
                            className="mt-1 w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="UNRESTRICTED">Unrestricted</option>
                            <option value="RESTRICTED">Restricted (Pool)</option>
                          </select>
                        </div>

                        {/* Pool Selection (if restricted) */}
                        {allocation.sourceType === "RESTRICTED" && availableFunds && (
                          <div>
                            <Label className="text-sm">Select Pool</Label>
                            <select
                              value={allocation.poolId || ""}
                              onChange={(e) =>
                                updateAllocation(allocation.id, {
                                  poolId: e.target.value,
                                })
                              }
                              className="mt-1 w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Select a pool...</option>
                              {availableFunds.restricted.map((pool) => (
                                <option key={pool.poolId} value={pool.poolId}>
                                  {pool.poolName} (₱{pool.available.toLocaleString()})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Amount */}
                        <div>
                          <Label className="text-sm">Amount (₱)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={getAvailableBalance(allocation.sourceType, allocation.poolId)}
                            value={allocation.amount || ""}
                            onChange={(e) =>
                              updateAllocation(allocation.id, {
                                amount: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Enter amount"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Available: ₱{getAvailableBalance(allocation.sourceType, allocation.poolId).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Allocation Summary */}
              {allocations.length > 0 && selectedRequest && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Total Allocated</span>
                    <span className="text-xl font-bold text-gray-900">
                      ₱{totalAllocated.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Remaining to Allocate</span>
                    <span className={`font-medium ${remainingToAllocate < 0 ? "text-red-600" : remainingToAllocate === 0 ? "text-green-600" : "text-yellow-600"}`}>
                      ₱{remainingToAllocate.toLocaleString()}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        totalAllocated + selectedRequest.allocatedAmount > selectedRequest.amount
                          ? "bg-red-500"
                          : totalAllocated + selectedRequest.allocatedAmount === selectedRequest.amount
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.min(((totalAllocated + selectedRequest.allocatedAmount) / selectedRequest.amount) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Disbursement Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Disbursement Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="disbursement-date">Disbursement Date *</Label>
                  <Input
                    id="disbursement-date"
                    type="date"
                    value={disbursementDate}
                    onChange={(e) => setDisbursementDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="disbursement-notes">Notes (Optional)</Label>
                <Textarea
                  id="disbursement-notes"
                  value={disbursementNotes}
                  onChange={(e) => setDisbursementNotes(e.target.value)}
                  placeholder="e.g., Release via bank transfer to beneficiary account"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            {/* Notification Options */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Notifications</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyDonors}
                    onChange={(e) => setNotifyDonors(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Notify Donors</span>
                    <p className="text-sm text-gray-500">
                      Send email to donors whose money is being used for this allocation
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyBeneficiary}
                    onChange={(e) => setNotifyBeneficiary(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Notify Beneficiary</span>
                    <p className="text-sm text-gray-500">
                      Send email with approval confirmation and disbursement date
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Result Message */}
            {result && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                result.success
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <p>{result.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={goBackToList}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || allocations.length === 0 || selectedRequest.status === "APPROVED"}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Allocate & Approve
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Debug Panel - Shows what would be sent to API */}
        <div className="mt-8 bg-gray-900 rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-green-400">●</span>
            API Request Preview (POST /api/admin/allocations)
          </h3>
          <pre className="text-sm overflow-x-auto text-gray-300">
            {JSON.stringify(
              {
                requestId: selectedRequest.id,
                allocations: allocations.map((a) => ({
                  sourceType: a.sourceType,
                  poolId: a.poolId,
                  amount: a.amount,
                })),
                disbursementDate: disbursementDate || null,
                disbursementNotes: disbursementNotes || null,
                notifyDonors,
                notifyBeneficiary,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
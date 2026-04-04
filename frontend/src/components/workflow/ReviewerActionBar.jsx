import React from 'react';
import { MessageSquare, CheckCircle, XCircle, Lock } from 'lucide-react';

const ReviewerActionBar = ({ 
  currentUser, 
  myMember, 
  reviewCycleId,
  onAddComment,
  onApprove,
  onReject,
  isLocked = false
}) => {
  // Check if user can participate
  const userRole = currentUser?.profile?.role;
  const canParticipate = userRole && ['approver', 'manager', 'admin'].includes(userRole);
  const isLiteUser = userRole === 'lite_user';
  
  // Check if user has already made a decision
  const hasDecided = myMember && myMember.decision !== 'pending';
  
  // Determine if buttons should be disabled
  const isDisabled = !canParticipate || isLocked || hasDecided || !myMember;
  
  // Don't show the bar for lite users
  if (isLiteUser || !myMember) {
    return null;
  }
  
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        {/* SOCD Status Indicator */}
        {myMember && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Your Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              myMember.socd_status === 'sent' ? 'bg-gray-100 text-gray-700' :
              myMember.socd_status === 'open' ? 'bg-green-100 text-green-700' :
              myMember.socd_status === 'commented' ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            }`}>
              {myMember.socd_status === 'sent' ? '⚪ Sent' :
               myMember.socd_status === 'open' ? '🟢 Opened' :
               myMember.socd_status === 'commented' ? '🔵 Commented' :
               '✅ Decision Made'}
            </span>
          </div>
        )}
        
        {/* Lock Status */}
        {isLocked && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
            <Lock size={14} />
            <span>Group is locked - waiting for previous stage</span>
          </div>
        )}
        
        {/* Decision Status */}
        {hasDecided && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-md">
            <CheckCircle size={14} />
            <span>You have already made your decision: {myMember.decision}</span>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onAddComment}
          disabled={isDisabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md'
          }`}
          title={isDisabled ? 'Cannot add comments at this time' : 'Add a comment to this proof'}
        >
          <MessageSquare size={18} />
          <span>Add Comment</span>
        </button>
        
        <button
          onClick={onApprove}
          disabled={isDisabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-50 text-green-600 hover:bg-green-100 hover:shadow-md'
          }`}
          title={isDisabled ? 'Cannot approve at this time' : 'Approve this proof'}
        >
          <CheckCircle size={18} />
          <span>Approve</span>
        </button>
        
        <button
          onClick={onReject}
          disabled={isDisabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md'
          }`}
          title={isDisabled ? 'Cannot reject at this time' : 'Reject this proof or request changes'}
        >
          <XCircle size={18} />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewerActionBar;

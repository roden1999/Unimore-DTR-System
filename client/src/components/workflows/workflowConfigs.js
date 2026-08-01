export const leaveConfig = {
    resource: 'leaves', title: 'Leave Request', subtitle: 'Submit and track employee leave requests. New requests enter the approval queue.',
    fields: [
        { name: 'EmployeeId', label: 'Employee', type: 'employee', required: true }, { name: 'LeaveType', label: 'Leave Type', type: 'select', options: ['Vacation', 'Sick', 'Emergency', 'Maternity', 'Paternity', 'Other'], required: true },
        { name: 'StartDate', label: 'Start Date', type: 'date', required: true }, { name: 'EndDate', label: 'End Date', type: 'date', required: true }, { name: 'Reason', label: 'Reason', type: 'multiline' },
    ], columns: [{ name: 'EmployeeName', label: 'Employee', width: 190 }, { name: 'LeaveType', label: 'Type' }, { name: 'StartDate', label: 'Start', type: 'date' }, { name: 'EndDate', label: 'End', type: 'date' }, { name: 'Status', label: 'Status', type: 'status' }],
};
export const overtimeConfig = {
    resource: 'overtime', title: 'Overtime Request', subtitle: 'Record overtime for review and approval.',
    fields: [{ name: 'EmployeeId', label: 'Employee', type: 'employee', required: true }, { name: 'WorkDate', label: 'Work Date', type: 'date', required: true }, { name: 'Hours', label: 'Hours', type: 'number', required: true }, { name: 'Reason', label: 'Reason', type: 'multiline' }],
    columns: [{ name: 'EmployeeName', label: 'Employee', width: 190 }, { name: 'WorkDate', label: 'Work Date', type: 'date' }, { name: 'Hours', label: 'Hours' }, { name: 'Reason', label: 'Reason', width: 220 }, { name: 'Status', label: 'Status', type: 'status' }],
};
export const workOrderConfig = {
    resource: 'work-orders', title: 'Work Order', subtitle: 'Plan repairs, assign ownership and follow completion.',
    fields: [{ name: 'WorkOrderNo', label: 'Work Order No.', required: true }, { name: 'AssetName', label: 'Machine / Asset', required: true }, { name: 'Description', label: 'Issue / Work Description', type: 'multiline' }, { name: 'Priority', label: 'Priority', type: 'select', options: ['Low', 'Normal', 'High', 'Critical'], defaultValue: 'Normal' }, { name: 'AssignedTo', label: 'Assigned To' }, { name: 'DueDate', label: 'Due Date', type: 'date' }, { name: 'Status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled'], defaultValue: 'Open' }],
    columns: [{ name: 'WorkOrderNo', label: 'WO No.' }, { name: 'AssetName', label: 'Asset', width: 180 }, { name: 'Priority', label: 'Priority' }, { name: 'AssignedTo', label: 'Assigned To' }, { name: 'DueDate', label: 'Due', type: 'date' }, { name: 'Status', label: 'Status', type: 'status' }],
};
export const pmConfig = {
    resource: 'preventive-maintenance', title: 'PM Schedule', subtitle: 'Schedule recurring maintenance and see upcoming service dates.',
    fields: [{ name: 'AssetName', label: 'Machine / Asset', required: true }, { name: 'TaskName', label: 'Maintenance Task', required: true }, { name: 'FrequencyDays', label: 'Frequency (days)', type: 'number', required: true }, { name: 'LastServiceDate', label: 'Last Service', type: 'date' }, { name: 'NextServiceDate', label: 'Next Service', type: 'date', required: true }, { name: 'AssignedTo', label: 'Assigned To' }, { name: 'Status', label: 'Status', type: 'select', options: ['Scheduled', 'Due', 'Overdue', 'Completed'], defaultValue: 'Scheduled' }],
    columns: [{ name: 'AssetName', label: 'Asset', width: 180 }, { name: 'TaskName', label: 'Task', width: 220 }, { name: 'FrequencyDays', label: 'Every (days)' }, { name: 'NextServiceDate', label: 'Next Service', type: 'date' }, { name: 'AssignedTo', label: 'Assigned To' }, { name: 'Status', label: 'Status', type: 'status' }],
};
export const traceabilityConfig = {
    resource: 'traceability', title: 'Traceability Batch', subtitle: 'Link incoming coil to skelp and the finished product for end-to-end material tracking.',
    fields: [{ name: 'BatchNo', label: 'Batch No.', required: true }, { name: 'CoilReference', label: 'Coil Reference' }, { name: 'SkelpReference', label: 'Skelp Reference' }, { name: 'FinishedProduct', label: 'Finished Product' }, { name: 'Quantity', label: 'Quantity', type: 'number' }, { name: 'ProductionDate', label: 'Production Date', type: 'date', required: true }, { name: 'Status', label: 'Status', type: 'select', options: ['In Process', 'Completed', 'On Hold', 'Cancelled'], defaultValue: 'In Process' }, { name: 'Notes', label: 'Notes', type: 'multiline' }],
    columns: [{ name: 'BatchNo', label: 'Batch' }, { name: 'CoilReference', label: 'Coil' }, { name: 'SkelpReference', label: 'Skelp' }, { name: 'FinishedProduct', label: 'Finished Product', width: 180 }, { name: 'Quantity', label: 'Qty' }, { name: 'ProductionDate', label: 'Date', type: 'date' }, { name: 'Status', label: 'Production', type: 'status' }, { name: 'QAStatus', label: 'QA Status', type: 'status' }],
};
export const payrollPeriodConfig = {
    resource: 'payroll-periods', title: 'Payroll Period', subtitle: 'Create payroll cutoffs and lock completed periods against accidental changes.',
    fields: [{ name: 'PeriodName', label: 'Period Name', required: true }, { name: 'StartDate', label: 'Start Date', type: 'date', required: true }, { name: 'EndDate', label: 'End Date', type: 'date', required: true }, { name: 'Status', label: 'Status', type: 'select', options: ['Draft', 'For Approval', 'Locked'], defaultValue: 'Draft' }, { name: 'Notes', label: 'Notes', type: 'multiline' }],
    columns: [{ name: 'PeriodName', label: 'Period', width: 180 }, { name: 'StartDate', label: 'Start', type: 'date' }, { name: 'EndDate', label: 'End', type: 'date' }, { name: 'Status', label: 'Status', type: 'status' }, { name: 'LockedAt', label: 'Locked At', type: 'date' }],
};

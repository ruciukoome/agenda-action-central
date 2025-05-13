
import { ActionItem } from "@/types/action";
import { toast } from "@/components/ui/use-toast";

export function useActionExport() {
  const exportToCSV = (actionsToExport: ActionItem[]) => {
    // Convert actions to CSV format
    const headers = "ID,Description,Department,Meeting Date,Priority,Owner Email,Completed,Progress Status,Notes,Created At,Due Date\n";
    const csvContent = actionsToExport.reduce((csv, action) => {
      return csv + `"${action.id}","${action.description.replace(/"/g, '""')}","${action.department}","${action.meetingDate}","${action.priority}","${action.ownerEmail}","${action.completed}","${action.progressStatus}","${action.notes?.replace(/"/g, '""') || ''}","${action.createdAt}","${action.dueDate || ''}"\n`;
    }, headers);
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `actions_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Actions exported", {
      description: `Successfully exported ${actionsToExport.length} action${actionsToExport.length > 1 ? 's' : ''} as CSV.`,
    });
  };

  const exportToExcel = (actionsToExport: ActionItem[]) => {
    // Generate an HTML table that Excel can open properly
    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Actions Export</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      </head>
      <body>
        <table>
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Department</th>
            <th>Meeting Date</th>
            <th>Priority</th>
            <th>Owner Email</th>
            <th>Completed</th>
            <th>Progress Status</th>
            <th>Notes</th>
            <th>Created At</th>
            <th>Due Date</th>
          </tr>
    `;
    
    // Add data rows
    actionsToExport.forEach(action => {
      excelContent += `
        <tr>
          <td>${action.id}</td>
          <td>${action.description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${action.department}</td>
          <td>${action.meetingDate}</td>
          <td>${action.priority}</td>
          <td>${action.ownerEmail}</td>
          <td>${action.completed ? 'Yes' : 'No'}</td>
          <td>${action.progressStatus}</td>
          <td>${action.notes?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || ''}</td>
          <td>${action.createdAt}</td>
          <td>${action.dueDate || ''}</td>
        </tr>
      `;
    });
    
    excelContent += `
        </table>
      </body>
      </html>
    `;
    
    // Create and download the Excel file
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `actions_export_${new Date().toISOString().slice(0,10)}.xls`); // Use .xls extension
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Actions exported", {
      description: `Successfully exported ${actionsToExport.length} action${actionsToExport.length > 1 ? 's' : ''} as Excel.`,
    });
  };
  
  const handleExport = (format: "csv" | "excel", actionsToExport: ActionItem[]) => {
    if (actionsToExport.length === 0) return;
    
    if (format === "csv") {
      exportToCSV(actionsToExport);
    } else {
      exportToExcel(actionsToExport);
    }
  };

  return { handleExport };
}

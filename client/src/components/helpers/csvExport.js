export const exportToCSV = (jobs) => {
  const csvData = jobs.map(job => ({
    Company: job.company,
    Position: job.position,
    Location: job.location,
    Salary: job.salary,
    Status: job.status,
    'Date Applied': job.dateApplied,
    'Job Type': job.jobType,
    'Experience Level': job.experienceLevel,
    'Work Arrangement': job.workArrangement,
    Priority: job.priority,
    URL: job.jobUrl,
    Notes: job.notes,
    Skills: Array.isArray(job.technicalDetails) ? job.technicalDetails.join('; ') : ''
  }));

  const headers = Object.keys(csvData[0]);
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `job_applications_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
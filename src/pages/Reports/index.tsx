import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportFilters, ReportTable, useReports, ReportType } from '@/components/reports';

export default function ReportsPage() {
  const {
    // State
    reportData,
    isLoading,
    error,
    activeTab,
    dateRange,
    filters,
    
    // Handlers
    setActiveTab,
    setDateRange,
    onFilterChange,
    onExport,
    refetch
  } = useReports('attendance');

  // Define report types for tabs
  const reportTypes: { id: ReportType; label: string }[] = [
    { id: 'attendance', label: 'Attendance' },
    { id: 'students', label: 'Students' },
    { id: 'employees', label: 'Employees' },
    { id: 'visitors', label: 'Visitors' },
    { id: 'incidents', label: 'Incidents' },
    { id: 'id-cards', label: 'ID Cards' },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">View and export system reports</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Report Dashboard</CardTitle>
              <CardDescription>
                Filter and export reports based on your criteria
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Report Filters */}
          <ReportFilters
            filters={filters}
            onFilterChange={onFilterChange}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onExport={onExport}
            isLoading={isLoading}
            hasData={reportData.length > 0}
          />

          {/* Tabs for different report types */}
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as ReportType)}
            className="w-full"
          >
            <TabsList className="w-full justify-start overflow-x-auto">
              {reportTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.id}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Tab Content */}
            <div className="mt-6">
              {reportTypes.map((type) => (
                <TabsContent key={type.id} value={type.id} className="space-y-4">
                  <ReportTable 
                    data={reportData} 
                    isLoading={isLoading} 
                    onRowClick={(id) => {
                      // Handle row click (e.g., navigate to details)
                      console.log(`View details for ${type.singular || type.id}:`, id);
                    }}
                  />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

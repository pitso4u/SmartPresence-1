import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ReportExportProps } from './ReportTypes';

export function ReportExport({ onExport, isLoading, disabled }: ReportExportProps) {
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      await onExport();
      toast({
        title: 'Export successful',
        description: 'The report has been exported to PDF.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error exporting the report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={disabled || isLoading}
      variant="outline"
      className="w-full md:w-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  );
}

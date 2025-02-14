import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  MetricsExportService,
  type ExportOptions,
  type ScheduledReportConfig 
} from "@/services/metrics/export-service";

// Initialize the service with the API URL from environment
const exportService = new MetricsExportService(
  process.env.NEXT_PUBLIC_API_URL || ""
);

interface UseMetricsExportProps {
  onSuccess?: (data: Blob) => void;
  onError?: (error: Error) => void;
}

export function useMetricsExport(props: UseMetricsExportProps = {}) {
  const { onSuccess, onError } = props;

  return useMutation<Blob, Error, ExportOptions>({
    mutationFn: async (options) => {
      const result = await exportService.exportData(options);
      return result;
    },
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });
}

interface UseScheduledReportsResult {
  reports: Array<{ id: string } & ScheduledReportConfig>;
  isLoading: boolean;
  error: Error | null;
  createReport: (config: ScheduledReportConfig) => Promise<void>;
  updateReport: (id: string, config: ScheduledReportConfig) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
}

export function useScheduledReports(): UseScheduledReportsResult {
  const queryClient = useQueryClient();

  // Query for fetching reports
  const {
    data: reports = [],
    isLoading,
    error,
  } = useQuery<Array<{ id: string } & ScheduledReportConfig>, Error>({
    queryKey: ["metrics", "reports"],
    queryFn: () => exportService.getScheduledReports(),
  });

  // Mutation for creating reports
  const createMutation = useMutation<{ id: string }, Error, ScheduledReportConfig>({
    mutationFn: exportService.createScheduledReport.bind(exportService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics", "reports"] });
    },
  });

  // Mutation for updating reports
  const updateMutation = useMutation<
    void,
    Error,
    { id: string; config: ScheduledReportConfig }
  >({
    mutationFn: (variables) =>
      exportService.updateScheduledReport(variables.id, variables.config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics", "reports"] });
    },
  });

  // Mutation for deleting reports
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: exportService.deleteScheduledReport.bind(exportService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics", "reports"] });
    },
  });

  return {
    reports,
    isLoading,
    error: error as Error | null,
    createReport: async (config: ScheduledReportConfig) => {
      await createMutation.mutateAsync(config);
    },
    updateReport: async (id: string, config: ScheduledReportConfig) => {
      await updateMutation.mutateAsync({ id, config });
    },
    deleteReport: async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
  };
}

// Helper function for downloading exported files
export function downloadMetricsFile(blob: Blob, format: "csv" | "json") {
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `metrics-export-${timestamp}.${format}`;
  MetricsExportService.downloadFile(blob, filename);
}

// Helper hook for downloading metrics data
export function useMetricsDownload() {
  const mutation = useMetricsExport();

  const downloadMetrics = async (options: ExportOptions) => {
    const blob = await mutation.mutateAsync(options);
    downloadMetricsFile(blob, options.format);
  };

  return {
    downloadMetrics,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
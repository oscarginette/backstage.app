/**
 * CsvDownloadHelper
 *
 * Browser-side utility for triggering CSV downloads.
 * Works with server-streamed data or client-generated data.
 */

export class CsvDownloadHelper {
  /**
   * Trigger browser download of CSV data
   */
  static download(csvData: string, filename: string): void {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Fetch CSV from API and trigger download
   */
  static async downloadFromApi(
    apiUrl: string,
    filename: string
  ): Promise<void> {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Export failed: ${response.statusText}`
      );
    }

    const csvData = await response.text();
    this.download(csvData, filename);
  }
}

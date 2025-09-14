interface GoogleSheetsData {
  values: string[][];
}

export class GoogleSheetsService {
  private apiKey: string = '';
  private sheetId: string = '';

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    const savedSheetId = localStorage.getItem('googleSheetId');
    const savedApiKey = localStorage.getItem('googleSheetsApiKey');
    
    if (savedSheetId) {
      this.sheetId = savedSheetId;
    }
    if (savedApiKey) {
      this.apiKey = savedApiKey;
    }
  }

  setCredentials(sheetId: string, apiKey?: string) {
    this.sheetId = sheetId;
    if (apiKey) {
      this.apiKey = apiKey;
      localStorage.setItem('googleSheetsApiKey', apiKey);
    }
    localStorage.setItem('googleSheetId', sheetId);
  }

  isConfigured(): boolean {
    return !!(this.sheetId && this.apiKey);
  }

  private async fetchSheetData(sheetName: string): Promise<string[][]> {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets not configured');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${sheetName}?key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
      }
      
      const data: GoogleSheetsData = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  async getDoctors() {
    const data = await this.fetchSheetData('doctors'); // ใช้ตัวเล็กตามที่มีใน Sheet
    if (data.length === 0) return [];
    
    const [headers, ...rows] = data;
    return rows.map((row, index) => ({
      id: (index + 1).toString(),
      name: row[0] || '',
      specialty: row[1] || '',
      department: row[2] || '',
      avatar_url: row[3] || '',
      created_at: row[4] || new Date().toISOString(),
      updated_at: row[5] || new Date().toISOString()
    }));
  }

  async getMonthlyData() {
    const data = await this.fetchSheetData('doctor_monthly_data'); // ใช้ชื่อแท็บที่ถูกต้อง
    if (data.length === 0) return [];
    
    const [headers, ...rows] = data;
    return rows.map(row => ({
      id: row[0] || '',
      doctor_id: row[1] || '',
      month: row[2] || '',
      year: parseInt(row[3]) || new Date().getFullYear(),
      total_patient: parseInt(row[4]) || 0,
      total_lab: parseInt(row[5]) || 0,
      lp_ratio: parseFloat(row[6]) || 0,
      rlu_score: parseFloat(row[7]) || 0,
      cpg_mismatch_percentage: parseFloat(row[8]) || 0,
      duplicate_order_rate: parseFloat(row[9]) || 0,
      estimated_cost: parseFloat(row[10]) || 0,
      cost_savings: parseFloat(row[11]) || 0,
      cp_ratio: parseFloat(row[12]) || 0,
      test_reduction: parseFloat(row[13]) || 0,
      patients_count: parseInt(row[14]) || 0,
      total_tests: parseInt(row[15]) || 0,
      duplicate_tests: parseInt(row[16]) || 0,
      cpg_mismatch: parseInt(row[17]) || 0
    }));
  }

  async getMismatchData() {
    const data = await this.fetchSheetData('mismatch_data'); // ใช้ชื่อแท็บที่ถูกต้อง
    if (data.length === 0) return [];
    
    const [headers, ...rows] = data;
    return rows.map(row => ({
      id: row[0] || '',
      doctor_id: row[1] || '',
      patient_id: row[2] || '',
      original_cpt: row[3] || '',
      suggested_cpt: row[4] || '',
      month: row[5] || '',
      year: parseInt(row[6]) || new Date().getFullYear(),
      status: row[7] || 'pending'
    }));
  }

  async getMismatchAnalysis() {
    const data = await this.fetchSheetData('mismatch_analysis'); // ใช้ชื่อแท็บที่ถูกต้อง
    if (data.length === 0) return [];
    
    const [headers, ...rows] = data;
    return rows.map(row => ({
      id: row[0] || '',
      doctor_id: row[1] || '',
      total_mismatches: parseInt(row[2]) || 0,
      month: row[3] || '',
      year: parseInt(row[4]) || new Date().getFullYear(),
      improvement_suggestions: row[5] || ''
    }));
  }

  async getSheetData(sheetName: string) {
    return await this.fetchSheetData(sheetName);
  }

  // Methods to add data to sheets would require Google Sheets API write permissions
  // For now, we'll focus on reading data
  async addDataToSheet(sheetName: string, data: any[]) {
    console.log('Adding data to sheet (not implemented for read-only access):', sheetName, data);
    // This would require Google Apps Script or OAuth for write access
    throw new Error('Write operations require additional Google Sheets API setup');
  }
}

export const googleSheetsService = new GoogleSheetsService();
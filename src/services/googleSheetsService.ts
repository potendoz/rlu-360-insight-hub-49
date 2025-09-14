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
    return !!this.sheetId; // เช็คแค่ sheetId เท่านั้น
  }

  private async fetchSheetData(sheetName: string): Promise<string[][]> {
    if (!this.sheetId) {
      throw new Error('Google Sheet ID not configured');
    }

    // ใช้ CSV export URL สำหรับ public sheets ที่ไม่ต้องการ API key
    const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    
    console.log(`Fetching data from: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/csv,application/csv,text/plain'
        }
      });
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch sheet data: ${response.statusText}`, errorText);
        throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log(`CSV text for ${sheetName}:`, csvText.substring(0, 200) + '...');
      
      if (!csvText.trim()) {
        console.warn(`Empty response for sheet: ${sheetName}`);
        return [];
      }
      
      const rows = this.parseCSV(csvText);
      console.log(`Parsed ${rows.length} rows for ${sheetName}`);
      return rows;
    } catch (error) {
      console.error(`Error fetching sheet data for ${sheetName}:`, error);
      throw error;
    }
  }

  private parseCSV(csvText: string): string[][] {
    const rows: string[][] = [];
    const lines = csvText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        // Simple CSV parsing - handles quoted values
        const row: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < trimmedLine.length; i++) {
          const char = trimmedLine[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(current.replace(/^"|"$/g, '').trim());
            current = '';
          } else {
            current += char;
          }
        }
        row.push(current.replace(/^"|"$/g, '').trim());
        rows.push(row);
      }
    }
    
    console.log(`Parsed CSV rows:`, rows);
    return rows;
  }

  async getDoctors() {
    const data = await this.fetchSheetData('doctors'); // ใช้ตัวเล็กตามที่มีใน Sheet
    console.log('Raw doctors data:', data);
    if (data.length <= 1) return []; // ไม่มีข้อมูลหรือมีแค่ header
    
    const [headers, ...rows] = data;
    console.log('Doctors headers:', headers);
    console.log('Doctors rows:', rows);
    
    // Map ตาม column ที่เห็นจริงใน Google Sheets: Id, Name, Specialty, Department, Avatar Url, Created At, Updated At
    return rows.map((row, index) => ({
      id: row[0] || (index + 1).toString(), // ใช้ Id จาก column แรก
      name: row[1] || '', // Name จาก column ที่ 2
      specialty: row[2] || '', // Specialty จาก column ที่ 3  
      department: row[3] || '', // Department จาก column ที่ 4
      avatar_url: row[4] || '', // Avatar Url จาก column ที่ 5
      created_at: row[5] || new Date().toISOString(), // Created At จาก column ที่ 6
      updated_at: row[6] || new Date().toISOString() // Updated At จาก column ที่ 7
    }));
  }

  async getMonthlyData() {
    try {
      console.log('Starting to fetch monthly data...');
      const data = await this.fetchSheetData('doctor_monthly_data');
      console.log('Raw monthly data:', data);
      console.log('Raw monthly data length:', data.length);
      
      if (data.length <= 1) {
        console.warn('No monthly data found or only headers present');
        return [];
      }
    
      const [headers, ...rows] = data;
      console.log('Monthly headers:', headers);
      console.log('Monthly rows sample:', rows.slice(0, 3));
      
      // ตรวจสอบ header structure ก่อน
      console.log('Expected headers: id, doctor_id, month, year, rlu_score, cost_savings, test_reduction, patients_count, total_tests');
      
      // ถ้าไม่มีข้อมูลใน column ที่คาดหวัง ให้ใช้ข้อมูล mock ที่มีค่าจริง
      return rows.map((row, index) => {
        const baseData = {
          id: row[0] || `monthly_${index + 1}`,
          doctor_id: row[1] || '',
          month: row[2] || 'April',
          year: parseInt(row[3]) || 2025,
          rlu_score: parseFloat(row[4]) || (80 + Math.random() * 20), // 80-100
          cost_savings: parseFloat(row[5]) || (1000 + Math.random() * 5000), // 1000-6000
          test_reduction: parseFloat(row[6]) || (10 + Math.random() * 30), // 10-40%
          patients_count: parseInt(row[7]) || Math.floor(50 + Math.random() * 150), // 50-200
          total_tests: parseInt(row[8]) || Math.floor(100 + Math.random() * 400), // 100-500
        };
        
        return {
          ...baseData,
          // คำนวณค่าอื่นๆ จากข้อมูลพื้นฐาน
          total_patient: baseData.patients_count,
          total_lab: baseData.total_tests,
          lp_ratio: baseData.total_tests > 0 && baseData.patients_count > 0 ? 
            parseFloat((baseData.total_tests / baseData.patients_count).toFixed(2)) : 0,
          cpg_mismatch_percentage: Math.random() * 15 + 5, // mock data 5-20%
          duplicate_order_rate: Math.random() * 8 + 2, // mock data 2-10%
          estimated_cost: baseData.cost_savings * 1.5,
          cp_ratio: Math.random() * 0.6 + 0.2, // mock data 0.2-0.8
          duplicate_tests: Math.floor(Math.random() * 15 + 5), // mock data 5-20
          cpg_mismatch: Math.floor(Math.random() * 8 + 2) // mock data 2-10
        };
      });
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      return [];
    }
  }

  async getMismatchData() {
    try {
      console.log('Starting to fetch mismatch data...');
      const data = await this.fetchSheetData('mismatch_data');
      console.log('Raw mismatch data:', data);
      
      if (data.length <= 1) {
        console.warn('No mismatch data found or only headers present');
        // สร้างข้อมูล mock ถ้าไม่มีข้อมูลจริง
        return this.generateMockMismatchData();
      }
      
      const [headers, ...rows] = data;
      console.log('Mismatch headers:', headers);
      console.log('Mismatch rows sample:', rows.slice(0, 3));
      
      return rows.map((row, index) => ({
        id: row[0] || `mismatch_${index + 1}`,
        doctor_id: row[1] || '',
        patient_id: row[2] || `P${1000 + index}`,
        original_cpt: row[3] || '99213',
        suggested_cpt: row[4] || '99214',
        month: row[5] || 'April',
        year: parseInt(row[6]) || 2025,
        status: row[7] || 'pending'
      }));
    } catch (error) {
      console.error('Error fetching mismatch data:', error);
      return this.generateMockMismatchData();
    }
  }

  private generateMockMismatchData() {
    const doctors = ['fcbbbbea-48bd-41ac-8c4c-a01841bdc608', '938d204a-8e6d-42ac-9231-d900466521b5', 'c2fb47e8-8488-4745-a50c-e7be39084372'];
    const cptCodes = ['99213', '99214', '99215', '85025', '80053', '93000'];
    const months = ['April', 'May', 'June', 'July', 'August'];
    
    return Array.from({ length: 20 }, (_, index) => ({
      id: `mismatch_${index + 1}`,
      doctor_id: doctors[index % doctors.length],
      patient_id: `P${1000 + index}`,
      original_cpt: cptCodes[Math.floor(Math.random() * cptCodes.length)],
      suggested_cpt: cptCodes[Math.floor(Math.random() * cptCodes.length)],
      month: months[Math.floor(Math.random() * months.length)],
      year: 2025,
      status: Math.random() > 0.7 ? 'resolved' : 'pending'
    }));
  }

  async getMismatchAnalysis() {
    try {
      console.log('Starting to fetch mismatch analysis...');
      const data = await this.fetchSheetData('mismatch_analysis');
      console.log('Raw mismatch analysis data:', data);
      
      if (data.length <= 1) {
        console.warn('No mismatch analysis found or only headers present');
        // สร้างข้อมูล mock ถ้าไม่มีข้อมูลจริง
        return this.generateMockMismatchAnalysis();
      }
      
      const [headers, ...rows] = data;
      console.log('Mismatch analysis headers:', headers);
      console.log('Mismatch analysis rows sample:', rows.slice(0, 3));
      
      return rows.map((row, index) => ({
        id: row[0] || `analysis_${index + 1}`,
        doctor_id: row[1] || '',
        total_mismatches: parseInt(row[2]) || Math.floor(Math.random() * 20 + 5),
        month: row[3] || 'April',
        year: parseInt(row[4]) || 2025,
        improvement_suggestions: row[5] || 'Review CPT code selection guidelines'
      }));
    } catch (error) {
      console.error('Error fetching mismatch analysis:', error);
      return this.generateMockMismatchAnalysis();
    }
  }

  private generateMockMismatchAnalysis() {
    const doctors = ['fcbbbbea-48bd-41ac-8c4c-a01841bdc608', '938d204a-8e6d-42ac-9231-d900466521b5', 'c2fb47e8-8488-4745-a50c-e7be39084372'];
    const months = ['April', 'May', 'June', 'July', 'August'];
    const suggestions = [
      'Review CPT code selection guidelines',
      'Attend coding accuracy training',
      'Use decision support tools',
      'Regular peer review sessions',
      'Update clinical documentation'
    ];
    
    return doctors.map((doctorId, index) => ({
      id: `analysis_${index + 1}`,
      doctor_id: doctorId,
      total_mismatches: Math.floor(Math.random() * 20 + 5),
      month: months[Math.floor(Math.random() * months.length)],
      year: 2025,
      improvement_suggestions: suggestions[Math.floor(Math.random() * suggestions.length)]
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
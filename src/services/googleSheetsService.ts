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
      
      if (data.length <= 1) {
        console.warn('No monthly data found or only headers present');
        return [];
      }
    
      const [headers, ...rows] = data;
      console.log('Monthly headers:', headers);
      console.log('Monthly rows sample:', rows.slice(0, 3));
      
      // Map ตาม column structure จริงใน Google Sheets ตามที่เห็นใน network requests
      // "id","doctor_id","month","year","rlu_score","total_patient","total_lab","lp_ratio","cpg_mismatch_percentage","duplicate_order_rate","estimated_cost","cp_ratio"
      return rows.map(row => ({
        id: row[0] || '',
        doctor_id: row[1] || '',
        month: row[2] || '',
        year: parseInt(row[3]) || new Date().getFullYear(),
        rlu_score: parseFloat(row[4]) || 0,
        total_patient: parseInt(row[5]) || 0,
        total_lab: parseInt(row[6]) || 0,
        lp_ratio: parseFloat(row[7]) || 0,
        cpg_mismatch_percentage: parseFloat(row[8]) || 0,
        duplicate_order_rate: parseFloat(row[9]) || 0,
        estimated_cost: parseFloat(row[10]) || 0,
        cp_ratio: parseFloat(row[11]) || 0
      }));
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
        return [];
      }
      
      const [headers, ...rows] = data;
      console.log('Mismatch headers:', headers);
      console.log('Mismatch rows sample:', rows.slice(0, 3));
      
      // Map ตาม column structure จริงใน Google Sheets
      // "id","doctor_id","month","year","total_mismatch","fbs_mismatch","hba1c_mismatch","ft3_mismatch","ft4_mismatch","aptt_mismatch","lft_mismatch","lipid_profile_mismatch","created_at","updated_at"
      return rows.map(row => ({
        id: row[0] || '',
        doctor_id: row[1] || '',
        month: row[2] || '',
        year: parseInt(row[3]) || new Date().getFullYear(),
        total_mismatch: parseFloat(row[4]) || 0,
        fbs_mismatch: parseFloat(row[5]) || 0,
        hba1c_mismatch: parseFloat(row[6]) || 0,
        ft3_mismatch: parseFloat(row[7]) || 0,
        ft4_mismatch: parseFloat(row[8]) || 0,
        aptt_mismatch: parseFloat(row[9]) || 0,
        lft_mismatch: parseFloat(row[10]) || 0,
        lipid_profile_mismatch: parseFloat(row[11]) || 0,
        created_at: row[12] || new Date().toISOString(),
        updated_at: row[13] || new Date().toISOString(),
        // เพิ่มข้อมูลเดิมสำหรับ backward compatibility
        patient_id: `P${Math.floor(Math.random() * 1000) + 1000}`,
        original_cpt: '99213',
        suggested_cpt: '99214',
        status: 'pending'
      }));
    } catch (error) {
      console.error('Error fetching mismatch data:', error);
      return [];
    }
  }

  async getMismatchAnalysis() {
    try {
      console.log('Starting to fetch mismatch analysis...');
      const data = await this.fetchSheetData('mismatch_analysis');
      console.log('Raw mismatch analysis data:', data);
      
      if (data.length <= 1) {
        console.warn('No mismatch analysis found or only headers present');
        return [];
      }
      
      const [headers, ...rows] = data;
      console.log('Mismatch analysis headers:', headers);
      console.log('Mismatch analysis rows sample:', rows.slice(0, 3));
      
      // Map ตาม column structure จริงใน Google Sheets
      // "id","doctor_id","month","year","fbs_top_mismatch","fbs_count","fbs_breakdown","hba1c_top_mismatch","hba1c_count","hba1c_breakdown","ft3_top_mismatch","ft3_count","ft3_breakdown","ft4_top_mismatch","ft4_count","ft4_breakdown","aptt_top_mismatch","aptt_count","aptt_breakdown","lft_top_mismatch","lft_count","lft_breakdown","lipid_profile_top_mismatch","lipid_profile_count","lipid_profile_breakdown","created_at","updated_at"
      return rows.map(row => ({
        id: row[0] || '',
        doctor_id: row[1] || '',
        month: row[2] || '',
        year: parseInt(row[3]) || new Date().getFullYear(),
        fbs_top_mismatch: row[4] || '',
        fbs_count: parseInt(row[5]) || 0,
        fbs_breakdown: row[6] || '',
        hba1c_top_mismatch: row[7] || '',
        hba1c_count: parseInt(row[8]) || 0,
        hba1c_breakdown: row[9] || '',
        ft3_top_mismatch: row[10] || '',
        ft3_count: parseInt(row[11]) || 0,
        ft3_breakdown: row[12] || '',
        ft4_top_mismatch: row[13] || '',
        ft4_count: parseInt(row[14]) || 0,
        ft4_breakdown: row[15] || '',
        aptt_top_mismatch: row[16] || '',
        aptt_count: parseInt(row[17]) || 0,
        aptt_breakdown: row[18] || '',
        lft_top_mismatch: row[19] || '',
        lft_count: parseInt(row[20]) || 0,
        lft_breakdown: row[21] || '',
        lipid_profile_top_mismatch: row[22] || '',
        lipid_profile_count: parseInt(row[23]) || 0,
        lipid_profile_breakdown: row[24] || '',
        created_at: row[25] || new Date().toISOString(),
        updated_at: row[26] || new Date().toISOString(),
        // เพิ่มข้อมูลเดิมสำหรับ backward compatibility
        total_mismatches: parseInt(row[5]) + parseInt(row[8]) + parseInt(row[11]) + parseInt(row[14]) + parseInt(row[17]) + parseInt(row[20]) + parseInt(row[23]) || 0,
        improvement_suggestions: 'Review CPT code selection guidelines based on mismatch analysis'
      }));
    } catch (error) {
      console.error('Error fetching mismatch analysis:', error);
      return [];
    }
  }

  async getSheetData(sheetName: string) {
    return await this.fetchSheetData(sheetName);
  }

  async getUsers() {
    try {
      console.log('Fetching users from Google Sheet...');
      const data = await this.fetchSheetData('users');
      console.log('Raw users data:', data);
      
      if (data.length <= 1) {
        console.warn('No users data found or only headers present');
        return [];
      }
      
      const [headers, ...rows] = data;
      console.log('Users headers:', headers);
      console.log('Users data rows count:', rows.length);
      console.log('First user row:', rows[0]);
      
      // Map ตาม column structure: Email, Name, Role, Department, Status, Last Login, Avatar Url, Created At, Updated At, Password, Google Sheet ID
      // ข้าม header row ที่ index 0
      const users = rows
        .filter(row => row[1] && row[1].toLowerCase() !== 'email') // กรอง header row ที่อาจซ้ำ และ row ว่าง
        .map(row => {
          const user = {
            email: (row[1] || '').trim(),
            name: (row[2] || '').trim(),
            role: (row[3] || '').trim(),
            department: (row[4] || '').trim(),
            status: (row[5] || '').trim(),
            last_login: (row[6] || '').trim(),
            avatar_url: (row[7] || '').trim(),
            created_at: (row[8] || '').trim(),
            updated_at: (row[9] || '').trim(),
            password: (row[10] || '').trim(),
            google_sheet_id: (row[11] || '').trim()
          };
          console.log('Mapped user:', user.email, user.role, user.status);
          return user;
        });
      
      console.log('Total users mapped:', users.length);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUserSheetId(email: string): Promise<string | null> {
    try {
      console.log(`Looking up Google Sheet ID for email: ${email}`);
      const users = await this.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user?.google_sheet_id) {
        console.log(`Found Google Sheet ID: ${user.google_sheet_id} for ${email}`);
        return user.google_sheet_id;
      }
      
      console.warn(`No Google Sheet ID found for email: ${email}`);
      return null;
    } catch (error) {
      console.error('Error getting user sheet ID:', error);
      return null;
    }
  }

  async getAccessLogs() {
    try {
      console.log('Fetching access logs from Google Sheet...');
      const data = await this.fetchSheetData('access_logs');
      console.log('Raw access logs data:', data);
      
      if (data.length <= 1) {
        console.warn('No access logs data found or only headers present');
        return [];
      }
      
      const [headers, ...rows] = data;
      console.log('Access logs headers:', headers);
      console.log('Access logs data rows count:', rows.length);
      
      // Map ตาม column structure: id, user_id, user_name, user_email, user_role, user_avatar, action, timestamp, ip_address, device, browser, location, status
      const logs = rows
        .filter(row => row[0]) // กรอง row ว่าง
        .map(row => ({
          id: (row[0] || '').trim(),
          user_id: (row[1] || '').trim(),
          user_name: (row[2] || '').trim(),
          user_email: (row[3] || '').trim(),
          user_role: (row[4] || '').trim(),
          user_avatar: (row[5] || '').trim(),
          action: (row[6] || '').trim(),
          timestamp: (row[7] || new Date().toISOString()).trim(),
          ip_address: (row[8] || '').trim(),
          device: (row[9] || '').trim(),
          browser: (row[10] || '').trim(),
          location: (row[11] || '').trim(),
          status: (row[12] || 'success').trim()
        }));
      
      console.log('Total access logs mapped:', logs.length);
      return logs;
    } catch (error) {
      console.error('Error fetching access logs:', error);
      return [];
    }
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
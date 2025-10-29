import { useState, useEffect } from "react";
import { 
  Users, 
  Settings, 
  Database, 
  Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Save,
  X,
  Info,
  LogIn,
  LogOut,
  UserCheck,
  MapPin,
  Monitor,
  Smartphone,
  Globe,
  Filter,
  Search,
  Calendar,
  TrendingUp
} from "lucide-react";
import { googleSheetsService } from "@/services/googleSheetsService";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getSystemStats = (users: User[]) => {
  const totalUsers = users.length;
  const totalAdmin = users.filter(user => user.role === 'admin').length;
  const totalLab = users.filter(user => user.role === 'lab_manager').length;
  const totalDoctor = users.filter(user => user.role === 'physician').length;

  return [
    {
      title: "Total Users",
      value: totalUsers.toString(),
      change: `${totalUsers} users`,
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Total Admin",
      value: totalAdmin.toString(),
      change: `${totalAdmin} admins`,
      icon: Shield,
      color: "text-destructive"
    },
    {
      title: "Total Lab",
      value: totalLab.toString(),
      change: `${totalLab} lab managers`,
      icon: Activity,
      color: "text-secondary"
    },
    {
      title: "Total Doctor",
      value: totalDoctor.toString(),
      change: `${totalDoctor} doctors`,
      icon: Users,
      color: "text-primary"
    }
  ];
};

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  status: string;
  last_login: string | null;
  avatar_url: string | null;
  password: string | null;
  created_at: string;
}

interface RolePermission {
  id: string;
  role: string;
  route: string;
  can_access: boolean;
}

const defaultPasswords = {
  'admin@rlu360.com': 'rlu360admin',
  'physician@rlu360.com': 'rlu360doctor',
  'labmanager@rlu360.com': 'rlu360lab',
  'judge@rlu360.com': 'rlu360demo'
};


const getActionIcon = (action: string) => {
  switch (action) {
    case 'login':
      return <LogIn className="h-4 w-4" />;
    case 'logout':
      return <LogOut className="h-4 w-4" />;
    case 'view_dashboard':
      return <Activity className="h-4 w-4" />;
    case 'export_data':
      return <Download className="h-4 w-4" />;
    case 'edit_profile':
      return <Edit className="h-4 w-4" />;
    case 'view_report':
      return <Eye className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    'login': 'เข้าสู่ระบบ',
    'logout': 'ออกจากระบบ',
    'view_dashboard': 'เปิดดูแดชบอร์ด',
    'export_data': 'ส่งออกข้อมูล',
    'edit_profile': 'แก้ไขโปรไฟล์',
    'view_report': 'เปิดดูรายงาน'
  };
  return labels[action] || action;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-success text-success-foreground";
    case "inactive":
      return "bg-muted text-muted-foreground";
    case "pending":
      return "bg-warning text-warning-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-destructive text-destructive-foreground";
    case "physician":
      return "bg-primary text-primary-foreground";
    case "lab_manager":
      return "bg-secondary text-secondary-foreground";
    case "judge":
      return "bg-accent text-accent-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case "admin":
      return "ผู้ดูแลระบบ";
    case "physician":
      return "แพทย์";
    case "lab_manager":
      return "หัวหน้าแลป";
    case "judge":
      return "กรรมการตรวจประเมิน";
    default:
      return role;
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "info":
      return <Activity className="h-4 w-4 text-primary" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

export const Admin = () => {
  const [selectedTab, setSelectedTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
    department: '',
    status: 'active',
    password: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchRolePermissions();
    fetchAccessLogs();
  }, []);

  useEffect(() => {
    let filtered = [...accessLogs];
    
    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filterStatus);
    }
    
    setFilteredLogs(filtered);
  }, [searchQuery, filterAction, filterStatus, accessLogs]);

  const fetchUsers = async () => {
    const sheetId = localStorage.getItem('googleSheetId');
    if (!sheetId) {
      toast({
        title: "ไม่พบการเชื่อมต่อ",
        description: "กรุณาเชื่อมต่อ Google Sheet ID ที่หน้า Data Input",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await googleSheetsService.getUsers();
      const formattedUsers = data.map((user: any, index: number) => ({
        id: (index + 1).toString(),
        email: user.email || '',
        name: user.name || '',
        role: user.role || '',
        department: user.department || null,
        status: user.status || 'active',
        last_login: user.last_login || null,
        avatar_url: user.avatar_url || null,
        password: user.password || null,
        created_at: user.created_at || new Date().toISOString()
      }));
      setUsers(formattedUsers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async () => {
    setPermissionsLoading(false);
    setRolePermissions([]);
  };

  const fetchAccessLogs = async () => {
    const sheetId = localStorage.getItem('googleSheetId');
    if (!sheetId) {
      return;
    }

    setLoading(true);
    try {
      const logs = await googleSheetsService.getAccessLogs();
      // Sort by timestamp descending (newest first)
      const sortedLogs = logs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setAccessLogs(sortedLogs);
      setFilteredLogs(sortedLogs);
    } catch (error: any) {
      console.error('Error fetching access logs:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูล Access Logs ได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      name: '',
      role: '',
      department: '',
      status: 'active',
      password: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department || '',
      status: user.status,
      password: user.password || ''
    });
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    toast({
      title: "ไม่รองรับ",
      description: "การลบข้อมูลต้องทำผ่าน Google Sheet โดยตรง",
      variant: "destructive",
    });
  };

  const handleSaveUser = async () => {
    toast({
      title: "ไม่รองรับ",
      description: "การเพิ่มหรือแก้ไขข้อมูลต้องทำผ่าน Google Sheet โดยตรง",
      variant: "destructive",
    });
    setIsDialogOpen(false);
  };

  const isConnected = !!localStorage.getItem('googleSheetId');

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertTriangle className="h-16 w-16 text-warning mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">ไม่พบการเชื่อมต่อ Google Sheet</h2>
          <p className="text-muted-foreground mb-4">
            กรุณาเชื่อมต่อ Google Sheet ID ที่หน้า Data Input ก่อนดูข้อมูลผู้ใช้งาน
          </p>
          <Button onClick={() => window.location.href = '/data-input'}>
            ไปที่หน้า Data Input
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Administration</h1>
          <p className="text-muted-foreground">จัดการผู้ใช้งานจาก Google Sheets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" onClick={handleAddUser}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : 'Add New User'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Full Name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                    <SelectItem value="physician">แพทย์</SelectItem>
                    <SelectItem value="lab_manager">หัวหน้าแลป</SelectItem>
                    <SelectItem value="judge">กรรมการตรวจประเมิน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="Department"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingUser && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Note:</p>
                  <p className="text-sm text-muted-foreground">
                    Please set a secure password for the new user.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveUser}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {getSystemStats(users).map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-success">{stat.change} from last week</p>
              </div>
              <div className={`p-3 rounded-lg bg-primary/10`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tab Navigation */}
      <Card className="p-1">
        <div className="flex gap-1">
          <Button
            variant={selectedTab === "users" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab("users")}
          >
            <Users className="h-4 w-4 mr-2" />
            User Management
          </Button>
          <Button
            variant={selectedTab === "system" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab("system")}
          >
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </Button>
          <Button
            variant={selectedTab === "database" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab("database")}
          >
            <Database className="h-4 w-4 mr-2" />
            Database
          </Button>
          <Button
            variant={selectedTab === "security" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab("security")}
          >
            <Shield className="h-4 w-4 mr-2" />
            Security
          </Button>
        </div>
      </Card>

      {/* Tab Content */}
      {selectedTab === "users" && (
        <div className="space-y-6">
          {/* User Management */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">User Management</h2>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Users
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || ''} alt={user.name} />
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              Password: {user.password ? '••••••••' : 'Not set'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {selectedTab === "system" && (
        <div className="space-y-6">
          {/* Access Logs Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Activities</p>
                  <p className="text-3xl font-bold text-primary">{accessLogs.length}</p>
                  <p className="text-xs text-success mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12% from last week
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Successful Logins</p>
                  <p className="text-3xl font-bold text-success">
                    {accessLogs.filter(log => log.status === 'success' && log.action === 'login').length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Last 48 hours</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10">
                  <UserCheck className="h-8 w-8 text-success" />
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Failed Attempts</p>
                  <p className="text-3xl font-bold text-warning">
                    {accessLogs.filter(log => log.status === 'failed').length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                  <p className="text-3xl font-bold text-secondary">
                    {new Set(accessLogs.map(log => log.user_id)).size}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Unique users</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/10">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
              </div>
            </Card>
          </div>

          {/* Access Logs Main Card */}
          <Card className="p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    Access Logs & Activity Monitor
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Real-time tracking of all system activities and user actions
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="md:col-span-2">
                  <Label className="text-xs font-medium mb-2 block">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาชื่อผู้ใช้, อีเมล, หรือการกระทำ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium mb-2 block">Action Type</Label>
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="login">เข้าสู่ระบบ</SelectItem>
                      <SelectItem value="logout">ออกจากระบบ</SelectItem>
                      <SelectItem value="view_dashboard">เปิดดูแดชบอร์ด</SelectItem>
                      <SelectItem value="export_data">ส่งออกข้อมูล</SelectItem>
                      <SelectItem value="edit_profile">แก้ไขโปรไฟล์</SelectItem>
                      <SelectItem value="view_report">เปิดดูรายงาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs font-medium mb-2 block">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredLogs.length}</span> of <span className="font-semibold text-foreground">{accessLogs.length}</span> activities
                </p>
              </div>

              {/* Logs List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">ไม่พบบันทึกที่ตรงกับเงื่อนไขการค้นหา</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <Card key={log.id} className={`p-4 transition-all hover:shadow-md border-l-4 ${
                      log.status === 'success' ? 'border-l-success' : 'border-l-warning'
                    }`}>
                      <div className="flex items-start gap-4">
                        {/* User Avatar */}
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarImage src={log.user_avatar || ''} alt={log.user_name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {log.user_name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-foreground">{log.user_name}</p>
                                <Badge className={getRoleColor(log.user_role)} variant="secondary">
                                  {getRoleDisplayName(log.user_role)}
                                </Badge>
                                <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                                  {log.status === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{log.user_email}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Clock className="h-3 w-3" />
                                {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleDateString('th-TH', { 
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Action */}
                          <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-md">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                              {getActionIcon(log.action)}
                            </div>
                            <span className="font-medium text-sm text-foreground">
                              {getActionLabel(log.action)}
                            </span>
                          </div>

                          {/* Additional Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground truncate">{log.ip_address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground truncate">{log.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {log.device.includes('Mobile') || log.device.includes('Tablet') ? (
                                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className="text-muted-foreground truncate">{log.device}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground truncate">{log.browser}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedTab === "database" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Database Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-foreground">Total Records</p>
                <p className="text-2xl font-bold text-primary">1,247,589</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Activity className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="font-semibold text-foreground">Database Size</p>
                <p className="text-2xl font-bold text-success">2.4 GB</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="font-semibold text-foreground">Last Backup</p>
                <p className="text-2xl font-bold text-success">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Backup Now
              </Button>
              <Button variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Optimize
              </Button>
            </div>
          </Card>
        </div>
      )}

      {selectedTab === "security" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Security Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Require 2FA for all admin users</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Auto logout after 30 minutes of inactivity</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Login Monitoring</p>
                  <p className="text-sm text-muted-foreground">Monitor and log all login attempts</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Access Logs</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">Dr. Priya Sharma logged in</span>
                <span className="text-sm text-muted-foreground">2:45 PM</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">Admin User exported user data</span>
                <span className="text-sm text-muted-foreground">1:30 PM</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">Failed login attempt from 192.168.1.100</span>
                <span className="text-sm text-muted-foreground">12:15 PM</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
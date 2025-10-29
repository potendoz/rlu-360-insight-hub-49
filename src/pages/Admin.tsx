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
  Info
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

const systemAlerts = [
  {
    id: 1,
    type: "warning",
    title: "High Server Load",
    description: "Database server experiencing high load (85%)",
    timestamp: "2 hours ago"
  },
  {
    id: 2,
    type: "info",
    title: "Scheduled Maintenance",
    description: "System maintenance scheduled for tonight 2:00 AM - 4:00 AM",
    timestamp: "4 hours ago"
  },
  {
    id: 3,
    type: "success",
    title: "Backup Completed",
    description: "Daily backup completed successfully",
    timestamp: "6 hours ago"
  }
];

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
  }, []);

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
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
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">Role Permissions Status</h2>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">สิทธิ์การเข้าถึงถูกจัดการผ่าน Supabase</p>
                  <p className="text-sm text-blue-700 mt-1">
                    หน้านี้แสดงสถานะสิทธิ์เท่านั้น หากต้องการแก้ไขสิทธิ์ กรุณาแก้ไขที่ตาราง role_permissions ใน Supabase โดยตรง
                  </p>
                </div>
              </div>
            </div>

            {permissionsLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading permissions...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {['admin', 'physician', 'lab_manager', 'judge'].map((role) => (
                  <div key={role} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className={getRoleColor(role)}>
                        {getRoleDisplayName(role)}
                      </Badge>
                      <h3 className="text-lg font-medium text-foreground">
                        {getRoleDisplayName(role)} Permissions
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rolePermissions
                        .filter(perm => perm.role === role)
                        .map((permission) => {
                          const routeNames: Record<string, string> = {
                            '/': 'หน้าหลัก',
                            '/dashboard': 'แดชบอร์ด',
                            '/analytics': 'วิเคราะห์ข้อมูล',
                            '/doctors': 'จัดการแพทย์',
                            '/data-input': 'ป้อนข้อมูล',
                            '/reports': 'รายงาน',
                            '/analysis': 'วิเคราะห์ผล',
                            '/performance-report': 'รายงานประสิทธิภาพ',
                            '/admin': 'จัดการระบบ'
                          };

                          return (
                            <div 
                              key={`${role}-${permission.route}`}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                            >
                              <div>
                                <p className="font-medium text-sm text-foreground">
                                  {routeNames[permission.route] || permission.route}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {permission.route}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={permission.can_access}
                                  disabled={true}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {permission.can_access ? 'อนุญาต' : 'ไม่อนุญาต'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* System Alerts */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">System Alerts</h2>
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              ))}
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
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
import { supabase } from "@/integrations/supabase/client";
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
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
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
    setPermissionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true });

      if (error) throw error;
      setRolePermissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPermissionsLoading(false);
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
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({
            email: formData.email,
            name: formData.name,
            role: formData.role,
            department: formData.department || null,
            status: formData.status,
            password: formData.password
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Add new user
        const { error } = await supabase
          .from('users')
          .insert({
            email: formData.email,
            name: formData.name,
            role: formData.role,
            department: formData.department || null,
            status: formData.status,
            password: formData.password
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "User added successfully",
        });
      }

      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Administration</h1>
          <p className="text-muted-foreground">Manage users, system settings, and monitor performance</p>
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
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Role Permissions Status</h2>
              <a 
                href="https://supabase.com/dashboard/project/pvzgswmdxkybrnznsyih/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
              >
                <Database className="h-4 w-4" />
                Edit in Supabase
              </a>
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
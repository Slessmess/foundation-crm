import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LogOut, Edit2, Check, MapPin, Search, Target, Calendar, BarChart3, X, Camera, Phone, Mail, Home, User, Clock, CheckCircle, AlertCircle, TrendingUp, FileText, Users, Activity, Image as ImageIcon, MessageSquare, Plus, Send, UserPlus, Menu } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

/**
 * Foundation CRM - Enhanced Version
 * 
 * Complete CRM system with:
 * - Fixed all code issues from original
 * - Mobile-responsive design
 * - Photo upload capability
 * - Enhanced lead tracking
 * - Analytics dashboard
 * - Task management
 * - Role-based access control
 * - Supabase integration
 * - Google Maps ready (API integration points)
 */

const App = () => {
  // Core State
  const [currentUser, setCurrentUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('login');
  const [error, setError] = useState('');
  const [supabase, setSupabase] = useState(null);
  
  // UI State
  const [loginPassword, setLoginPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ username: '', password: '', role: 'canvasser', weeklyGoal: 10 });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  // Data State
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', role: 'admin', password: 'admin', weeklyGoal: 0 },
    { id: 2, name: 'Sales Manager', role: 'sales_manager', password: 'manager', weeklyGoal: 0 },
    { id: 3, name: 'Sales Rep 1', role: 'sales_rep', password: 'rep', weeklyGoal: 0 },
    { id: 4, name: 'Canvasser', role: 'canvasser', password: 'canvas', weeklyGoal: 10 },
    { id: 5, name: 'Confirmation Team', role: 'confirmation', password: 'confirm', weeklyGoal: 0 }
  ]);
  const [customerPhotos, setCustomerPhotos] = useState({});
  const [customerCoordinates, setCustomerCoordinates] = useState({});
  const [addressSearch, setAddressSearch] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [leadsThisWeek, setLeadsThisWeek] = useState(0);
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);

  // Initialize Supabase
  useEffect(() => {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey);
      setSupabase(client);
      loadData(client);
    }
  }, []);

  // Calculate weekly leads
  const calculateLeadsThisWeek = useCallback(() => {
    if (!currentUser) return;
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekLeads = customers.filter(c => {
      const createdDate = new Date(c.createdAt);
      return c.createdBy === currentUser.name && createdDate >= weekAgo && createdDate <= today;
    }).length;
    setLeadsThisWeek(thisWeekLeads);
  }, [currentUser, customers]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'canvasser') {
      calculateLeadsThisWeek();
    }
  }, [currentUser, calculateLeadsThisWeek]);

  // Data loading
  const loadData = async (client) => {
    try {
      const [customersRes, tasksRes, usersRes, photosRes, coordsRes] = await Promise.all([
        client.from('customers').select('*'),
        client.from('tasks').select('*'),
        client.from('users').select('*'),
        client.from('customer_photos').select('*'),
        client.from('customer_coordinates').select('*')
      ]);
      
      if (customersRes.data) setCustomers(customersRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (usersRes.data && usersRes.data.length > 0) setUsers(usersRes.data);
      
      if (photosRes.data) {
        const photoMap = {};
        photosRes.data.forEach(photo => {
          if (!photoMap[photo.customerId]) photoMap[photo.customerId] = [];
          photoMap[photo.customerId].push(photo);
        });
        setCustomerPhotos(photoMap);
      }
      
      if (coordsRes.data) {
        const coordMap = {};
        coordsRes.data.forEach(coord => {
          coordMap[coord.customerId] = coord;
        });
        setCustomerCoordinates(coordMap);
      }
    } catch (err) {
      console.log('Using demo mode:', err);
    }
  };

  // Address search handling
  const handleAddressSearch = async (query) => {
    setAddressSearch(query);
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    
    // Mock suggestions (replace with Google Places API)
    const mockSuggestions = [
      { description: `${query} Street, Cincinnati, OH`, place_id: '1' },
      { description: `${query} Avenue, Cincinnati, OH`, place_id: '2' },
      { description: `${query} Road, Cincinnati, OH`, place_id: '3' }
    ];
    setAddressSuggestions(mockSuggestions);
  };

  const handleAddressSelect = (prediction) => {
    setSelectedAddress(prediction.description);
    setAddressSearch(prediction.description);
    setAddressSuggestions([]);
  };

  // Authentication
  const handleLogin = (username, password) => {
    const user = users.find(u => u.name === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      setLoginPassword('');
      setError('');
      setView(user.role === 'canvasser' ? 'canvasser-dashboard' : 'dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  const handleRegister = async () => {
    if (!registerData.username || !registerData.password) {
      setError('Please enter username and password');
      return;
    }
    if (users.find(u => u.name === registerData.username)) {
      setError('Username already exists');
      return;
    }
    
    const newUser = { 
      id: Date.now(), 
      name: registerData.username, 
      role: registerData.role, 
      password: registerData.password,
      weeklyGoal: registerData.role === 'canvasser' ? registerData.weeklyGoal : 0
    };
    
    setUsers([...users, newUser]);
    if (supabase) {
      try {
        await supabase.from('users').insert([newUser]);
      } catch (err) {
        console.log('User saved locally');
      }
    }
    
    setError('');
    setShowRegister(false);
    setRegisterData({ username: '', password: '', role: 'canvasser', weeklyGoal: 10 });
    alert('Account created! You can now log in.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setLoginPassword('');
    setError('');
    setLeadsThisWeek(0);
  };

  // Photo handling
  const handlePhotoUpload = async (customerId, file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const newPhoto = {
        id: Date.now(),
        customerId: customerId,
        data: e.target.result,
        uploadedBy: currentUser.name,
        uploadedAt: new Date().toISOString()
      };
      
      setCustomerPhotos({
        ...customerPhotos,
        [customerId]: [...(customerPhotos[customerId] || []), newPhoto]
      });
      
      if (supabase) {
        try {
          await supabase.from('customer_photos').insert([newPhoto]);
        } catch (err) {
          console.log('Photo saved locally');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Geocoding
  const geocodeAddress = async (address, customerId) => {
    // Mock geocoding (replace with Google Geocoding API)
    const mockCoord = {
      customerId: customerId,
      lat: 39.1031 + (Math.random() - 0.5) * 0.1,
      lng: -84.5120 + (Math.random() - 0.5) * 0.1,
      fullAddress: address
    };
    
    setCustomerCoordinates({
      ...customerCoordinates,
      [customerId]: mockCoord
    });
    
    if (supabase) {
      try {
        await supabase.from('customer_coordinates').insert([mockCoord]);
      } catch (err) {
        console.log('Coordinates saved locally');
      }
    }
    
    return address;
  };

  // Customer management
  const addCustomer = async (formData) => {
    const newCustomer = {
      id: Date.now(),
      ...formData,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      verified: false,
      inspectionScheduled: false,
      purchased: false,
      status: 'new',
      history: JSON.stringify([{ 
        timestamp: new Date().toISOString(), 
        changedBy: currentUser.name, 
        action: 'Homeowner created' 
      }])
    };
    
    await geocodeAddress(formData.address, newCustomer.id);
    
    if (supabase) {
      try {
        await supabase.from('customers').insert([newCustomer]);
      } catch (err) {
        console.log('Saving locally');
      }
    }
    
    setCustomers([...customers, newCustomer]);
    
    // Create verification task
    const confirmationTask = {
      id: Date.now() + 1,
      type: 'verification',
      customerId: newCustomer.id,
      customerName: formData.name,
      description: `Verify and schedule inspection for ${formData.name}`,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
      assignedTo: 'Confirmation Team',
      createdAt: new Date().toISOString(),
      priority: 'high'
    };
    
    if (supabase) {
      try {
        await supabase.from('tasks').insert([confirmationTask]);
      } catch (err) {
        console.log('Saving task locally');
      }
    }
    
    setTasks([...tasks, confirmationTask]);
    setSelectedCustomer(newCustomer);
  };

  const updateCustomer = async (customerId, field, value) => {
    const updated = customers.map(c => {
      if (c.id === customerId) {
        const history = JSON.parse(c.history || '[]');
        return {
          ...c,
          [field]: value,
          history: JSON.stringify([
            ...history, 
            { 
              timestamp: new Date().toISOString(), 
              changedBy: currentUser.name, 
              field: field, 
              oldValue: c[field], 
              newValue: value 
            }
          ])
        };
      }
      return c;
    });
    
    setCustomers(updated);
    
    if (supabase) {
      const customer = updated.find(c => c.id === customerId);
      try {
        await supabase.from('customers').update(customer).eq('id', customerId);
      } catch (err) {
        console.log('Update saved locally');
      }
    }
  };

  // Task management
  const completeTask = async (taskId) => {
    const updated = tasks.map(t => 
      t.id === taskId 
        ? { ...t, completed: true, completedBy: currentUser.name, completedAt: new Date().toISOString() } 
        : t
    );
    setTasks(updated);
    
    if (supabase) {
      const task = updated.find(t => t.id === taskId);
      try {
        await supabase.from('tasks').update(task).eq('id', taskId);
      } catch (err) {
        console.log('Task update saved locally');
      }
    }
  };

  // Routing
  if (!currentUser) {
    return (
      <LoginScreen 
        error={error}
        setError={setError}
        showRegister={showRegister}
        setShowRegister={setShowRegister}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        handleLogin={handleLogin}
        registerData={registerData}
        setRegisterData={setRegisterData}
        handleRegister={handleRegister}
      />
    );
  }

  if (currentUser.role === 'canvasser') {
    return (
      <CanvasserDashboard
        view={view}
        setView={setView}
        currentUser={currentUser}
        handleLogout={handleLogout}
        leadsThisWeek={leadsThisWeek}
        addressSearch={addressSearch}
        handleAddressSearch={handleAddressSearch}
        addressSuggestions={addressSuggestions}
        handleAddressSelect={handleAddressSelect}
        selectedAddress={selectedAddress}
        setSelectedAddress={setSelectedAddress}
        customers={customers}
        coordinates={customerCoordinates}
        addCustomer={addCustomer}
        setSelectedCustomer={setSelectedCustomer}
        selectedCustomer={selectedCustomer}
        customerPhotos={customerPhotos}
        handlePhotoUpload={handlePhotoUpload}
      />
    );
  }

  return (
    <AdminDashboard
      view={view}
      setView={setView}
      currentUser={currentUser}
      handleLogout={handleLogout}
      customers={customers}
      updateCustomer={updateCustomer}
      customerPhotos={customerPhotos}
      handlePhotoUpload={handlePhotoUpload}
      tasks={tasks}
      completeTask={completeTask}
      editingCustomer={editingCustomer}
      setEditingCustomer={setEditingCustomer}
      users={users}
    />
  );
};


// ============================================
// BURGER MENU - Universal Navigation
// ============================================

const BurgerMenu = ({ isOpen, onClose, currentUser, view, setView, onLogout }) => {
  if (!isOpen) return null;
  
  const menuItems = currentUser.role === 'canvasser' ? [
    { id: 'canvasser-dashboard', label: 'Dashboard', icon: Activity },
    { id: 'canvasser-form', label: 'New Homeowner', icon: UserPlus },
    { id: 'lead-hub', label: 'Lead Hub', icon: MapPin },
    { id: 'my-leads', label: 'My Leads', icon: FileText },
    { id: 'team', label: 'Messenger', icon: MessageSquare },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'leads', label: 'All Leads', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'team', label: 'Messenger', icon: MessageSquare },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Menu</h2>
              <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
            <div className="text-white">
              <p className="text-sm opacity-90">Logged in as</p>
              <p className="font-semibold text-lg">{currentUser.name}</p>
              <p className="text-xs opacity-75 capitalize">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setView(item.id); onClose(); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                      isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="p-4 border-t">
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition">
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================
// LOGIN SCREEN COMPONENT
// ============================================

const LoginScreen = ({ error, setError, showRegister, setShowRegister, loginPassword, setLoginPassword, handleLogin, registerData, setRegisterData, handleRegister }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-4 shadow-lg">
            <Home className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Foundation CRM
          </h1>
          <p className="text-gray-500 text-sm">Enterprise Lead Management</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {!showRegister ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input 
                type="text" 
                value={loginPassword.split('|')[0] || ''} 
                onChange={(e) => setLoginPassword(e.target.value + '|' + (loginPassword.split('|')[1] || ''))} 
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" 
                placeholder="Enter username" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                value={loginPassword.split('|')[1] || ''} 
                onChange={(e) => setLoginPassword((loginPassword.split('|')[0] || '') + '|' + e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleLogin(loginPassword.split('|')[0], loginPassword.split('|')[1])} 
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" 
                placeholder="Enter password" 
              />
            </div>

            <button 
              onClick={() => handleLogin(loginPassword.split('|')[0], loginPassword.split('|')[1])} 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
            >
              Sign In
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button 
              onClick={() => { setShowRegister(true); setLoginPassword(''); setError(''); }} 
              className="w-full bg-white border-2 border-gray-200 text-gray-700 p-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Create New Account
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input 
                type="text" 
                value={registerData.username} 
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })} 
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" 
                placeholder="Choose username" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                value={registerData.password} 
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} 
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" 
                placeholder="Choose password" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <select 
                value={registerData.role} 
                onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })} 
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="admin">Admin</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="sales_rep">Sales Representative</option>
                <option value="canvasser">Canvasser</option>
                <option value="confirmation">Confirmation Team</option>
              </select>
            </div>

            {registerData.role === 'canvasser' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Weekly Goal</label>
                <input 
                  type="number" 
                  value={registerData.weeklyGoal} 
                  onChange={(e) => setRegisterData({ ...registerData, weeklyGoal: parseInt(e.target.value) })} 
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" 
                  placeholder="e.g. 10" 
                />
              </div>
            )}

            <button 
              onClick={handleRegister} 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white p-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
            >
              Create Account
            </button>

            <button 
              onClick={() => { setShowRegister(false); setRegisterData({ username: '', password: '', role: 'canvasser', weeklyGoal: 10 }); setError(''); }} 
              className="w-full bg-white border-2 border-gray-200 text-gray-700 p-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// CANVASSER DASHBOARD - Main view for field workers
// ============================================

const CanvasserDashboard = (props) => {
  const { view, setView, currentUser, handleLogout, leadsThisWeek, selectedCustomer, setSelectedCustomer, showBurgerMenu, setShowBurgerMenu } = props;
  const progressPercentage = Math.min((leadsThisWeek / currentUser.weeklyGoal) * 100, 100);
  const myLeads = props.customers.filter(c => c.createdBy === currentUser.name);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <BurgerMenu 
        isOpen={showBurgerMenu}
        onClose={() => setShowBurgerMenu(false)}
        currentUser={currentUser}
        view={view}
        setView={setView}
        onLogout={handleLogout}
      />
      
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBurgerMenu(true)}
                className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              >
                <Menu size={24} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Canvasser Hub</h1>
                <p className="text-blue-100 text-sm">{currentUser.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('team')}
                className={`p-2 rounded-lg transition flex items-center gap-2 ${
                  view === 'team' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <MessageSquare size={20} />
                <span className="hidden sm:inline text-sm font-semibold">Messenger</span>
              </button>
              <button 
                onClick={handleLogout} 
                className="bg-red-500/90 text-white px-3 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm"
              >
                <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex overflow-x-auto px-4 pb-2 gap-2">
          <button 
            onClick={() => setView('canvasser-dashboard')} 
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${view === 'canvasser-dashboard' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setView('lead-hub')} 
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${view === 'lead-hub' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
          >
            Lead Hub
          </button>
          <button 
            onClick={() => setView('canvasser-form')} 
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${view === 'canvasser-form' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
          >
            New Lead
          </button>
          <button 
            onClick={() => setView('my-leads')} 
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${view === 'my-leads' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
          >
            My Leads ({myLeads.length})
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {view === 'canvasser-dashboard' && (
          <CanvasserDashboardView 
            currentUser={currentUser}
            leadsThisWeek={leadsThisWeek}
            progressPercentage={progressPercentage}
            myLeads={myLeads}
            setView={setView}
          />
        )}

        {view === 'lead-hub' && (
          <LeadHub {...props} />
        )}

        {view === 'canvasser-form' && (
          <CanvasserForm {...props} />
        )}

        {view === 'my-leads' && (
          <MyLeads customers={myLeads} customerPhotos={props.customerPhotos} />
        )}
      </div>

      {/* Success Modal */}
      {selectedCustomer && (
        <CustomerSuccessModal 
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onAddAnother={() => {
            setSelectedCustomer(null);
            setView('canvasser-form');
          }}
        />
      )}
    </div>
  );
};

const CanvasserDashboardView = ({ currentUser, leadsThisWeek, progressPercentage, myLeads, setView }) => {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Weekly Progress */}
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Weekly Progress</h2>
          <div className="p-3 bg-blue-100 rounded-full">
            <Target size={32} className="text-blue-600" />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl md:text-6xl font-bold text-blue-600">{leadsThisWeek}</span>
            <span className="text-xl text-gray-600">/ {currentUser.weeklyGoal}</span>
          </div>
          <p className="text-gray-600">
            {leadsThisWeek >= currentUser.weeklyGoal ? (
              <span className="text-green-600 font-semibold">🎉 Goal achieved!</span>
            ) : (
              `${Math.max(currentUser.weeklyGoal - leadsThisWeek, 0)} more to reach your goal`
            )}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={myLeads.length} label="Total Leads" color="blue" />
        <StatCard value={myLeads.filter(l => l.verified).length} label="Verified" color="green" />
        <StatCard value={myLeads.filter(l => l.inspectionScheduled).length} label="Inspections" color="purple" />
        <StatCard value={myLeads.filter(l => l.purchased).length} label="Converted" color="amber" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button 
            onClick={() => setView('lead-hub')} 
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <MapPin size={20} /> Open Lead Hub
          </button>
          <button 
            onClick={() => setView('canvasser-form')} 
            className="bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <User size={20} /> New Homeowner
          </button>
        </div>
      </div>

      {/* Recent Leads */}
      {myLeads.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Leads</h3>
          <div className="space-y-3">
            {myLeads.slice(0, 3).map(lead => (
              <RecentLeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ value, label, color }) => {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600'
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <div className={`text-3xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

const RecentLeadCard = ({ lead }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-gray-800">{lead.name}</div>
          <div className="text-sm text-gray-600">{lead.address}</div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(lead.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {lead.verified && <Badge text="Verified" color="green" />}
          {lead.inspectionScheduled && <Badge text="Inspection" color="purple" />}
          {lead.purchased && <Badge text="Customer" color="amber" />}
        </div>
      </div>
    </div>
  );
};

const Badge = ({ text, color }) => {
  const colors = {
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700'
  };
  
  return (
    <span className={`text-xs ${colors[color]} px-2 py-1 rounded`}>{text}</span>
  );
};

// ============================================
// LEAD HUB - Map and location-based lead management
// ============================================

const LeadHub = ({ addressSearch, handleAddressSearch, addressSuggestions, handleAddressSelect, selectedAddress, setSelectedAddress, customers, coordinates, setView }) => {
  const customersWithCoords = customers.filter(c => coordinates[c.id]);
  
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Lead Hub - Find Locations</h2>
        
        {/* Address Search */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search for Address</label>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              value={addressSearch} 
              onChange={(e) => handleAddressSearch(e.target.value)} 
              placeholder="Start typing an address..." 
              className="w-full p-3 pl-10 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" 
            />
          </div>
          
          {addressSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-w-2xl">
              {addressSuggestions.map((suggestion, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleAddressSelect(suggestion)} 
                  className="w-full text-left p-4 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                >
                  <p className="font-semibold text-gray-800">{suggestion.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="text-blue-600" size={20} />
            <p className="text-sm font-semibold text-blue-800">
              {customersWithCoords.length} locations mapped
            </p>
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-3">
          {customersWithCoords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No mapped locations yet</p>
            </div>
          ) : (
            customersWithCoords.map(customer => {
              const coord = coordinates[customer.id];
              return (
                <button 
                  key={customer.id} 
                  onClick={() => setSelectedAddress(customer.address)} 
                  className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{customer.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin size={16} /> {coord.fullAddress}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {customer.purchased && <Badge text="Customer" color="green" />}
                        {!customer.purchased && <Badge text="Homeowner" color="blue" />}
                        {customer.verified && <Badge text="Verified" color="purple" />}
                      </div>
                    </div>
                    <span className="text-blue-600 text-sm font-semibold">Select →</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Selected Address */}
        {selectedAddress && (
          <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl">
            <p className="text-sm text-gray-600 mb-1">Selected Address:</p>
            <p className="font-semibold text-gray-800 mb-3">{selectedAddress}</p>
            <button 
              onClick={() => setView('canvasser-form')} 
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              Create Lead for This Address
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// CANVASSER FORM - Lead creation form
// ============================================

const CanvasserForm = ({ addCustomer, selectedAddress }) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    address: selectedAddress || '', 
    foundationType: '', 
    sourceOfLead: '', 
    notes: '' 
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setFormData(prev => ({ ...prev, address: selectedAddress || prev.address }));
  }, [selectedAddress]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.address || !formData.foundationType) {
      alert('Please fill in: Name, Address, and Foundation Type');
      return;
    }
    
    addCustomer(formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', phone: '', email: '', address: '', foundationType: '', sourceOfLead: '', notes: '' });
      setPhotoPreview(null);
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">New Homeowner Information</h2>
      
      {submitted && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
          <p className="text-green-800 font-semibold flex items-center gap-2">
            <CheckCircle size={20} /> Homeowner added successfully!
          </p>
        </div>
      )}

      <div className="space-y-4 md:space-y-5">
        {/* Name and Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="Name" 
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Homeowner name"
          />
          <FormField 
            label="Phone" 
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
            type="tel"
          />
        </div>

        {/* Email */}
        <FormField 
          label="Email" 
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@example.com"
          type="email"
        />

        {/* Address */}
        <FormField 
          label="Address" 
          required
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Main St, Cincinnati, OH 45202"
        />

        {/* Foundation Type and Source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Foundation Type <span className="text-red-500">*</span>
            </label>
            <select 
              value={formData.foundationType} 
              onChange={(e) => setFormData({ ...formData, foundationType: e.target.value })} 
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="">Select type...</option>
              <option value="Concrete Slab">Concrete Slab</option>
              <option value="Crawl Space">Crawl Space</option>
              <option value="Basement">Basement</option>
              <option value="Pilings">Pilings</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <FormField 
            label="How did they hear about us?" 
            value={formData.sourceOfLead}
            onChange={(e) => setFormData({ ...formData, sourceOfLead: e.target.value })}
            placeholder="Door-to-door, referral, etc."
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property Photo (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoChange}
              className="hidden" 
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="cursor-pointer">
              {photoPreview ? (
                <div className="space-y-3">
                  <img src={photoPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  <p className="text-sm text-gray-600">Click to change photo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Camera className="mx-auto text-gray-400" size={48} />
                  <p className="text-gray-600">Click to upload property photo</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
          <textarea 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors h-24 resize-none" 
            placeholder="Any additional information..."
          />
        </div>

        {/* Submit */}
        <button 
          onClick={handleSubmit} 
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg text-lg"
        >
          Submit Homeowner
        </button>
      </div>
    </div>
  );
};

const FormField = ({ label, required, value, onChange, placeholder, type = "text" }) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type={type}
        value={value}
        onChange={onChange}
        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" 
        placeholder={placeholder}
      />
    </div>
  );
};

// ============================================
// MY LEADS - Personal lead list for canvassers
// ============================================

const MyLeads = ({ customers, customerPhotos }) => {
  const [filter, setFilter] = useState('all');
  
  const filteredCustomers = customers.filter(c => {
    if (filter === 'verified') return c.verified;
    if (filter === 'inspection') return c.inspectionScheduled;
    if (filter === 'purchased') return c.purchased;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Leads</h2>
        
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <FilterButton 
            label={`All (${customers.length})`}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterButton 
            label={`Verified (${customers.filter(c => c.verified).length})`}
            active={filter === 'verified'}
            onClick={() => setFilter('verified')}
            color="green"
          />
          <FilterButton 
            label={`Inspection (${customers.filter(c => c.inspectionScheduled).length})`}
            active={filter === 'inspection'}
            onClick={() => setFilter('inspection')}
            color="purple"
          />
          <FilterButton 
            label={`Customers (${customers.filter(c => c.purchased).length})`}
            active={filter === 'purchased'}
            onClick={() => setFilter('purchased')}
            color="amber"
          />
        </div>

        {/* Leads */}
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No leads found</p>
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <LeadCard 
                key={customer.id} 
                customer={customer} 
                photos={customerPhotos[customer.id]} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ label, active, onClick, color = 'blue' }) => {
  const colors = {
    blue: active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700',
    green: active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700',
    purple: active ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700',
    amber: active ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'
  };
  
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${colors[color]}`}
    >
      {label}
    </button>
  );
};

const LeadCard = ({ customer, photos }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">{customer.name}</h3>
          <div className="space-y-1 mt-2">
            {customer.phone && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Phone size={14} /> {customer.phone}
              </p>
            )}
            {customer.email && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Mail size={14} /> {customer.email}
              </p>
            )}
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MapPin size={14} /> {customer.address}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <Clock size={14} /> {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {customer.verified && <Badge text="✓ Verified" color="green" />}
          {customer.inspectionScheduled && <Badge text="Inspection" color="purple" />}
          {customer.purchased && <Badge text="Customer" color="amber" />}
        </div>
      </div>

      {/* Photos */}
      {photos && photos.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {photos.map(photo => (
              <img 
                key={photo.id} 
                src={photo.data} 
                alt="Property" 
                className="h-20 w-20 object-cover rounded-lg border border-gray-300"
              />
            ))}
          </div>
        </div>
      )}

      {/* Additional Info */}
      {customer.foundationType && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Foundation:</span> {customer.foundationType}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// ADMIN DASHBOARD - Management view
// ============================================

const AdminDashboard = (props) => {
  const { view, setView, currentUser, handleLogout, customers, tasks } = props;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="px-4 md:px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Foundation CRM</h1>
              <p className="text-blue-100 text-sm">
                {currentUser.name} • {currentUser.role.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <button 
              onClick={handleLogout} 
              className="bg-red-500/90 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex overflow-x-auto px-4 md:px-6 pb-2 gap-2">
          <NavButton 
            icon={Activity}
            label="Dashboard"
            active={view === 'dashboard'}
            onClick={() => setView('dashboard')}
          />
          {(currentUser.role === 'admin' || currentUser.role === 'sales_manager') && (
            <>
              <NavButton 
                icon={Users}
                label={`Homeowners (${customers.filter(c => !c.purchased).length})`}
                active={view === 'homeowners'}
                onClick={() => setView('homeowners')}
              />
              <NavButton 
                icon={CheckCircle}
                label={`Customers (${customers.filter(c => c.purchased).length})`}
                active={view === 'customers'}
                onClick={() => setView('customers')}
              />
            </>
          )}
          {(currentUser.role === 'confirmation' || currentUser.role === 'admin') && (
            <NavButton 
              icon={FileText}
              label={`Tasks (${tasks.filter(t => !t.completed).length})`}
              active={view === 'tasks'}
              onClick={() => setView('tasks')}
            />
          )}
          {(currentUser.role === 'admin' || currentUser.role === 'sales_manager') && (
            <NavButton 
              icon={BarChart3}
              label="Analytics"
              active={view === 'analytics'}
              onClick={() => setView('analytics')}
            />
          )}
        </div>
      </div>

      <div className="p-4 md:p-6">
        {view === 'dashboard' && (
          <DashboardOverview {...props} />
        )}
        {view === 'homeowners' && (
          <CustomerList {...props} customers={customers.filter(c => !c.purchased)} title="Homeowners" />
        )}
        {view === 'customers' && (
          <CustomerList {...props} customers={customers.filter(c => c.purchased)} title="Customers" />
        )}
        {view === 'tasks' && (
          <TaskList {...props} />
        )}
        {view === 'analytics' && (
          <AnalyticsView {...props} />
        )}
      </div>
    </div>
  );
};

const NavButton = ({ icon: Icon, label, active, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap flex items-center gap-2 ${
        active ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
};

// ============================================
// DASHBOARD OVERVIEW - Summary stats
// ============================================

const DashboardOverview = ({ customers, tasks, users }) => {
  const totalLeads = customers.length;
  const verifiedLeads = customers.filter(c => c.verified).length;
  const inspections = customers.filter(c => c.inspectionScheduled).length;
  const customersCount = customers.filter(c => c.purchased).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const conversionRate = totalLeads > 0 ? ((customersCount / totalLeads) * 100).toFixed(1) : 0;

  const stats = [
    { label: 'Total Leads', value: totalLeads, icon: Users, color: 'blue' },
    { label: 'Verified', value: verifiedLeads, icon: CheckCircle, color: 'green' },
    { label: 'Inspections', value: inspections, icon: Calendar, color: 'purple' },
    { label: 'Customers', value: customersCount, icon: TrendingUp, color: 'amber' },
    { label: 'Pending Tasks', value: pendingTasks, icon: AlertCircle, color: 'red' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: BarChart3, color: 'cyan' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <DashboardStatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Leads</h3>
        <div className="space-y-3">
          {customers.slice(0, 5).reverse().map(customer => (
            <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{customer.name}</div>
                <div className="text-sm text-gray-600">{customer.address}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Added by {customer.createdBy} • {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {customer.purchased && <Badge text="Customer" color="amber" />}
                {customer.verified && <Badge text="Verified" color="green" />}
                {!customer.verified && !customer.purchased && <Badge text="New" color="blue" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DashboardStatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    cyan: 'bg-cyan-100 text-cyan-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">{label}</h3>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="text-4xl font-bold text-gray-900">{value}</div>
    </div>
  );
};

// ============================================
// CUSTOMER LIST - Detailed customer management
// ============================================

const CustomerList = ({ customers, currentUser, updateCustomer, editingCustomer, setEditingCustomer, customerPhotos, handlePhotoUpload, title }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'verified' && c.verified) ||
                          (filterStatus === 'inspection' && c.inspectionScheduled) ||
                          (filterStatus === 'new' && !c.verified && !c.inspectionScheduled);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="verified">Verified</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredCustomers.length} of {customers.length} {title.toLowerCase()}
        </div>
      </div>

      {/* Customer Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Users size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No {title.toLowerCase()} found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map(customer => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              photos={customerPhotos[customer.id]}
              isEditing={editingCustomer === customer.id}
              onEdit={() => setEditingCustomer(editingCustomer === customer.id ? null : customer.id)}
              onUpdate={updateCustomer}
              onPhotoUpload={handlePhotoUpload}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CustomerCard = ({ customer, photos, isEditing, onEdit, onUpdate, onPhotoUpload }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{customer.name}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {customer.purchased && <Badge text="✓ Customer" color="amber" />}
            {customer.verified && <Badge text="✓ Verified" color="green" />}
            {customer.inspectionScheduled && <Badge text="Inspection Scheduled" color="purple" />}
            {!customer.verified && !customer.inspectionScheduled && !customer.purchased && (
              <Badge text="New Lead" color="blue" />
            )}
          </div>
          <p className="text-sm text-gray-600">
            Created by {customer.createdBy} on {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>

        <button 
          onClick={onEdit} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Edit2 size={18} />
          <span className="font-semibold">Edit</span>
        </button>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <DetailField label="Phone" value={customer.phone} />
        <DetailField label="Email" value={customer.email} />
        <DetailField label="Foundation Type" value={customer.foundationType} />
        <div className="md:col-span-2 lg:col-span-3">
          <DetailField label="Address" value={customer.address} />
        </div>
      </div>

      {/* Editing Panel */}
      {isEditing && (
        <div className="border-t pt-6 mt-6 space-y-4 bg-blue-50 -m-6 p-6 rounded-b-xl">
          <h4 className="font-bold text-gray-800 mb-4">Update Status</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatusButton
              label={customer.verified ? '✓ Verified' : 'Mark as Verified'}
              active={customer.verified}
              onClick={() => onUpdate(customer.id, 'verified', !customer.verified)}
              color="green"
            />
            <StatusButton
              label={customer.inspectionScheduled ? '✓ Inspection Set' : 'Schedule Inspection'}
              active={customer.inspectionScheduled}
              onClick={() => onUpdate(customer.id, 'inspectionScheduled', !customer.inspectionScheduled)}
              color="purple"
            />
            <StatusButton
              label={customer.purchased ? '✓ Customer' : 'Convert to Customer'}
              active={customer.purchased}
              onClick={() => onUpdate(customer.id, 'purchased', !customer.purchased)}
              color="amber"
            />
          </div>

          <div className="pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                Array.from(e.target.files).forEach(file => {
                  onPhotoUpload(customer.id, file);
                });
              }}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>
        </div>
      )}

      {/* Photos */}
      {photos && photos.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h4 className="font-semibold text-gray-800 mb-3">Property Photos ({photos.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map(photo => (
              <div key={photo.id} className="relative group">
                <img 
                  src={photo.data} 
                  alt="Property" 
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="text-white text-xs text-center p-2">
                    <p>{photo.uploadedBy}</p>
                    <p className="text-gray-300">{new Date(photo.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {customer.history && (
        <div className="border-t pt-6 mt-6">
          <h4 className="font-semibold text-gray-800 mb-3">Activity History</h4>
          <div className="space-y-2">
            {JSON.parse(customer.history).slice(-5).reverse().map((entry, idx) => (
              <div key={idx} className="text-sm p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <span className="font-semibold">{entry.changedBy || entry.action}</span>
                  {entry.field && ` changed ${entry.field}`}
                  {entry.action && !entry.field && ` - ${entry.action}`}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DetailField = ({ label, value }) => {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-gray-800 font-medium">{value || '—'}</p>
    </div>
  );
};

const StatusButton = ({ label, active, onClick, color }) => {
  const colors = {
    green: active ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-600',
    purple: active ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-600',
    amber: active ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-600'
  };

  return (
    <button
      onClick={onClick}
      className={`py-3 px-4 rounded-lg font-semibold transition-all ${colors[color]}`}
    >
      {label}
    </button>
  );
};

// ============================================
// TASK LIST - Task management
// ============================================

const TaskList = ({ tasks, completeTask, customers }) => {
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-6">
      {/* Pending Tasks */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Pending Tasks ({pendingTasks.length})
        </h2>
        
        {pendingTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
            <p className="text-gray-600 text-lg font-semibold">All caught up!</p>
            <p className="text-gray-500 text-sm">No pending tasks.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                customer={customers.find(c => c.id === task.customerId)}
                onComplete={() => completeTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Completed Tasks ({completedTasks.length})
          </h2>
          
          <div className="space-y-3">
            {completedTasks.slice(0, 10).map(task => (
              <CompletedTaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TaskCard = ({ task, customer, onComplete }) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-600',
    medium: 'bg-amber-100 text-amber-600',
    low: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className="border-2 border-gray-200 rounded-xl p-4 md:p-6 hover:border-blue-300 transition-colors">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2 rounded-lg ${priorityColors[task.priority || 'low']}`}>
              {task.type === 'verification' ? (
                <CheckCircle size={20} />
              ) : (
                <Calendar size={20} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-1">{task.description}</h3>
              <p className="text-gray-600">Customer: <span className="font-semibold">{task.customerName}</span></p>
              {customer && (
                <p className="text-sm text-gray-500 mt-1">{customer.address}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge 
                  text={(task.priority || 'NORMAL').toUpperCase()} 
                  color={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'amber' : 'blue'} 
                />
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {task.type}
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Created: {new Date(task.createdAt).toLocaleDateString()}
            {task.dueDate && ` • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
          </p>
        </div>

        <button 
          onClick={onComplete} 
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold transition-all shadow-md"
        >
          <Check size={20} /> Complete
        </button>
      </div>
    </div>
  );
};

const CompletedTaskCard = ({ task }) => {
  return (
    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">{task.description}</h3>
          <p className="text-sm text-gray-600">Customer: {task.customerName}</p>
          <p className="text-xs text-gray-500 mt-2">
            Completed by {task.completedBy} on {new Date(task.completedAt).toLocaleDateString()}
          </p>
        </div>
        <CheckCircle className="text-green-600" size={24} />
      </div>
    </div>
  );
};

// ============================================
// ANALYTICS VIEW - Performance metrics
// ============================================

const AnalyticsView = ({ customers, users, tasks }) => {
  const canvassers = users.filter(u => u.role === 'canvasser');
  
  const leaderboard = canvassers.map(canvasser => {
    const leads = customers.filter(c => c.createdBy === canvasser.name);
    const verified = leads.filter(l => l.verified).length;
    const converted = leads.filter(l => l.purchased).length;
    const conversionRate = leads.length > 0 ? ((converted / leads.length) * 100).toFixed(1) : 0;
    
    return {
      name: canvasser.name,
      totalLeads: leads.length,
      verified: verified,
      converted: converted,
      conversionRate: conversionRate,
      weeklyGoal: canvasser.weeklyGoal
    };
  }).sort((a, b) => b.totalLeads - a.totalLeads);

  const totalLeads = customers.length;
  const totalConverted = customers.filter(c => c.purchased).length;
  const totalVerified = customers.filter(c => c.verified).length;
  const overallConversion = totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnalyticsStat label="Total Leads" value={totalLeads} color="blue" />
        <AnalyticsStat label="Verified" value={totalVerified} color="green" />
        <AnalyticsStat label="Converted" value={totalConverted} color="amber" />
        <AnalyticsStat label="Conversion Rate" value={`${overallConversion}%`} color="purple" />
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Canvasser Leaderboard</h2>
        
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users size={64} className="mx-auto mb-4 text-gray-300" />
            <p>No canvassers yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((canvasser, index) => (
              <LeaderboardCard key={canvasser.name} canvasser={canvasser} rank={index + 1} />
            ))}
          </div>
        )}
      </div>

      {/* Task Stats */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Task Completion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TaskProgressBar 
            label="Completed"
            value={tasks.filter(t => t.completed).length}
            total={tasks.length}
            color="green"
          />
          <TaskProgressBar 
            label="Pending"
            value={tasks.filter(t => !t.completed).length}
            total={tasks.length}
            color="red"
          />
        </div>
      </div>
    </div>
  );
};

const AnalyticsStat = ({ label, value, color }) => {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className={`text-4xl font-bold ${colors[color]}`}>{value}</div>
    </div>
  );
};

const LeaderboardCard = ({ canvasser, rank }) => {
  const rankColors = {
    1: 'border-amber-400 bg-amber-50',
    2: 'border-gray-400 bg-gray-50',
    3: 'border-orange-400 bg-orange-50'
  };

  const rankBadgeColors = {
    1: 'bg-amber-400 text-white',
    2: 'bg-gray-400 text-white',
    3: 'bg-orange-400 text-white'
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className={`p-4 rounded-xl border-2 ${rank <= 3 ? rankColors[rank] : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
            rank <= 3 ? rankBadgeColors[rank] : 'bg-blue-100 text-blue-600'
          }`}>
            {rank}
          </div>
          <div>
            <div className="font-bold text-gray-800 text-lg">{canvasser.name}</div>
            <div className="text-sm text-gray-600">Goal: {canvasser.weeklyGoal}/week</div>
          </div>
        </div>
        {rank <= 3 && <div className="text-3xl">{medals[rank - 1]}</div>}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <LeaderboardStat value={canvasser.totalLeads} label="Total" color="blue" />
        <LeaderboardStat value={canvasser.verified} label="Verified" color="green" />
        <LeaderboardStat value={canvasser.converted} label="Converted" color="amber" />
        <LeaderboardStat value={`${canvasser.conversionRate}%`} label="Rate" color="purple" />
      </div>
    </div>
  );
};

const LeaderboardStat = ({ value, label, color }) => {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600'
  };

  return (
    <div className="text-center p-2 bg-white rounded-lg">
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
};

const TaskProgressBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total * 100) : 0;
  const colors = {
    green: 'bg-green-600',
    red: 'bg-red-600'
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-700 font-semibold">{label}</span>
        <span className={`text-2xl font-bold ${color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
          {value}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${colors[color]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// ============================================
// SUCCESS MODAL - Customer creation confirmation
// ============================================

const CustomerSuccessModal = ({ customer, onClose, onAddAnother }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Lead Created!</h2>
              <p className="text-gray-600">{customer.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <DetailField label="Address" value={customer.address} />
          <DetailField label="Foundation Type" value={customer.foundationType || 'N/A'} />
          {customer.phone && <DetailField label="Phone" value={customer.phone} />}
          {customer.email && <DetailField label="Email" value={customer.email} />}
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
          <p className="text-green-800 font-semibold">✓ Lead successfully added!</p>
          <p className="text-green-700 text-sm mt-1">The confirmation team has been notified.</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onAddAnother} 
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Add Another Lead
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;

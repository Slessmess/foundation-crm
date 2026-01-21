import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LogOut, Edit2, Check, MapPin, Search, Target, Calendar, BarChart3, X, Camera, Phone, Mail, Home, User, Clock, CheckCircle, AlertCircle, TrendingUp, FileText, Users, Activity, MessageSquare, Plus, Send, UserPlus, Menu } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

/**
 * Foundation CRM - Enhanced with Navigation & Messaging
 * 
 * Features:
 * ✓ Burger menu on every page
 * ✓ Messenger button on all dashboards
 * ✓ Admin/Manager can create channels and add members
 * ✓ Channel-based messaging with access control
 * ✓ Users only see channels they're members of
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
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  
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
  
  // Messaging State
  const [channels, setChannels] = useState([
    { id: 1, name: 'Everyone', members: 'all', messages: [], createdBy: 'System', createdAt: new Date().toISOString() }
  ]);

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
      const [customersRes, tasksRes, usersRes, photosRes, coordsRes, channelsRes] = await Promise.all([
        client.from('customers').select('*'),
        client.from('tasks').select('*'),
        client.from('users').select('*'),
        client.from('customer_photos').select('*'),
        client.from('customer_coordinates').select('*'),
        client.from('channels').select('*')
      ]);
      
      if (customersRes.data) setCustomers(customersRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (usersRes.data && usersRes.data.length > 0) setUsers(usersRes.data);
      if (channelsRes.data && channelsRes.data.length > 0) setChannels(channelsRes.data);
      
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

  // Address search
  const handleAddressSearch = async (query) => {
    setAddressSearch(query);
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.predictions) {
        setAddressSuggestions(data.predictions);
      }
    } catch (err) {
      console.error('Address search error:', err);
    }
  };

  const handleAddressSelect = (prediction) => {
    setSelectedAddress(prediction.description);
    setAddressSearch(prediction.description);
    setAddressSuggestions([]);
  };

  // Auth
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
    setShowBurgerMenu(false);
  };

  // Photo upload
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
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const coord = {
          customerId: customerId,
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          fullAddress: result.formatted_address
        };
        
        setCustomerCoordinates({
          ...customerCoordinates,
          [customerId]: coord
        });
        
        if (supabase) {
          try {
            await supabase.from('customer_coordinates').insert([coord]);
          } catch (err) {
            console.log('Coordinates saved locally');
          }
        }
        
        return result.formatted_address;
      }
    } catch (err) {
      console.error('Geocoding error:', err);
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

  // Login Screen
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

  // Main App for logged-in users
  return currentUser.role === 'canvasser' ? (
    <CanvasserDashboard
      view={view}
      setView={setView}
      currentUser={currentUser}
      handleLogout={handleLogout}
      customers={customers}
      addCustomer={addCustomer}
      leadsThisWeek={leadsThisWeek}
      selectedCustomer={selectedCustomer}
      setSelectedCustomer={setSelectedCustomer}
      addressSearch={addressSearch}
      handleAddressSearch={handleAddressSearch}
      addressSuggestions={addressSuggestions}
      handleAddressSelect={handleAddressSelect}
      selectedAddress={selectedAddress}
      customerPhotos={customerPhotos}
      users={users}
      channels={channels}
      setChannels={setChannels}
      showBurgerMenu={showBurgerMenu}
      setShowBurgerMenu={setShowBurgerMenu}
      supabase={supabase}
    />
  ) : (
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
      channels={channels}
      setChannels={setChannels}
      showBurgerMenu={showBurgerMenu}
      setShowBurgerMenu={setShowBurgerMenu}
      supabase={supabase}
    />
  );
};

export default App;

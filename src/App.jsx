import React, { useState, useEffect } from 'react';
import { LogOut, Edit2, Check, MapPin, Search, Target } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('login');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [supabase, setSupabase] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', role: 'admin', password: 'admin', weeklyGoal: 0 },
    { id: 2, name: 'Sales Manager', role: 'sales_manager', password: 'manager', weeklyGoal: 0 },
    { id: 3, name: 'Sales Rep 1', role: 'sales_rep', password: 'rep', weeklyGoal: 0 },
    { id: 4, name: 'Canvasser', role: 'canvasser', password: 'canvas', weeklyGoal: 10 },
    { id: 5, name: 'Confirmation Team', role: 'confirmation', password: 'confirm', weeklyGoal: 0 }
  ]);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ username: '', password: '', role: 'canvasser', weeklyGoal: 10 });
  const [customerPhotos, setCustomerPhotos] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerCoordinates, setCustomerCoordinates] = useState({});
  const [addressSearch, setAddressSearch] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [leadsThisWeek, setLeadsThisWeek] = useState(0);

  useEffect(() => {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey);
      setSupabase(client);
      loadData(client);
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'canvasser') {
      if (!currentUser) return;
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeekLeads = customers.filter(c => {
        const createdDate = new Date(c.createdAt);
        return c.createdBy === currentUser.name && createdDate >= weekAgo && createdDate <= today;
      }).length;
      setLeadsThisWeek(thisWeekLeads);
    }
  }, [customers, currentUser]);

  const loadData = async (client) => {
    try {
      const [customersRes, tasksRes, usersRes] = await Promise.all([
        client.from('customers').select('*'),
        client.from('tasks').select('*'),
        client.from('users').select('*')
      ]);
      if (customersRes.data) setCustomers(customersRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (usersRes.data) setUsers(usersRes.data);
    } catch (err) {
      console.log('Using demo mode');
    }
  };

  const calculateLeadsThisWeek = () => {
    if (!currentUser) return;
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekLeads = customers.filter(c => {
      const createdDate = new Date(c.createdAt);
      return c.createdBy === currentUser.name && createdDate >= weekAgo && createdDate <= today;
    }).length;
    setLeadsThisWeek(thisWeekLeads);
  };

  const calculateLeadsThisWeek = () => {
    if (!currentUser) return;
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekLeads = customers.filter(c => {
      const createdDate = new Date(c.createdAt);
      return c.createdBy === currentUser.name && createdDate >= weekAgo && createdDate <= today;
    }).length;
    setLeadsThisWeek(thisWeekLeads);
  };

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
        setAddressSuggestions(data.predictions.slice(0, 5));
      }
    } catch (err) {
      console.log('Address search error:', err);
    }
  };

  const handleAddressSelect = (prediction) => {
    setSelectedAddress(prediction.description);
    setAddressSearch(prediction.description);
    setAddressSuggestions([]);
  };

  const handleLogin = (username, password) => {
    const user = users.find(u => u.name === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      setLoginPassword('');
      setError('');
      if (user.role === 'canvasser') {
        setView('canvasser-dashboard');
      } else {
        setView('dashboard');
      }
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

  const handlePhotoUpload = (customerId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomerPhotos({
        ...customerPhotos,
        [customerId]: [
          ...(customerPhotos[customerId] || []),
          { id: Date.now(), data: e.target.result, uploadedBy: currentUser.name, uploadedAt: new Date().toLocaleString() }
        ]
      });
    };
    reader.readAsDataURL(file);
  };

  const geocodeAddress = async (address, customerId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        setCustomerCoordinates({
          ...customerCoordinates,
          [customerId]: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            fullAddress: result.formatted_address
          }
        });
        return result.formatted_address;
      }
    } catch (err) {
      console.log('Geocoding error:', err);
    }
    return null;
  };

  const addCustomer = async (formData) => {
    const newCustomer = {
      id: Date.now(),
      ...formData,
      createdBy: currentUser.name,
      createdAt: new Date().toLocaleString(),
      verified: false,
      inspectionScheduled: false,
      purchased: false,
      history: JSON.stringify([{ timestamp: new Date().toLocaleString(), changedBy: currentUser.name, action: 'Homeowner created' }])
    };
    const fullAddress = await geocodeAddress(formData.address, newCustomer.id);
    if (fullAddress) newCustomer.address = fullAddress;
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
      dueDate: new Date().toLocaleString(),
      completed: false,
      assignedTo: 'Confirmation Team',
      createdAt: new Date().toLocaleString()
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
          history: JSON.stringify([...history, { timestamp: new Date().toLocaleString(), changedBy: currentUser.name, field: field, oldValue: c[field], newValue: value }])
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
    const updated = tasks.map(t => t.id === taskId ? { ...t, completed: true, completedBy: currentUser.name, completedAt: new Date().toLocaleString() } : t);
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

  if (view === 'login' && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-96">
          <h1 className="text-3xl font-bold text-center mb-2 text-blue-900">Foundation CRM</h1>
          <p className="text-center text-gray-600 mb-6 text-sm">Powered by Supabase & Vercel</p>
          {error && <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-600 text-red-800 text-sm">{error}</div>}
          {!showRegister ? (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input type="text" value={loginPassword.split('|')[0] || ''} onChange={(e) => setLoginPassword(e.target.value + '|' + (loginPassword.split('|')[1] || ''))} className="w-full p-2 border rounded mb-2" placeholder="Enter username" />
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input type="password" value={loginPassword.split('|')[1] || ''} onChange={(e) => setLoginPassword((loginPassword.split('|')[0] || '') + '|' + e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin(loginPassword.split('|')[0], loginPassword.split('|')[1])} className="w-full p-2 border rounded mb-3" placeholder="Enter password" />
              <button onClick={() => handleLogin(loginPassword.split('|')[0], loginPassword.split('|')[1])} className="w-full bg-blue-600 text-white p-2 rounded font-semibold hover:bg-blue-700 mb-2">Login</button>
              <button onClick={() => { setShowRegister(true); setLoginPassword(''); setError(''); }} className="w-full bg-green-600 text-white p-2 rounded font-semibold hover:bg-green-700">Create New Account</button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input type="text" value={registerData.username} onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })} className="w-full p-2 border rounded mb-3" placeholder="Choose a username" />
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input type="password" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} className="w-full p-2 border rounded mb-3" placeholder="Choose a password" />
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <select value={registerData.role} onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })} className="w-full p-2 border rounded mb-3">
                <option value="admin">Admin</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="sales_rep">Sales Representative</option>
                <option value="canvasser">Canvasser</option>
                <option value="confirmation">Confirmation Team</option>
              </select>
              {registerData.role === 'canvasser' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Weekly Goal</label>
                  <input type="number" value={registerData.weeklyGoal} onChange={(e) => setRegisterData({ ...registerData, weeklyGoal: parseInt(e.target.value) })} className="w-full p-2 border rounded mb-3" placeholder="e.g. 10" />
                </div>
              )}
              <button onClick={handleRegister} className="w-full bg-green-600 text-white p-2 rounded font-semibold hover:bg-green-700 mb-2">Create Account</button>
              <button onClick={() => { setShowRegister(false); setRegisterData({ username: '', password: '', role: 'canvasser', weeklyGoal: 10 }); setError(''); }} className="w-full bg-gray-400 text-white p-2 rounded font-semibold hover:bg-gray-500">Back to Login</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'canvasser-dashboard' && currentUser && currentUser.role === 'canvasser') {
    return (
      <CanvasserDashboard view={view} setView={setView} currentUser={currentUser} handleLogout={handleLogout} leadsThisWeek={leadsThisWeek} addressSearch={addressSearch} handleAddressSearch={handleAddressSearch} addressSuggestions={addressSuggestions} handleAddressSelect={handleAddressSelect} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} customers={customers} coordinates={customerCoordinates} addCustomer={addCustomer} setSelectedCustomer={setSelectedCustomer} selectedCustomer={selectedCustomer} />
    );
  }

  if (currentUser) {
    return (
      <AdminDashboard view={view} setView={setView} currentUser={currentUser} handleLogout={handleLogout} customers={customers} updateCustomer={updateCustomer} editingId={editingId} setEditingId={setEditingId} customerPhotos={customerPhotos} handlePhotoUpload={handlePhotoUpload} tasks={tasks} completeTask={completeTask} coordinates={customerCoordinates} />
    );
  }

  return null;
};

const CanvasserDashboard = ({ view, setView, currentUser, handleLogout, leadsThisWeek, addressSearch, handleAddressSearch, addressSuggestions, handleAddressSelect, selectedAddress, setSelectedAddress, customers, coordinates, addCustomer, setSelectedCustomer, selectedCustomer }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Canvasser Dashboard</h1>
          <p className="text-blue-100">Welcome, {currentUser.name}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
          <LogOut size={20} /> Logout
        </button>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        <button onClick={() => setView('canvasser-dashboard')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'canvasser-dashboard' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>Dashboard</button>
        <button onClick={() => setView('lead-hub')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'lead-hub' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>Lead Hub</button>
        <button onClick={() => setView('canvasser-form')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'canvasser-form' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>New Homeowner</button>
        <button onClick={() => setView('my-leads')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'my-leads' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>My Leads</button>
      </div>

      {view === 'canvasser-dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Weekly Leads</h2>
                <Target size={32} className="text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-blue-600">{leadsThisWeek}</span>
                <span className="text-gray-600">/ {currentUser.weeklyGoal} leads</span>
              </div>
              <div className="mt-4 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all" 
                  style={{ width: `${Math.min((leadsThisWeek / currentUser.weeklyGoal) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {Math.max(currentUser.weeklyGoal - leadsThisWeek, 0)} more leads needed to hit your goal
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <button onClick={() => setView('lead-hub')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Open Lead Hub</button>
                <button onClick={() => setView('canvasser-form')} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">+ New Homeowner</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'lead-hub' && <LeadHub addressSearch={addressSearch} handleAddressSearch={handleAddressSearch} addressSuggestions={addressSuggestions} handleAddressSelect={handleAddressSelect} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} customers={customers} coordinates={coordinates} setView={setView} />}
      
      {view === 'canvasser-form' && <CanvasserForm addCustomer={addCustomer} setSelectedCustomer={setSelectedCustomer} customers={customers} selectedAddress={selectedAddress} />}
      
      {view === 'my-leads' && <MyLeads customers={customers} currentUser={currentUser} />}

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Homeowner Created: {selectedCustomer.name}</h2>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-600 hover:text-gray-800 text-2xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><p className="text-sm text-gray-600">Name</p><p className="font-semibold text-gray-800">{selectedCustomer.name}</p></div>
              <div><p className="text-sm text-gray-600">Phone</p><p className="font-semibold text-gray-800">{selectedCustomer.phone || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-600">Email</p><p className="font-semibold text-gray-800">{selectedCustomer.email || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-600">Address</p><p className="font-semibold text-gray-800">{selectedCustomer.address}</p></div>
            </div>
            <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-6"><p className="text-green-800 font-semibold">✓ Homeowner added successfully!</p></div>
            <button onClick={() => setSelectedCustomer(null)} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const LeadHub = ({ addressSearch, handleAddressSearch, addressSuggestions, handleAddressSelect, selectedAddress, setSelectedAddress, customers, coordinates, setView }) => {
  const customersWithCoords = customers.filter(c => coordinates[c.id]);
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Lead Hub - Find Locations</h2>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search for Address</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="text" value={addressSearch} onChange={(e) => handleAddressSearch(e.target.value)} placeholder="Start typing an address..." className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:border-blue-600" />
          </div>
          {addressSuggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 shadow-lg">
              {addressSuggestions.map((suggestion, idx) => (
                <button key={idx} onClick={() => handleAddressSelect(suggestion)} className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0">
                  <p className="font-semibold text-gray-800">{suggestion.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-6">
          <p className="text-sm text-blue-800">{customersWithCoords.length} homeowners/customers found</p>
        </div>
        <div className="space-y-2">
          {customersWithCoords.map(customer => {
            const coord = coordinates[customer.id];
            return (
              <button key={customer.id} onClick={() => setSelectedAddress(customer.address)} className="w-full text-left p-4 border rounded-lg hover:bg-blue-50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><MapPin size={16} /> {coord.fullAddress}</p>
                    <p className="text-xs text-gray-500 mt-1">{customer.purchased ? '✓ Customer' : '• Homeowner'}</p>
                  </div>
                  <span className="text-blue-600 text-sm font-semibold">Select →</span>
                </div>
              </button>
            );
          })}
        </div>
        {selectedAddress && (
          <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-600 rounded">
            <p className="text-sm text-gray-600">Selected Address:</p>
            <p className="font-semibold text-gray-800 mt-1">{selectedAddress}</p>
            <button onClick={() => setView('canvasser-form')} className="mt-3 bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700">Create Lead for This Address</button>
          </div>
        )}
      </div>
    </div>
  );
};

const CanvasserForm = ({ addCustomer, setSelectedCustomer, customers, selectedAddress }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: selectedAddress || '', foundationType: '', sourceOfLead: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setFormData(prev => ({ ...prev, address: selectedAddress || prev.address }));
  }, [selectedAddress]);

  const handleSubmit = () => {
    if (!formData.name || !formData.address || !formData.foundationType) {
      alert('Please fill in: Name, Address, Foundation Type');
      return;
    }
    addCustomer(formData);
    const newCustomer = customers.find(c => c.name === formData.name);
    if (newCustomer) setSelectedCustomer(newCustomer);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', phone: '', email: '', address: '', foundationType: '', sourceOfLead: '', notes: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">New Homeowner Information</h2>
      {submitted && <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-600 text-green-800">✓ Homeowner added!</div>}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border rounded" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 border rounded" /></div>
        </div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-2">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 border rounded" /></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full p-3 border rounded" /></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-2">Foundation Type *</label><select value={formData.foundationType} onChange={(e) => setFormData({ ...formData, foundationType: e.target.value })} className="w-full p-3 border rounded"><option value="">Select...</option><option value="Concrete Slab">Concrete Slab</option><option value="Crawl Space">Crawl Space</option><option value="Basement">Basement</option><option value="Pilings">Pilings</option></select></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-2">How did they hear about us?</label><input type="text" value={formData.sourceOfLead} onChange={(e) => setFormData({ ...formData, sourceOfLead: e.target.value })} className="w-full p-3 border rounded" /></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-3 border rounded h-20" /></div>
        <button onClick={handleSubmit} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Submit</button>
      </div>
    </div>
  );
};

const MyLeads = ({ customers, currentUser }) => {
  const myLeads = customers.filter(c => c.createdBy === currentUser.name);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">My Leads</h2>
      {myLeads.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center text-gray-500">No leads yet</div>
      ) : (
        myLeads.map(customer => (
          <div key={customer.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{customer.name}</h3>
                <p className="text-sm text-gray-600">Phone: {customer.phone || 'N/A'}</p>
                <p className="text-sm text-gray-600">Address: {customer.address}</p>
                <p className="text-sm text-gray-600">Created: {customer.createdAt}</p>
              </div>
              <span className={`text-sm font-semibold ${customer.purchased ? 'text-green-600' : 'text-blue-600'}`}>
                {customer.purchased ? '✓ Customer' : '• Homeowner'}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const AdminDashboard = ({ view, setView, currentUser, handleLogout, customers, updateCustomer, editingId, setEditingId, customerPhotos, handlePhotoUpload, tasks, completeTask, coordinates }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Foundation CRM</h1>
          <p className="text-blue-100">Welcome, {currentUser.name} ({currentUser.role.replace('_', ' ')})</p>
        </div>
        <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
          <LogOut size={20} /> Logout
        </button>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {(currentUser.role === 'admin' || currentUser.role === 'sales_manager') && (
          <button onClick={() => setView('homeowners')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'homeowners' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>Homeowners</button>
        )}
        {(currentUser.role === 'admin' || currentUser.role === 'sales_manager') && (
          <button onClick={() => setView('customers')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'customers' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>Customers</button>
        )}
        {(currentUser.role === 'confirmation' || currentUser.role === 'admin') && (
          <button onClick={() => setView('tasks')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'tasks' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>Tasks ({tasks.filter(t => !t.completed).length})</button>
        )}
      </div>

      {view === 'homeowners' && <CustomerList customers={customers.filter(c => !c.purchased)} currentUser={currentUser} onUpdate={updateCustomer} setEditingId={setEditingId} editingId={editingId} photos={customerPhotos} onPhotoUpload={handlePhotoUpload} title="Homeowners" />}
      {view === 'customers' && <CustomerList customers={customers.filter(c => c.purchased)} currentUser={currentUser} onUpdate={updateCustomer} setEditingId={setEditingId} editingId={editingId} photos={customerPhotos} onPhotoUpload={handlePhotoUpload} title="Customers" />}
      {view === 'tasks' && <TaskList tasks={tasks} onCompleteTask={completeTask} />}
    </div>
  );
};

const CustomerList = ({ customers, currentUser, onUpdate, setEditingId, editingId, photos, onPhotoUpload, title }) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
    {customers.length === 0 ? (
      <div className="bg-white rounded-lg p-8 text-center text-gray-500">No {title.toLowerCase()} to display</div>
    ) : (
      customers.map(c => (
        <div key={c.id} className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{c.name}</h3>
              <p className="text-sm text-gray-600">Created: {c.createdAt}</p>
              {c.purchased && <p className="text-sm text-green-600 font-semibold">✓ Customer</p>}
              {!c.purchased && <p className="text-sm text-blue-600 font-semibold">• Homeowner</p>}
            </div>
            <button onClick={() => setEditingId(editingId === c.id ? null : c.id)} className="text-blue-600 hover:text-blue-800"><Edit2 size={20} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><p className="text-sm text-gray-600">Phone</p><p className="text-gray-800">{c.phone || '—'}</p></div>
            <div><p className="text-sm text-gray-600">Email</p><p className="text-gray-800">{c.email || '—'}</p></div>
            <div><p className="text-sm text-gray-600">Address</p><p className="text-gray-800">{c.address || '—'}</p></div>
            <div><p className="text-sm text-gray-600">Foundation</p><p className="text-gray-800">{c.foundationType || '—'}</p></div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-3">Photos</h4>
            {photos[c.id] && photos[c.id].length > 0 ? (
              <div className="grid grid-cols-2 gap-4">{photos[c.id].map(photo => (<div key={photo.id} className="border rounded overflow-hidden"><img src={photo.data} alt="Photo" className="w-full h-40 object-cover" /></div>))}</div>
            ) : (
              <p className="text-gray-500 text-sm">No photos</p>
            )}
          </div>
        </div>
      ))
    )}
  </div>
);

const TaskList = ({ tasks, onCompleteTask }) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold text-white mb-6">Pending Tasks</h2>
    {tasks.filter(t => !t.completed).length === 0 ? (
      <div className="bg-white rounded-lg p-8 text-center text-gray-500">All done!</div>
    ) : (
      tasks.filter(t => !t.completed).map(t => (
        <div key={t.id} className="bg-white rounded-lg shadow-lg p-6 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{t.description}</h3>
            <p className="text-sm text-gray-600 mt-2">Customer: {t.customerName}</p>
          </div>
          <button onClick={() => onCompleteTask(t.id)} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Check size={20} /> Complete</button>
        </div>
      ))
    )}
  </div>
);

export default App;

const handlePhotoUpload = (customerId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const photoData = e.target.result;
      if (!customerPhotos[customerId]) {
        setCustomerPhotos({ ...customerPhotos, [customerId]: [] });
      }
      setCustomerPhotos({
        ...customerPhotos,
        [customerId]: [
          ...(customerPhotos[customerId] || []),
          {
            id: Date.now(),
            data: photoData,
            uploadedBy: currentUser.name,
            uploadedAt: new Date().toLocaleString()
          }
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

  const canAccessCustomer = (customer) => {import React, { useState, useEffect } from 'react';
import { LogOut, Edit2, Check, MapPin } from 'lucide-react';
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
    { id: 1, name: 'Admin User', role: 'admin', password: 'admin' },
    { id: 2, name: 'Sales Manager', role: 'sales_manager', password: 'manager' },
    { id: 3, name: 'Sales Rep 1', role: 'sales_rep', password: 'rep' },
    { id: 4, name: 'Canvasser', role: 'canvasser', password: 'canvas' },
    { id: 5, name: 'Confirmation Team', role: 'confirmation', password: 'confirm' }
  ]);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ username: '', password: '', role: 'canvasser' });
  const [customerPhotos, setCustomerPhotos] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerCoordinates, setCustomerCoordinates] = useState({});

  useEffect(() => {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey);
      setSupabase(client);
      loadData(client);
    }
  }, []);

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

  const handleLogin = (username, password) => {
    const user = users.find(u => u.name === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      setView('dashboard');
      setLoginPassword('');
      setError('');
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
      password: registerData.password
    };

    setUsers([...users, newUser]);
    
    // Save to Supabase
    if (supabase) {
      try {
        await supabase.from('users').insert([newUser]);
      } catch (err) {
        console.log('User saved locally');
      }
    }

    setError('');
    setShowRegister(false);
    setRegisterData({ username: '', password: '', role: 'canvasser' });
    alert('Account created! You can now log in.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setLoginPassword('');
    setError('');
  };

  const handlePhotoUpload = (customerId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const photoData = e.target.result;
      if (!customerPhotos[customerId]) {
        setCustomerPhotos({ ...customerPhotos, [customerId]: [] });
      }
      setCustomerPhotos({
        ...customerPhotos,
        [customerId]: [
          ...(customerPhotos[customerId] || []),
          {
            id: Date.now(),
            data: photoData,
            uploadedBy: currentUser.name,
            uploadedAt: new Date().toLocaleString()
          }
        ]
      });
    };
    reader.readAsDataURL(file);
  };
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'sales_manager') return true;
    if (currentUser.role === 'confirmation') return true;
    return false;
  };

  const canEditField = (fieldName) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'canvasser') return ['name', 'address', 'foundationType', 'phone', 'email', 'sourceOfLead', 'notes'].includes(fieldName);
    if (currentUser.role === 'confirmation') return ['verified', 'inspectionScheduled', 'inspectionDate'];
    if (currentUser.role === 'sales_rep' || currentUser.role === 'sales_manager') return ['workStartDate', 'workEndDate', 'workNotes'];
    return false;
  };

  const addCustomer = async (formData) => {
    const newCustomer = {
      id: Date.now(),
      ...formData,
      createdBy: currentUser.name,
      createdAt: new Date().toLocaleString(),
      verified: false,
      inspectionScheduled: false,
      history: JSON.stringify([{
        timestamp: new Date().toLocaleString(),
        changedBy: currentUser.name,
        action: 'Customer created'
      }])
    };

    // Geocode the address
    const fullAddress = await geocodeAddress(formData.address, newCustomer.id);
    if (fullAddress) {
      newCustomer.address = fullAddress;
    }

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
  };

  const updateCustomer = async (customerId, field, value) => {
    const updated = customers.map(c => {
      if (c.id === customerId) {
        const history = JSON.parse(c.history || '[]');
        return {
          ...c,
          [field]: value,
          history: JSON.stringify([...history, {
            timestamp: new Date().toLocaleString(),
            changedBy: currentUser.name,
            field: field,
            oldValue: c[field],
            newValue: value
          }])
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
      t.id === taskId ? { ...t, completed: true, completedBy: currentUser.name, completedAt: new Date().toLocaleString() } : t
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

  if (view === 'login' && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-96">
          <h1 className="text-3xl font-bold text-center mb-2 text-blue-900">Foundation CRM</h1>
          <p className="text-center text-gray-600 mb-6 text-sm">Powered by Supabase & Vercel</p>

          {error && <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-600 text-red-800 text-sm">{error}</div>}

          {!showRegister ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={loginPassword.split('|')[0] || ''}
                  onChange={(e) => setLoginPassword(e.target.value + '|' + (loginPassword.split('|')[1] || ''))}
                  className="w-full p-2 border rounded mb-2"
                  placeholder="Enter username"
                />
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword.split('|')[1] || ''}
                  onChange={(e) => setLoginPassword((loginPassword.split('|')[0] || '') + '|' + e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin(loginPassword.split('|')[0], loginPassword.split('|')[1])}
                  className="w-full p-2 border rounded mb-3"
                  placeholder="Enter password"
                />
                <button
                  onClick={() => handleLogin(loginPassword.split('|')[0], loginPassword.split('|')[1])}
                  className="w-full bg-blue-600 text-white p-2 rounded font-semibold hover:bg-blue-700 mb-2"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setShowRegister(true);
                    setLoginPassword('');
                    setError('');
                  }}
                  className="w-full bg-green-600 text-white p-2 rounded font-semibold hover:bg-green-700"
                >
                  Create New Account
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  className="w-full p-2 border rounded mb-3"
                  placeholder="Choose a username"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full p-2 border rounded mb-3"
                  placeholder="Choose a password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={registerData.role}
                  onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                  className="w-full p-2 border rounded mb-3"
                >
                  <option value="admin">Admin</option>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="sales_rep">Sales Representative</option>
                  <option value="canvasser">Canvasser</option>
                  <option value="confirmation">Confirmation Team</option>
                </select>
              </div>
              <button
                onClick={handleRegister}
                className="w-full bg-green-600 text-white p-2 rounded font-semibold hover:bg-green-700 mb-2"
              >
                Create Account
              </button>
              <button
                onClick={() => {
                  setShowRegister(false);
                  setRegisterData({ username: '', password: '', role: 'canvasser' });
                  setError('');
                }}
                className="w-full bg-gray-400 text-white p-2 rounded font-semibold hover:bg-gray-500"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Foundation CRM</h1>
            <p className="text-blue-100">Welcome, {currentUser.name}</p>
          </div>
          <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
            <LogOut size={20} /> Logout
          </button>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          {currentUser.role === 'canvasser' && (
            <button onClick={() => setView('canvasser-form')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'canvasser-form' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>New Lead</button>
          )}
          {(currentUser.role === 'admin' || currentUser.role === 'sales_manager' || currentUser.role === 'sales_rep') && (
            <button onClick={() => setView('customers')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'customers' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>Customers</button>
          )}
          {(currentUser.role === 'admin' || currentUser.role === 'sales_manager') && (
            <button onClick={() => setView('map')} className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 ${view === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}><MapPin size={18} /> Customer Map</button>
          )}
          {(currentUser.role === 'confirmation' || currentUser.role === 'admin') && (
            <button onClick={() => setView('tasks')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'tasks' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>Tasks ({tasks.filter(t => !t.completed).length})</button>
          )}
          {currentUser.role === 'admin' && (
            <button onClick={() => setView('all-customers')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'all-customers' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900'}`}>All Customers</button>
          )}
        </div>

        {view === 'canvasser-form' && <CanvasserForm onSubmit={addCustomer} setSelectedCustomer={setSelectedCustomer} customers={customers} />}
        {view === 'customers' && <CustomerList customers={customers.filter(c => canAccessCustomer(c))} currentUser={currentUser} onUpdate={updateCustomer} canEditField={canEditField} setEditingId={setEditingId} editingId={editingId} photos={customerPhotos} onPhotoUpload={handlePhotoUpload} />}
        {view === 'all-customers' && <CustomerList customers={customers} currentUser={currentUser} onUpdate={updateCustomer} canEditField={canEditField} setEditingId={setEditingId} editingId={editingId} photos={customerPhotos} onPhotoUpload={handlePhotoUpload} />}
        {view === 'map' && <CustomerMap customers={customers} coordinates={customerCoordinates} />}
        {view === 'tasks' && <TaskList tasks={tasks} currentUser={currentUser} onCompleteTask={completeTask} />}

        {selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Lead Created: {selectedCustomer.name}</h2>
                <button onClick={() => setSelectedCustomer(null)} className="text-gray-600 hover:text-gray-800 text-2xl">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-800">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-800">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-800">{selectedCustomer.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-gray-800">{selectedCustomer.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Foundation Type</p>
                  <p className="font-semibold text-gray-800">{selectedCustomer.foundationType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">How They Heard About Us</p>
                  <p className="font-semibold text-gray-800">{selectedCustomer.sourceOfLead || 'Not specified'}</p>
                </div>
              </div>
              {selectedCustomer.notes && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-semibold text-gray-800">{selectedCustomer.notes}</p>
                </div>
              )}
              <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-6">
                <p className="text-green-800 font-semibold">✓ Lead submitted successfully!</p>
                <p className="text-sm text-green-700">The confirmation team has been notified.</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

const CanvasserForm = ({ onSubmit, setSelectedCustomer, customers }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', foundationType: '', sourceOfLead: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!formData.name || !formData.address || !formData.foundationType) {
      alert('Please fill in: Name, Address, Foundation Type');
      return;
    }
    onSubmit(formData);
    
    // Find the newly created customer and display it
    const newCustomer = customers.find(c => c.name === formData.name && c.address === formData.address);
    if (newCustomer) {
      setSelectedCustomer(newCustomer);
    }
    
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', phone: '', email: '', address: '', foundationType: '', sourceOfLead: '', notes: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">New Lead Entry</h2>
      {submitted && <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-600 text-green-800">✓ Lead submitted!</div>}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 border rounded" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
          <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full p-3 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Foundation Type *</label>
          <select value={formData.foundationType} onChange={(e) => setFormData({ ...formData, foundationType: e.target.value })} className="w-full p-3 border rounded">
            <option value="">Select...</option>
            <option value="Concrete Slab">Concrete Slab</option>
            <option value="Crawl Space">Crawl Space</option>
            <option value="Basement">Basement</option>
            <option value="Pilings">Pilings</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">How did they hear about us?</label>
          <input type="text" value={formData.sourceOfLead} onChange={(e) => setFormData({ ...formData, sourceOfLead: e.target.value })} className="w-full p-3 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
          <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-3 border rounded h-20" />
        </div>
        <button onClick={handleSubmit} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Submit Lead</button>
      </div>
    </div>
  );
};

const CustomerList = ({ customers, currentUser, onUpdate, canEditField, setEditingId, editingId, photos, onPhotoUpload }) => (
  <div className="space-y-4">
    {customers.length === 0 ? (
      <div className="bg-white rounded-lg p-8 text-center text-gray-500">No customers</div>
    ) : (
      customers.map(c => (
        <div key={c.id} className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{c.name}</h3>
              <p className="text-sm text-gray-600">Created: {c.createdAt}</p>
            </div>
            <button onClick={() => setEditingId(editingId === c.id ? null : c.id)} className="text-blue-600 hover:text-blue-800">
              <Edit2 size={20} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <EditableField label="Phone" value={c.phone} editable={canEditField('phone') && editingId === c.id} onSave={(v) => onUpdate(c.id, 'phone', v)} />
            <EditableField label="Email" value={c.email} editable={canEditField('email') && editingId === c.id} onSave={(v) => onUpdate(c.id, 'email', v)} />
            <EditableField label="Address" value={c.address} editable={canEditField('address') && editingId === c.id} onSave={(v) => onUpdate(c.id, 'address', v)} />
            <EditableField label="Foundation Type" value={c.foundationType} editable={canEditField('foundationType') && editingId === c.id} onSave={(v) => onUpdate(c.id, 'foundationType', v)} />
          </div>
          {currentUser.role !== 'canvasser' && (
            <div className="border-t pt-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">Status</h4>
              <div className="grid grid-cols-2 gap-4">
                <CheckField label="Verified" value={c.verified} editable={canEditField('verified') && editingId === c.id} onSave={(v) => onUpdate(c.id, 'verified', v)} />
                <CheckField label="Inspection Scheduled" value={c.inspectionScheduled} editable={canEditField('inspectionScheduled') && editingId === c.id} onSave={(v) => onUpdate(c.id, 'inspectionScheduled', v)} />
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-3">Photos</h4>
            <div className="mb-4">
              <label className="block">
                <span className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 inline-block">
                  + Add Photo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      onPhotoUpload(c.id, e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            {photos[c.id] && photos[c.id].length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {photos[c.id].map(photo => (
                  <div key={photo.id} className="border rounded-lg overflow-hidden">
                    <img src={photo.data} alt="Customer" className="w-full h-40 object-cover" />
                    <div className="p-2 bg-gray-50 text-xs text-gray-600">
                      <p>By: {photo.uploadedBy}</p>
                      <p>{photo.uploadedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No photos yet</p>
            )}
          </div>
        </div>
      ))
    )}
  </div>
);

const EditableField = ({ label, value, editable, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  useEffect(() => setEditValue(value || ''), [value]);

  if (isEditing && editable) {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
        <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full p-2 border border-blue-500 rounded text-sm" />
        <div className="flex gap-2 mt-1">
          <button onClick={() => { onSave(editValue); setIsEditing(false); }} className="text-green-600 text-sm font-semibold">Save</button>
          <button onClick={() => setIsEditing(false)} className="text-gray-600 text-sm">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <p className="text-gray-800">{value || '—'}</p>
      {editable && <button onClick={() => setIsEditing(true)} className="text-blue-600 text-sm mt-1">Edit</button>}
    </div>
  );
};

const CheckField = ({ label, value, editable, onSave }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <input type="checkbox" checked={value || false} onChange={(e) => onSave(e.target.checked)} disabled={!editable} className="w-5 h-5" />
  </div>
);

const TaskList = ({ tasks, currentUser, onCompleteTask }) => (
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
            <p className="text-sm text-gray-600">Due: {t.dueDate}</p>
          </div>
          <button onClick={() => onCompleteTask(t.id)} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 ml-4">
            <Check size={20} /> Complete
          </button>
        </div>
      ))
    )}
  </div>
);

const CustomerMap = ({ customers, coordinates }) => {
  const customersWithCoords = customers.filter(c => coordinates[c.id]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Customer Locations</h2>
      
      {customersWithCoords.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No customers with mapped locations yet. Add customers to see them on the map.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
            <p className="text-sm text-blue-800">
              {customersWithCoords.length} customer{customersWithCoords.length !== 1 ? 's' : ''} mapped
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {customersWithCoords.map(customer => {
              const coord = coordinates[customer.id];
              const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(coord.fullAddress)}/@${coord.lat},${coord.lng},15z`;
              
              return (
                <a
                  key={customer.id}
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 border rounded-lg hover:bg-blue-50 transition block"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin size={16} /> {coord.fullAddress}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Coordinates: {coord.lat.toFixed(4)}, {coord.lng.toFixed(4)}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                      Open in Maps →
                    </button>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold mb-2">View on Google Maps:</p>
            <div className="space-y-2">
              {customersWithCoords.map(customer => {
                const coord = coordinates[customer.id];
                const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(coord.fullAddress)}/@${coord.lat},${coord.lng},15z`;
                
                return (
                  <a
                    key={customer.id}
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm block"
                  >
                    • {customer.name} - {coord.fullAddress}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { LogOut, Edit2, Check, AlertCircle } from 'lucide-react';
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
  const [selectedUser, setSelectedUser] = useState(null);

  const users = [
    { id: 1, name: 'Admin User', role: 'admin', password: 'admin' },
    { id: 2, name: 'Sales Manager', role: 'sales_manager', password: 'manager' },
    { id: 3, name: 'Sales Rep 1', role: 'sales_rep', password: 'rep', managerId: 2 },
    { id: 4, name: 'Canvasser', role: 'canvasser', password: 'canvas' },
    { id: 5, name: 'Confirmation Team', role: 'confirmation', password: 'confirm' }
  ];

  // Initialize Supabase
  useEffect(() => {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey);
      setSupabase(client);
      loadData(client);
    } else {
      setError('Supabase credentials not configured. Using demo mode.');
    }
  }, []);

  const loadData = async (client) => {
    try {
      const [customersRes, tasksRes] = await Promise.all([
        client.from('customers').select('*'),
        client.from('tasks').select('*')
      ]);

      if (customersRes.error) throw customersRes.error;
      if (tasksRes.error) throw tasksRes.error;

      setCustomers(customersRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (err) {
      console.log('Demo mode - using local data only');
    }
  };

  const handleLogin = (user) => {
    if (loginPassword === user.password) {
      setCurrentUser(user);
      setView('dashboard');
      setLoginPassword('');
      setError('');
    } else {
      setError('Wrong password');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setLoginPassword('');
    setSelectedUser(null);
  };

  const canAccessCustomer = (customer) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'sales_manager') return true;
    if (currentUser.role === 'sales_rep') return customer.assignedRepId === currentUser.id;
    if (currentUser.role === 'confirmation') return true;
    return false;
  };

  const canEditField = (fieldName) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'canvasser') return ['name', 'address', 'foundationType', 'phone', 'email', 'sourceOfLead', 'notes'].includes(fieldName);
    if (currentUser.role === 'confirmation') return ['verified', 'inspectionScheduled', 'inspectionDate'];
    if (currentUser.role === 'sales_rep') return ['workStartDate', 'workEndDate', 'workNotes'];
    if (currentUser.role === 'sales_manager') return ['workStartDate', 'workEndDate', 'workNotes'];
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

    if (supabase) {
      try {
        await supabase.from('customers').insert([newCustomer]);
      } catch (err) {
        console.log('Saving to local storage');
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
        console.log('Saving task to local storage');
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

  // LOGIN SCREEN
  if (view === 'login' && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-96">
          <h1 className="text-3xl font-bold text-center mb-2 text-blue-900">Foundation CRM</h1>
          <p className="text-center text-gray-600 mb-6 text-sm">Powered by Supabase & Vercel</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-600 text-red-800 text-sm flex gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">Select a user to log in:</p>
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-3 rounded border-2 transition text-left ${
                  selectedUser?.id === user.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <div className="font-semibold">{user.name}</div>
                <div className="text-sm text-gray-600 capitalize">{user.role.replace('_', ' ')}</div>
              </button>
            ))}

            {selectedUser && (
              <div className="mt-6 pt-4 border-t">
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin(selectedUser)}
                  className="w-full p-2 border rounded mb-3"
                />
                <button
                  onClick={() => handleLogin(selectedUser)}
                  className="w-full bg-blue-600 text-white p-2 rounded font-semibold hover:bg-blue-700"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  if (currentUser) {
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
          {currentUser.role === 'canvasser' && (
            <NavButton active={view === 'canvasser-form'} onClick={() => setView('canvasser-form')}>New Lead</NavButton>
          )}
          {(currentUser.role === 'admin' || currentUser.role === 'sales_manager' || currentUser.role === 'sales_rep') && (
            <NavButton active={view === 'customers'} onClick={() => setView('customers')}>Customers</NavButton>
          )}
          {(currentUser.role === 'confirmation' || currentUser.role === 'admin') && (
            <NavButton active={view === 'tasks'} onClick={() => setView('tasks')}>Tasks ({tasks.filter(t => !t.completed).length})</NavButton>
          )}
          {currentUser.role === 'admin' && (
            <NavButton active={view === 'all-customers'} onClick={() => setView('all-customers')}>All Customers</NavButton>
          )}
        </div>

        {view === 'canvasser-form' && <CanvasserForm onSubmit={addCustomer} />}
        {view === 'customers' && <CustomerList customers={customers.filter(c => canAccessCustomer(c))} currentUser={currentUser} onUpdate={updateCustomer} canEditField={canEditField} setEditingId={setEditingId} editingId={editingId} />}
        {view === 'all-customers' && <CustomerList customers={customers} currentUser={currentUser} onUpdate={updateCustomer} canEditField={canEditField} setEditingId={setEditingId} editingId={editingId} />}
        {view === 'tasks' && <TaskList tasks={tasks} currentUser={currentUser} onCompleteTask={completeTask} customers={customers} />}
      </div>
    );
  }

  return null;
};

const NavButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 rounded-lg font-semibold transition ${active ? 'bg-blue-600 text-white' : 'bg-white text-blue-900 hover:bg-blue-50'}`}
  >
    {children}
  </button>
);

const CanvasserForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', foundationType: '', sourceOfLead: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!formData.name || !formData.address || !formData.foundationType) {
      alert('Please fill in: Name, Address, Foundation Type');
      return;
    }
    onSubmit(formData);
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
          <InputField label="Name *" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <InputField label="Phone" name="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <InputField label="Email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        <InputField label="Address *" name="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
        <SelectField label="Foundation Type *" value={formData.foundationType} onChange={(e) => setFormData({ ...formData, foundationType: e.target.value })} options={['', 'Concrete Slab', 'Crawl Space', 'Basement', 'Pilings']} />
        <InputField label="How did they hear about us?" name="sourceOfLead" value={formData.sourceOfLead} onChange={(e) => setFormData({ ...formData, sourceOfLead: e.target.value })} />
        <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-3 border rounded h-20" placeholder="Additional notes" />
        <button onClick={handleSubmit} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Submit Lead</button>
      </div>
    </div>
  );
};

const InputField = ({ label, type = 'text', ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <input type={type} className="w-full p-3 border rounded focus:outline-none focus:border-blue-600" {...props} />
  </div>
);

const SelectField = ({ label, options, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <select className="w-full p-3 border rounded focus:outline-none focus:border-blue-600" {...props}>
      {options.map((opt, i) => <option key={i} value={opt}>{opt || 'Select...'}</option>)}
    </select>
  </div>
);

const CustomerList = ({ customers, currentUser, onUpdate, canEditField, setEditingId, editingId }) => (
  <div className="space-y-4">
    {customers.length === 0 ? <div className="bg-white rounded-lg p-8 text-center text-gray-500">No customers</div> : customers.map(c => <CustomerCard key={c.id} customer={c} currentUser={currentUser} onUpdate={onUpdate} canEditField={canEditField} editing={editingId === c.id} setEditing={() => setEditingId(editingId === c.id ? null : c.id)} />)}
  </div>
);

const CustomerCard = ({ customer, currentUser, onUpdate, canEditField, editing, setEditing }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <div className="flex justify-between items-start mb-4">
      <div><h3 className="text-2xl font-bold text-gray-800">{customer.name}</h3><p className="text-sm text-gray-600">Created: {customer.createdAt}</p></div>
      <button onClick={setEditing} className="text-blue-600 hover:text-blue-800"><Edit2 size={20} /></button>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-6">
      <EditableField label="Phone" value={customer.phone} editable={canEditField('phone') && editing} onSave={(v) => onUpdate(customer.id, 'phone', v)} />
      <EditableField label="Email" value={customer.email} editable={canEditField('email') && editing} onSave={(v) => onUpdate(customer.id, 'email', v)} />
      <EditableField label="Address" value={customer.address} editable={canEditField('address') && editing} onSave={(v) => onUpdate(customer.id, 'address', v)} />
      <EditableField label="Foundation Type" value={customer.foundationType} editable={canEditField('foundationType') && editing} onSave={(v) => onUpdate(customer.id, 'foundationType', v)} />
    </div>
    {currentUser.role !== 'canvasser' && (
      <div className="border-t pt-4">
        <h4 className="font-semibold text-gray-800 mb-3">Status</h4>
        <div className="grid grid-cols-2 gap-4">
          <CheckField label="Verified" value={customer.verified} editable={canEditField('verified') && editing} onSave={(v) => onUpdate(customer.id, 'verified', v)} />
          <CheckField label="Inspection Scheduled" value={customer.inspectionScheduled} editable={canEditField('inspectionScheduled') && editing} onSave={(v) => onUpdate(customer.id, 'inspectionScheduled', v)} />
        </div>
      </div>
    )}
  </div>
);

const EditableField = ({ label, value, editable, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => setEditValue(value), [value]);

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
    <input type="checkbox" checked={value} onChange={(e) => onSave(e.target.checked)} disabled={!editable} className="w-5 h-5" />
  </div>
);

const TaskList = ({ tasks, currentUser, onCompleteTask, customers }) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold text-white mb-6">Pending Tasks</h2>
    {tasks.filter(t => !t.completed).length === 0 ? <div className="bg-white rounded-lg p-8 text-center text-gray-500">All done!</div> : tasks.filter(t => !t.completed).map(t => (
      <div key={t.id} className="bg-white rounded-lg shadow-lg p-6 flex justify-between items-start">
        <div><h3 className="text-xl font-bold text-gray-800">{t.description}</h3><p className="text-sm text-gray-600 mt-2">Customer: {t.customerName}</p><p className="text-sm text-gray-600">Due: {t.dueDate}</p></div>
        <button onClick={() => onCompleteTask(t.id)} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 ml-4"><Check size={20} /> Complete</button>
      </div>
    ))}
  </div>
);

export default App;
  </div>
);

export default App;

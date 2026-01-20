// FIXES APPLIED:
// 1. Removed mock address code from handleAddressSearch
// 2. Removed duplicate geocoding code
// 3. Added 'addCustomer' prop to CanvasserForm
// 4. Added Team messaging feature
// 5. Added navigation menu with Dashboard, New Homeowner, Lead Hub, Team buttons

// Add this to your state in the App component (around line 52):
const [messages, setMessages] = useState([]);
const [channels, setChannels] = useState([
  { id: 1, name: 'Everyone', members: 'all', messages: [] }
]);

// Replace the handleAddressSearch function (around line 139):
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

// Replace the geocodeAddress function (around line 230):
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

// Fix the CanvasserForm call (around line 770):
{view === 'canvasser-form' && (
  <CanvasserForm 
    addCustomer={addCustomer}  // <-- ADD THIS LINE
    selectedAddress={selectedAddress}
    handleAddressSearch={handleAddressSearch}
    addressSuggestions={addressSuggestions}
    handleAddressSelect={handleAddressSelect}
  />
)}

// Update the navigation buttons (around line 730):
<div className="flex overflow-x-auto px-4 pb-2 gap-2">
  <button 
    onClick={() => setView('canvasser-dashboard')} 
    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${view === 'canvasser-dashboard' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
  >
    Dashboard
  </button>
  <button 
    onClick={() => setView('canvasser-form')} 
    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${view === 'canvasser-form' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
  >
    New Homeowner
  </button>
  <button 
    onClick={() => setView('lead-hub')} 
    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${view === 'lead-hub' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
  >
    Lead Hub
  </button>
  <button 
    onClick={() => setView('my-leads')} 
    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${view === 'my-leads' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
  >
    My Leads ({myLeads.length})
  </button>
  <button 
    onClick={() => setView('team')} 
    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm ${view === 'team' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
  >
    Team
  </button>
</div>

// Add Team view handler (around line 800):
{view === 'team' && (
  <TeamMessaging 
    currentUser={currentUser}
    users={users}
    channels={channels}
    setChannels={setChannels}
  />
)}

// ADD THIS NEW COMPONENT at the end of your file (before export default App):

const TeamMessaging = ({ currentUser, users, channels, setChannels }) => {
  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [messageText, setMessageText] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChannel?.messages]);

  const sendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: messageText,
      sender: currentUser.name,
      timestamp: new Date().toISOString()
    };

    const updatedChannels = channels.map(ch => 
      ch.id === activeChannel.id 
        ? { ...ch, messages: [...ch.messages, newMessage] }
        : ch
    );

    setChannels(updatedChannels);
    setActiveChannel({
      ...activeChannel,
      messages: [...activeChannel.messages, newMessage]
    });
    setMessageText('');
  };

  const createChannel = () => {
    if (!newChannelName.trim() || selectedMembers.length === 0) {
      alert('Please enter channel name and select members');
      return;
    }

    const newChannel = {
      id: Date.now(),
      name: newChannelName,
      members: [currentUser.name, ...selectedMembers],
      messages: []
    };

    setChannels([...channels, newChannel]);
    setShowNewChannel(false);
    setNewChannelName('');
    setSelectedMembers([]);
    setActiveChannel(newChannel);
  };

  const toggleMember = (userName) => {
    if (selectedMembers.includes(userName)) {
      setSelectedMembers(selectedMembers.filter(m => m !== userName));
    } else {
      setSelectedMembers([...selectedMembers, userName]);
    }
  };

  const canAccessChannel = (channel) => {
    if (channel.members === 'all') return true;
    return channel.members.includes(currentUser.name);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="grid grid-cols-12 h-full">
        {/* Channel List */}
        <div className="col-span-12 md:col-span-3 border-r border-gray-200 bg-gray-50">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Channels</h2>
            <button
              onClick={() => setShowNewChannel(true)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              + New Channel
            </button>
          </div>

          <div className="overflow-y-auto" style={{ height: 'calc(100% - 120px)' }}>
            {channels.filter(canAccessChannel).map(channel => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-100 transition ${
                  activeChannel.id === channel.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="font-semibold text-gray-800">{channel.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {channel.members === 'all' ? 'Everyone' : `${channel.members.length} members`}
                </div>
                {channel.messages.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1 truncate">
                    {channel.messages[channel.messages.length - 1].text}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="col-span-12 md:col-span-9 flex flex-col">
          {/* Channel Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="text-xl font-bold text-gray-800">{activeChannel.name}</h3>
            <p className="text-sm text-gray-500">
              {activeChannel.members === 'all' 
                ? 'All team members' 
                : `${activeChannel.members.join(', ')}`
              }
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {activeChannel.messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              activeChannel.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === currentUser.name ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                      msg.sender === currentUser.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {msg.sender !== currentUser.name && (
                      <div className="text-xs font-semibold mb-1 text-blue-600">{msg.sender}</div>
                    )}
                    <div>{msg.text}</div>
                    <div className={`text-xs mt-1 ${msg.sender === currentUser.name ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Channel Modal */}
      {showNewChannel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Create New Channel</h3>
              <button onClick={() => setShowNewChannel(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Channel Name</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g., Sales Team, Project Updates"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Add Members</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.filter(u => u.name !== currentUser.name).map(user => (
                    <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(user.name)}
                        onChange={() => toggleMember(user.name)}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-800">{user.name}</span>
                      <span className="text-xs text-gray-500">({user.role.replace('_', ' ')})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createChannel}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Create Channel
                </button>
                <button
                  onClick={() => setShowNewChannel(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

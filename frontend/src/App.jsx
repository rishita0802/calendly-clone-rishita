import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = "http://localhost:3001/api";

function App() {
  const [view, setView] = useState('dashboard');
  const [eventTypes, setEventTypes] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookingSummary, setBookingSummary] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeSettingsId, setActiveSettingsId] = useState(null);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newEvent, setNewEvent] = useState({ title: '', duration: 30, bufferTime: 0 });
  const [userInputs, setUserInputs] = useState({
    name: '', email: '', comments: '',
    date: new Date().toISOString().split('T')[0],
    time: null
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [ev, bk] = await Promise.all([
        axios.get(`${API}/event-types`),
        axios.get(`${API}/bookings`)
      ]);
      setEventTypes(ev.data || []);
      setAllBookings(bk.data || []);
    } catch (e) { console.error("Fetch Error", e); }
  };

  // ✅ FIXED: Reschedule and Normal Booking opening
 const openBookingPage = (event) => {
  console.log("Selected Event Data:", event);
  setSelectedEvent(event);
  // ✅ Reset inputs taaki naya form fresh khule
  setUserInputs(prev => ({ 
    ...prev, 
    time: null, 
    comments: '',
    name: prev.name || '', 
    email: prev.email || '' 
  }));
};

  const getAvailableSlots = () => {
  if (!selectedEvent || !selectedEvent.availability) return [];

  const dateStr = userInputs.date;
  const day = new Date(dateStr).getDay();

  // 1. Check if user has set availability for this day
  const config = selectedEvent.availability.find(a => a.dayOfWeek === day);
  if (!config) return []; 

  const slots = [];
  const duration = parseInt(selectedEvent.duration) || 30;
  // Buffer schema ke according (afterBuffer ya bufferTime)
  const buffer = parseInt(selectedEvent.afterBuffer || selectedEvent.bufferTime || 0);
  
  // Slots ke beech ka gap (usually hum 30 mins rakhte hain taaki grid sundar lage)
  const interval = 30; 

  let curr = new Date(`${dateStr}T${config.startTime}:00`);
  const end = new Date(`${dateStr}T${config.endTime}:00`);

  while (curr < end) {
    const timeStr = curr.toTimeString().substring(0, 5);
    const slotStart = new Date(curr);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    const isBooked = allBookings.some(b => {
      // Reschedule logic: ignore the current booking being changed
      if (rescheduleId && String(b.id) === String(rescheduleId)) return false;

      const existingStart = new Date(b.startTime);
      // Existing meeting kab khatam ho rahi hai + uska buffer time
      const existingEndWithBuffer = new Date(existingStart.getTime() + (duration + buffer) * 60000);

      // Check for overlap: Agar naya slot purani meeting ya uske buffer ke beech gir raha hai
      return (slotStart < existingEndWithBuffer && slotEnd > existingStart);
    });

    if (!isBooked) {
      slots.push(timeStr);
    }

    // Agla slot check karne ke liye interval badhao
    curr.setMinutes(curr.getMinutes() + interval);
  }
  return slots;
};

  if (bookingSummary) return (
    <div style={centerS}><div style={card}>
      <h2 style={{color:'green'}}>✓ {rescheduleId ? 'Rescheduled' : 'Confirmed'}</h2>
      <p><strong>{bookingSummary.eventType?.title}</strong></p>
      <p>{new Date(bookingSummary.startTime).toLocaleString()}</p>
      {bookingSummary.customAnswers && <p><em>Note: {bookingSummary.customAnswers}</em></p>}
      <button onClick={() => { setBookingSummary(null); setSelectedEvent(null); setView('dashboard'); setRescheduleId(null); fetchData(); }} style={btnP}>Done</button>
    </div></div>
  );

  return (
    <div style={{fontFamily:'sans-serif', background:'#f4f7f9', minHeight:'100vh'}}>
      <nav className="navbar-container" style={navS}>
        <h2 onClick={() => {setSelectedEvent(null); setView('dashboard')}} style={{color:'#006bff', cursor:'pointer'}}>Calendly</h2>
        <div>
          <button onClick={() => setView('dashboard')} style={navB(view==='dashboard')}>Events</button>
          <button onClick={() => setView('meetings')} style={navB(view==='meetings')}>Meetings</button>
        </div>
      </nav>

      <div style={{maxWidth:'1000px', margin:'auto', padding:'20px'}}>
       {view === 'dashboard' && !selectedEvent && (
  <div>
    {/* Header with New Event Button */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h2>Event Types</h2>
      <button 
        onClick={() => setShowCreateModal(true)} 
        style={{ ...btnP, padding: '10px 20px' }}
      >
        + New Event Type
      </button>
    </div>

    {/* Event Grid */}
    <div className="dashboard-grid" style={gridS}>
      {eventTypes.map(e => (
        <div key={e.id} style={itemS}>
          <div 
        onClick={async (event) => {
          event.stopPropagation(); 
          if(window.confirm("Delete this event type?")) {
            try {
              await axios.delete(`${API}/event-types/${e.id}`);
              fetchData();
            } catch(err) { alert("Delete failed!"); }
          }
        }}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '5px',
          zIndex: 10 // Taki baaki cheezon ke upar dikhe
        }}
      >
        🗑️
      </div>
          <h3>{e.title}</h3>
          <p>{e.duration}m duration</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => openBookingPage(e)} style={btnP}>View</button>
            <button onClick={() => setActiveSettingsId(activeSettingsId === e.id ? null : e.id)} style={btnS}>⚙️ Settings</button>
            <button onClick={() => setEditingEvent(e)} style={btnS}>✏️ Edit</button>
          </div>
          
          {activeSettingsId === e.id && (
            <div style={settingsS}>
              <div style={{display:'flex', gap:'5px', marginBottom:'10px'}}>
                <input type="time" id={`s-${e.id}`} defaultValue="09:00" style={inpS}/>
                <input type="time" id={`e-${e.id}`} defaultValue="17:00" style={inpS}/>
              </div>
              <button onClick={async () => {
                const sVal = document.getElementById(`s-${e.id}`).value;
                const eVal = document.getElementById(`e-${e.id}`).value;
                for(let i=1; i<=5; i++) await axios.post(`${API}/availability`, { eventTypeId: e.id, startTime: sVal, endTime: eVal, dayOfWeek: i });
                alert("Saved!"); setActiveSettingsId(null); fetchData();
              }} style={{...btnP, width:'100%'}}>Save Hours</button>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}

       {selectedEvent && (
  <div style={bookingGrid}>
    {/* Left Sidebar */}
    <div style={sideS}>
      <button 
        onClick={() => { setSelectedEvent(null); setRescheduleId(null); }} 
        style={{ ...btnS, marginBottom: '20px' }}
      >
        ← Back
      </button>
      <h3>{selectedEvent.title}</h3>
      <p>🕒 {selectedEvent.duration} min</p>
      {rescheduleId && (
        <p style={{ color: 'orange', fontWeight: 'bold' }}>
          Rescheduling Meeting...
        </p>
      )}
    </div>

    {/* Right Content Area */}
    <div style={{ padding: '20px', flex: 1 }}>
      <label>Select Date:</label>
      <input 
        type="date" 
        value={userInputs.date} 
        onChange={e => setUserInputs({ ...userInputs, date: e.target.value })} 
        style={inpS} 
      />

      <label>Available Slots:</label>
      <div style={slotGridS}>
        <>
          {getAvailableSlots().map(t => (
            <button
              key={t}
              onClick={() => setUserInputs({ ...userInputs, time: t })}
              style={slotB(userInputs.time === t)}
            >
              {t}
            </button>
          ))}

          {getAvailableSlots().length === 0 && (
            <p style={{ color: 'red', width: '100%' }}>
              No available slots for this date. Try another date or check settings.
            </p>
          )}
        </>
      </div>

      {/* Booking Form - Only shows when a time is selected */}
      {userInputs.time && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h4>Enter Details</h4>
          <input
            placeholder="Your Name"
            value={userInputs.name}
            onChange={e => setUserInputs({ ...userInputs, name: e.target.value })}
            style={inpS}
          />
          <input
            placeholder="Your Email"
            value={userInputs.email}
            onChange={e => setUserInputs({ ...userInputs, email: e.target.value })}
            style={inpS}
          />
          <textarea
            placeholder="Anything else? (Review/Notes)"
            value={userInputs.comments}
            onChange={e => setUserInputs({ ...userInputs, comments: e.target.value })}
            style={{ ...inpS, height: '80px', resize: 'none' }}
          />

          <button
            onClick={async () => {
              try {
                const res = await axios.post(`${API}/bookings`, {
                  eventTypeId: selectedEvent.id,
                  inviteeName: userInputs.name,
                  inviteeEmail: userInputs.email,
                  customAnswers: userInputs.comments,
                  startTime: `${userInputs.date}T${userInputs.time}:00`,
                  duration: selectedEvent.duration,
                  rescheduleId: rescheduleId
                });


                setBookingSummary(res.data);
                setRescheduleId(null);
                fetchData();
              } catch (err) {
                console.error("Booking failed:", err);
                alert("Could not complete booking. Please try again.");
              }
            }}
            style={{ ...btnP, width: '100%', marginTop: '10px' }}
          >
            {rescheduleId ? 'Confirm Reschedule' : 'Confirm Booking'}
          </button>
        </div>
      )}
    </div>
  </div>
)}

        {view === 'meetings' && (
  <div>
    <h2>Meetings</h2>
    
    {/* --- Upcoming Section --- */}
    <h3 style={{marginTop: '30px', color: '#006bff'}}>📅 Upcoming Meetings</h3>
    {allBookings.filter(m => new Date(m.startTime) >= new Date()).length > 0 ? (
      allBookings
        .filter(m => new Date(m.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)) // Jaldi hone wali pehle
        .map(m => (
          <div key={m.id} style={{...itemS, borderLeft: '5px solid #006bff'}}>
            <strong>{m.eventType?.title}</strong> - {m.inviteeName}
            <br/><small>{new Date(m.startTime).toLocaleString()}</small>
            {m.customAnswers && <p style={{fontSize:'12px', color:'#666'}}>Note: {m.customAnswers}</p>}
            
            <div style={{marginTop:'10px'}}>
              <button onClick={() => { setRescheduleId(m.id); openBookingPage(m.eventType); }} style={btnS}>Reschedule</button>
              <button onClick={async () => { if(window.confirm("Cancel?")) { await axios.delete(`${API}/bookings/${m.id}`); fetchData(); } }} style={btnD}>Cancel</button>
            </div>
          </div>
        ))
    ) : <p style={{color:'#888', marginLeft: '10px'}}>No upcoming meetings.</p>}

    {/* --- Past Section --- */}
    <h3 style={{marginTop: '50px', color: '#666'}}>⌛ Past Meetings</h3>
    {allBookings.filter(m => new Date(m.startTime) < new Date()).length > 0 ? (
      allBookings
        .filter(m => new Date(m.startTime) < new Date())
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)) // Recent past pehle
        .map(m => (
          <div key={m.id} style={{...itemS, opacity: 0.7, borderLeft: '5px solid #ccc', background: '#f9f9f9'}}>
            <strong>{m.eventType?.title}</strong> - {m.inviteeName}
            <br/><small>{new Date(m.startTime).toLocaleString()}</small>
            {m.customAnswers && <p style={{fontSize:'12px', color:'#666'}}>Note: {m.customAnswers}</p>}
            
            <div style={{marginTop:'10px'}}>
              {/* Past meetings mein reschedule/cancel ki zarurat nahi hoti */}
              <span style={{color:'#888', fontSize:'14px'}}>Meeting Completed</span>
            </div>
          </div>
        ))
    ) : <p style={{color:'#888', marginLeft: '10px'}}>No past meetings found.</p>}
  </div>
)}

        {/* ✅ EDIT EVENT MODAL */}
{editingEvent && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    background: 'rgba(0,0,0,0.5)', display: 'flex', 
    justifyContent: 'center', alignItems: 'center', zIndex: 1000
  }}>
    <div style={{ ...card, minWidth: '350px' }}>
      <h3>Edit Event Type</h3>
      
      <label style={{textAlign: 'left', display: 'block'}}>Title:</label>
      <input 
        value={editingEvent.title} 
        onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} 
        style={inpS} 
      />

      <label style={{textAlign: 'left', display: 'block', marginTop: '10px'}}>Duration (min):</label>
      <input 
        type="number"
        value={editingEvent.duration} 
        onChange={e => setEditingEvent({...editingEvent, duration: e.target.value})} 
        style={inpS} 
      />

      <label style={{textAlign: 'left', display: 'block', marginTop: '10px'}}>After Buffer (min):</label>
      <input 
        type="number"
        placeholder="e.g. 15"
        value={editingEvent.afterBuffer || 0} 
        onChange={e => setEditingEvent({...editingEvent, afterBuffer: e.target.value})} 
        style={inpS} 
      />

      <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
        <button 
          onClick={async () => {
            try {
              // Yahan logic direct hai, kisi saveEdit function ki zarurat nahi
              await axios.put(`${API}/event-types/${editingEvent.id}`, {
                title: editingEvent.title,
                duration: parseInt(editingEvent.duration),
                afterBuffer: parseInt(editingEvent.afterBuffer || 0)
              });
              setEditingEvent(null);
              fetchData();
              alert("Updated successfully!");
            } catch (err) {
              console.error(err);
              alert("Update failed!");
            }
          }} 
          style={{...btnP, flex: 1}}
        >
          Update
        </button>
        
        <button onClick={() => setEditingEvent(null)} style={{...btnS, flex: 1}}>Cancel</button>
      </div>
    </div>
  </div>
)}
{/* ✅ CREATE MODAL - Iske bina click karne pe kuch nahi dikhega */}
{showCreateModal && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    background: 'rgba(0,0,0,0.5)', display: 'flex', 
    justifyContent: 'center', alignItems: 'center', zIndex: 2000
  }}>
    <div style={{ ...card, minWidth: '350px', textAlign: 'left' }}>
      <h3 style={{marginTop: 0}}>Create New Event Type</h3>
      
      <label style={{fontWeight:'bold', fontSize:'14px'}}>Event Title:</label>
      <input 
        placeholder="e.g. Quick Sync"
        value={newEvent.title} 
        onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
        style={inpS} 
      />
      
      <label style={{fontWeight:'bold', fontSize:'14px', marginTop:'10px', display:'block'}}>Duration (minutes):</label>
      <input 
        type="number"
        value={newEvent.duration} 
        onChange={e => setNewEvent({...newEvent, duration: parseInt(e.target.value) || 0})} 
        style={inpS} 
      />
      
      <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
       <button onClick={async () => {
  if (!newEvent.title) return alert("Please enter a title");

  // Title + Random String + Timestamp = 100% Unique
  const randomStr = Math.random().toString(36).substring(2, 7);
  const generatedSlug = `${newEvent.title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')}-${randomStr}-${Date.now()}`;

  const payload = {
    title: newEvent.title,
    duration: parseInt(newEvent.duration) || 30,
    slug: generatedSlug,
    description: "" 
  };

  try {
    console.log("Final Payload being sent:", payload);
    const response = await axios.post(`${API}/event-types`, payload);
    
    setShowCreateModal(false);
    setNewEvent({ title: '', duration: 30, bufferTime: 0 });
    fetchData();
    alert("Event Created!");
  } catch (err) {
    console.error("Backend Error Details:", err.response?.data);
    // Agar ab bhi error aaye, toh iska matlab backend slug generate kar raha hai manually
    alert(`Error: ${err.response?.data?.error || "Failed to create event"}`);
  }
}} style={{...btnP, flex: 1}}>
  Create
</button>
        
        <button onClick={() => setShowCreateModal(false)} style={{...btnS, flex: 1}}>Cancel</button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
    
  );
}

// Styles (Omit for brevity, use existing ones)
const navS = { display:'flex', justifyContent:'space-between', padding:'10px 50px', background:'white', borderBottom:'1px solid #ddd', alignItems:'center' };
const navB = (a) => ({ border:'none', background:'none', color: a ? '#006bff' : '#666', fontWeight:'bold', cursor:'pointer', padding:'10px' });
const gridS = { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px' };
const itemS = { background:'white', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', marginBottom:'10px' , position:'relative' };
const card = { background:'white', padding:'30px', borderRadius:'12px', textAlign:'center', margin:'auto', maxWidth:'400px' };
const inpS = { width:'100%', padding:'10px', margin:'10px 0', border:'1px solid #ddd', borderRadius:'6px', boxSizing:'border-box' };
const btnP = { background:'#006bff', color:'white', border:'none', padding:'10px 20px', borderRadius:'20px', cursor:'pointer', fontWeight:'bold' };
const btnS = { background:'none', border:'1px solid #006bff', color:'#006bff', padding:'8px 15px', borderRadius:'20px', cursor:'pointer' };
const btnD = { border:'1px solid red', color:'red', background:'none', padding:'8px 15px', borderRadius:'20px', cursor:'pointer', marginLeft:'5px' };
const slotB = (a) => ({ padding:'10px', border:'1px solid #006bff', background: a ? '#006bff' : 'white', color: a ? 'white' : '#006bff', borderRadius:'5px', cursor:'pointer' });
const bookingGrid = { display:'flex', background:'white', borderRadius:'12px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', overflow:'hidden' };
const sideS = { padding:'30px', background:'#fafafa', borderRight:'1px solid #eee', minWidth:'200px' };
const slotGridS = { display:'flex', flexWrap:'wrap', gap:'10px', margin:'20px 0' };
const centerS = { display:'flex', justifyContent:'center', alignItems:'center', height:'80vh' };
// Styles section mein ise add karo
const settingsS = { 
  background: '#f0f7ff', 
  padding: '15px', 
  marginTop: '10px', 
  borderRadius: '8px',
  border: '1px solid #d0e7ff'
};

export default App;
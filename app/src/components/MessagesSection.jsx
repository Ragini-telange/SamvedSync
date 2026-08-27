import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadMessages, sendMessage, loadNurses, loadDoctors, loadAdmins, loadAllProfiles } from '../lib/dashboardData';
import { supabase } from '../supabaseClient';
import { 
  Send, MessageSquare, User, Shield, HeartPulse, Stethoscope, RefreshCw, 
  Search, CheckCheck, Clock, UserCheck, Bell, Sparkles, Filter 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessagesSection({ patientId = null, preselectedNurseId = null, title = "Staff Communication Center" }) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null); // { id, name, role, profile_id, ward }
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef(null);

  const fetchMessagesAndContacts = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    
    // Fetch contacts & messages concurrently
    const [msgs, allProfiles, nurseList, doctorList] = await Promise.all([
      loadMessages(profile.id, profile.role),
      loadAllProfiles(),
      loadNurses(),
      loadDoctors()
    ]);

    setMessages(msgs);

    // Build unique contact list
    const contactMap = new Map();

    // Broadcast option
    contactMap.set('broadcast-nurse', {
      id: 'broadcast-nurse',
      profile_id: null,
      name: '📢 Nurse Broadcast Channel',
      role: 'nurse',
      isBroadcast: true,
      ward: 'Hospital Wide'
    });

    // Process all registered user profiles
    allProfiles.forEach(p => {
      if (p.id !== profile.id) {
        let extraWard = p.role === 'admin' ? 'Administration' : (p.role === 'doctor' ? 'Clinical Doctor' : 'General Ward');
        let empId = null;

        if (p.role === 'nurse') {
          const matchNurse = nurseList.find(n => n.profile_id === p.id);
          if (matchNurse) {
            if (matchNurse.ward) extraWard = matchNurse.ward;
            if (matchNurse.employee_id) empId = matchNurse.employee_id;
          }
        } else if (p.role === 'doctor') {
          const matchDoc = doctorList.find(d => d.profile_id === p.id);
          if (matchDoc && matchDoc.specialization) extraWard = matchDoc.specialization;
        }

        contactMap.set(p.id, {
          id: p.id,
          profile_id: p.id,
          name: p.name || p.username || 'Staff Member',
          username: p.username,
          role: p.role,
          ward: extraWard,
          employee_id: empId
        });
      }
    });

    const contactArr = Array.from(contactMap.values());
    setContacts(contactArr);

    // If preselected nurse or patient passed, select that contact
    if (preselectedNurseId) {
      const match = contactArr.find(c => c.id === preselectedNurseId || c.profile_id === preselectedNurseId);
      if (match) setSelectedContact(match);
    } else if (!selectedContact && contactArr.length > 0) {
      setSelectedContact(contactArr[0]);
    }

    setLoading(false);
  }, [profile, preselectedNurseId]);

  useEffect(() => {
    fetchMessagesAndContacts();
  }, [fetchMessagesAndContacts]);

  // Realtime subscription for instant chat updates
  useEffect(() => {
    const channel = supabase
      .channel('chat-messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchMessagesAndContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessagesAndContacts]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContact]);

  async function handleSend(e) {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact) return;
    setSending(true);

    const { error } = await sendMessage({
      senderId: profile.id,
      senderRole: profile.role,
      receiverId: selectedContact.isBroadcast ? null : selectedContact.profile_id,
      receiverRole: selectedContact.role,
      patientId: patientId || null,
      body: messageText.trim()
    });

    setSending(false);
    if (!error) {
      setMessageText('');
      fetchMessagesAndContacts();
    }
  }

  // Filter messages for active conversation
  const currentChatMessages = messages.filter(m => {
    if (!selectedContact) return false;
    if (selectedContact.isBroadcast) {
      // Show all broadcast messages to nurses (receiver_id is null, receiver_role is 'nurse')
      return m.receiver_role === 'nurse' && m.receiver_id === null;
    }
    const contactProfileId = selectedContact.profile_id || selectedContact.id;
    return (
      // I sent to this contact
      (m.sender_id === profile.id && m.receiver_id === contactProfileId) ||
      // This contact sent to me directly
      (m.sender_id === contactProfileId && m.receiver_id === profile.id) ||
      // This contact sent a broadcast to my role
      (m.sender_id === contactProfileId && m.receiver_id === null && m.receiver_role === profile.role)
    );
  }).reverse();

  // Search filter for contacts
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.ward && c.ward.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRoleBadge = (role) => {
    if (role === 'doctor') return <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-blue-500/20">Doctor</span>;
    if (role === 'admin') return <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-purple-500/20">Admin</span>;
    return <span className="bg-saline/10 text-saline text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-saline/20">Nurse</span>;
  };

  return (
    <div className="space-y-6 font-body">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-ink dark:text-white flex items-center gap-2 font-display">
            <MessageSquare className="w-5 h-5 text-saline" />
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time encrypted hospital staff messaging center.
          </p>
        </div>
        <button 
          onClick={fetchMessagesAndContacts}
          className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          title="Refresh Messages"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* WhatsApp-Style 2-Column Interface */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden grid lg:grid-cols-12 min-h-[620px]">
        {/* Left Column: Contacts List */}
        <div className="lg:col-span-4 border-r border-slate-100 dark:border-slate-800/80 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          {/* Contact Search Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, ward..."
                className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-ink dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-saline/20"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No contacts found</div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                
                // Find last message snippet
                const lastMsg = messages.find(m => 
                  (m.sender_id === contact.profile_id || m.receiver_id === contact.profile_id) ||
                  (contact.isBroadcast && m.receiver_role === 'nurse' && m.receiver_id === null)
                );

                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full text-left p-4 flex items-center gap-3.5 transition-all duration-200 ${
                      isSelected 
                        ? 'bg-saline/10 border-l-4 border-saline dark:bg-saline/15' 
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        contact.isBroadcast 
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}>
                        {contact.isBroadcast ? '📢' : contact.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute -bottom-0.5 -right-0.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs sm:text-sm text-ink dark:text-white truncate">
                          {contact.name}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="truncate max-w-[160px]">
                          {lastMsg ? lastMsg.body : (contact.ward || 'Staff Member')}
                        </span>
                        {getRoleBadge(contact.role)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className="lg:col-span-8 flex flex-col bg-white dark:bg-slate-900">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-saline/20 text-saline font-bold flex items-center justify-center border border-saline/30">
                    {selectedContact.isBroadcast ? '📢' : selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink dark:text-white text-sm sm:text-base flex items-center gap-2">
                      {selectedContact.name}
                      {getRoleBadge(selectedContact.role)}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {selectedContact.ward || 'Active on duty'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-950/30 max-h-[460px]">
                {currentChatMessages.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                    <MessageSquare className="w-10 h-10 opacity-20" />
                    No messages yet. Send a message to start the conversation!
                  </div>
                ) : (
                  currentChatMessages.map((m) => {
                    const isMe = m.sender_id === profile.id;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-gradient-to-r from-saline to-saline-dim text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none'
                          }`}
                        >
                          {!isMe && (
                            <div className="text-[10px] font-bold text-saline uppercase tracking-wider mb-1">
                              {m.sender?.name || 'Staff Member'} ({m.sender_role})
                            </div>
                          )}

                          <p className="whitespace-pre-wrap">{m.body}</p>

                          {m.patient && (
                            <div className="mt-2 text-[11px] bg-black/10 dark:bg-white/10 px-2.5 py-1 rounded-xl font-medium w-fit">
                              🏥 Patient: {m.patient.name} (Bed {m.patient.bed_number})
                            </div>
                          )}

                          <div className={`text-[10px] mt-2 flex items-center justify-end gap-1 ${
                            isMe ? 'text-white/70' : 'text-slate-400'
                          }`}>
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-white/90" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 sm:gap-3"
              >
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message ${selectedContact.name}...`}
                  className="flex-1 text-xs sm:text-sm px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-ink dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-saline/20"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sending}
                  className="bg-saline hover:bg-saline-dim text-white p-3 sm:px-5 sm:py-3 rounded-2xl font-semibold text-xs sm:text-sm shadow-md shadow-saline/20 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-sm font-medium">Select a contact from the left panel to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

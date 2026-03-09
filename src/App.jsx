import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════
   PERSISTENT STORAGE HELPERS  (shared = visible to all users)
═══════════════════════════════════════════════════════════ */
import { supabase } from './supabase';

const DB = {
  async getUsers() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) { console.error('getUsers error:', error); return []; }
    return data || [];
  },

  async setUsers(users) {
    if (!users || users.length === 0) return;
    const { error } = await supabase.from('profiles').upsert(users, { onConflict: 'id' });
    if (error) console.error('setUsers error:', error);
  },

  async getPosts() {
    const { data, error } = await supabase.from('posts').select('*').order('ts', { ascending: false });
    if (error) { console.error('getPosts error:', error); return []; }
    return data || [];
  },

  async setPosts(posts) {
    if (!posts || posts.length === 0) return;
    const { error } = await supabase.from('posts').upsert(posts, { onConflict: 'id' });
    if (error) console.error('setPosts error:', error);
  },

  async getSession() {
    return localStorage.getItem('thread_uid');
  },

  async setSession(userId) {
    localStorage.setItem('thread_uid', userId);
  },

  async clearSession() {
    localStorage.removeItem('thread_uid');
  },
};
let _nextId = Date.now();
const uid = () => String(++_nextId);

const AVATAR_COLORS = [
  "#f97316","#8b5cf6","#06b6d4","#ec4899",
  "#10b981","#f59e0b","#ef4444","#3b82f6",
];

/* ═══════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --bg:#08080b;--s1:#0f0f14;--s2:#16161d;--s3:#1e1e28;
  --b:#252535;--b2:#2e2e42;
  --t:#ededf5;--t2:#8888a8;--t3:#4a4a65;
  --acc:#f97316;--acc2:rgba(249,115,22,.14);
  --red:#ef4444;--green:#22c55e;
  --r:14px;--r2:9px;
  --fd:'Syne',sans-serif;--fb:'Instrument Sans',sans-serif;
  --shadow:0 8px 40px rgba(0,0,0,.5);
}

body{background:var(--bg);color:var(--t);font-family:var(--fb);min-height:100vh}

/* ── layout ── */
.app{display:flex;min-height:100vh}
.sidebar{
  width:248px;min-height:100vh;background:var(--s1);border-right:1px solid var(--b);
  padding:24px 16px;display:flex;flex-direction:column;gap:4px;
  position:fixed;left:0;top:0;bottom:0;z-index:100
}
.main{margin-left:248px;flex:1}
.center{max-width:600px;margin:0 auto;padding:36px 20px}

/* ── brand ── */
.brand{
  font-family:var(--fd);font-size:20px;font-weight:800;color:var(--acc);
  padding:4px 10px 22px;letter-spacing:-.5px;display:flex;align-items:center;gap:6px
}
.brand-dot{width:8px;height:8px;background:var(--acc);border-radius:50%;display:inline-block}

/* ── nav ── */
.nav{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r2);
  border:none;background:none;color:var(--t2);cursor:pointer;
  font-family:var(--fb);font-size:14px;font-weight:500;width:100%;transition:all .15s}
.nav:hover{background:var(--s2);color:var(--t)}
.nav.on{background:var(--acc2);color:var(--acc)}
.nav-icon{width:18px;height:18px;flex-shrink:0}
.sidebar-bottom{margin-top:auto;display:flex;flex-direction:column;gap:4px}
.sidebar-me{
  background:var(--s2);border:1px solid var(--b);border-radius:var(--r2);
  padding:12px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:border-color .15s
}
.sidebar-me:hover{border-color:var(--b2)}
.me-info{flex:1;min-width:0}
.me-name{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.me-handle{font-size:11px;color:var(--t3)}

/* ── auth screen ── */
.auth-bg{
  min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;
  background:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(249,115,22,.08),transparent)
}
.auth-box{width:100%;max-width:420px}
.auth-logo{font-family:var(--fd);font-size:48px;font-weight:800;color:var(--acc);line-height:1;margin-bottom:10px}
.auth-sub{color:var(--t2);font-size:15px;line-height:1.6;margin-bottom:40px}
.auth-card{background:var(--s1);border:1px solid var(--b);border-radius:var(--r);padding:28px}
.auth-tabs{display:flex;gap:2px;background:var(--s2);border-radius:var(--r2);padding:4px;margin-bottom:24px}
.auth-tab{
  flex:1;padding:9px;border:none;background:none;color:var(--t2);
  font-family:var(--fb);font-size:14px;font-weight:500;border-radius:7px;cursor:pointer;transition:all .15s
}
.auth-tab.on{background:var(--s3);color:var(--t);box-shadow:0 1px 4px rgba(0,0,0,.3)}
.field{margin-bottom:16px}
.field label{display:block;font-size:12px;font-weight:600;color:var(--t2);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px}
.input{
  width:100%;background:var(--s2);border:1px solid var(--b);border-radius:var(--r2);
  padding:11px 14px;color:var(--t);font-family:var(--fb);font-size:14px;outline:none;transition:border-color .15s
}
.input:focus{border-color:var(--acc)}
.input::placeholder{color:var(--t3)}
.color-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
.color-swatch{
  width:32px;height:32px;border-radius:50%;cursor:pointer;
  border:3px solid transparent;transition:all .15s;position:relative
}
.color-swatch.picked{border-color:white;transform:scale(1.1)}
.btn-primary{
  width:100%;padding:12px;background:var(--acc);color:white;border:none;
  border-radius:var(--r2);font-family:var(--fb);font-size:15px;font-weight:600;
  cursor:pointer;transition:opacity .15s;margin-top:4px
}
.btn-primary:hover{opacity:.88}
.btn-primary:disabled{opacity:.4;cursor:not-allowed}
.auth-err{color:var(--red);font-size:13px;margin-top:12px;text-align:center}
.auth-switch{text-align:center;margin-top:16px;font-size:13px;color:var(--t2)}
.auth-switch button{background:none;border:none;color:var(--acc);cursor:pointer;font-size:13px;font-family:var(--fb)}

/* ── avatar ── */
.av{border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-weight:700;color:white;flex-shrink:0}
.av-xs{width:28px;height:28px;font-size:10px}
.av-sm{width:36px;height:36px;font-size:12px}
.av-md{width:44px;height:44px;font-size:14px}
.av-lg{width:72px;height:72px;font-size:22px}
.av-xl{width:96px;height:96px;font-size:28px;border:3px solid var(--b)}

/* ── page header ── */
.ph{margin-bottom:28px}
.ph h1{font-family:var(--fd);font-size:26px;font-weight:800}
.ph p{color:var(--t2);font-size:13px;margin-top:3px}

/* ── compose ── */
.compose{
  background:var(--s1);border:1px solid var(--b);border-radius:var(--r);
  padding:18px;margin-bottom:20px;transition:border-color .2s
}
.compose:focus-within{border-color:var(--b2)}
.compose-row{display:flex;gap:12px}
.compose textarea{
  flex:1;background:none;border:none;outline:none;color:var(--t);
  font-family:var(--fb);font-size:15px;resize:none;line-height:1.65;min-height:60px
}
.compose textarea::placeholder{color:var(--t3)}
.compose-foot{display:flex;justify-content:space-between;align-items:center;
  margin-top:14px;padding-top:14px;border-top:1px solid var(--b)}
.char-count{font-size:12px;color:var(--t3)}
.char-count.warn{color:var(--acc)}
.char-count.over{color:var(--red)}

/* ── post card ── */
.post{
  background:var(--s1);border:1px solid var(--b);border-radius:var(--r);
  margin-bottom:14px;overflow:hidden;
  animation:fadeUp .3s ease both
}
.post:hover{border-color:var(--b2)}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.post-head{display:flex;align-items:center;gap:11px;padding:16px 18px 12px;cursor:pointer}
.post-head:hover .post-name{color:var(--acc)}
.post-name{font-weight:600;font-size:14px;transition:color .15s}
.post-handle{font-size:11px;color:var(--t3)}
.post-time{margin-left:auto;font-size:11px;color:var(--t3)}
.post-body{padding:0 18px 14px;font-size:15px;line-height:1.7;white-space:pre-wrap;color:var(--t)}
.post-foot{display:flex;gap:4px;padding:10px 18px 14px;border-top:1px solid var(--b)}
.act{
  display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:7px;
  border:none;background:none;color:var(--t2);cursor:pointer;
  font-family:var(--fb);font-size:13px;font-weight:500;transition:all .15s
}
.act:hover{background:var(--s2);color:var(--t)}
.act.liked{color:var(--red)}
.act.liked:hover{background:rgba(239,68,68,.1)}

/* ── comments ── */
.cmts{border-top:1px solid var(--b)}
.cmts-list{padding:4px 18px 0}
.cmt{display:flex;gap:9px;padding:11px 0;border-bottom:1px solid var(--b)}
.cmt:last-child{border-bottom:none}
.cmt-body{flex:1}
.cmt-meta{font-size:13px;margin-bottom:2px}
.cmt-meta strong{font-weight:600}
.cmt-meta time{color:var(--t3);margin-left:5px;font-size:11px}
.cmt-text{font-size:13px;color:var(--t2);line-height:1.5}
.cmt-form{display:flex;gap:9px;align-items:center;padding:12px 18px}
.cmt-input{
  flex:1;background:var(--s2);border:1px solid var(--b);border-radius:8px;
  padding:8px 13px;color:var(--t);font-family:var(--fb);font-size:13px;outline:none;transition:border-color .15s
}
.cmt-input:focus{border-color:var(--acc)}
.cmt-input::placeholder{color:var(--t3)}
.btn-send{
  background:var(--acc2);color:var(--acc);border:none;border-radius:8px;
  padding:8px 13px;cursor:pointer;display:flex;align-items:center;transition:all .15s
}
.btn-send:hover{background:var(--acc);color:white}

/* ── follow btn ── */
.btn-follow{
  padding:8px 18px;border-radius:var(--r2);font-family:var(--fb);
  font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;border:1.5px solid
}
.btn-follow.do{background:var(--acc);color:white;border-color:var(--acc)}
.btn-follow.do:hover{opacity:.85}
.btn-follow.undo{background:none;color:var(--t2);border-color:var(--b)}
.btn-follow.undo:hover{border-color:var(--red);color:var(--red)}
.btn-follow.edit{background:none;color:var(--t);border-color:var(--b)}
.btn-follow.edit:hover{border-color:var(--b2)}

/* ── profile page ── */
.prof-card{background:var(--s1);border:1px solid var(--b);border-radius:var(--r);overflow:hidden;margin-bottom:22px}
.prof-banner{height:110px}
.prof-body{padding:0 22px 22px}
.prof-top{display:flex;justify-content:space-between;align-items:flex-end;margin-top:-36px;margin-bottom:14px}
.prof-name{font-family:var(--fd);font-size:20px;font-weight:800}
.prof-handle{color:var(--t2);font-size:13px;margin-top:2px}
.prof-bio{font-size:14px;color:var(--t2);line-height:1.65;margin:10px 0 14px}
.prof-stats{display:flex;gap:20px}
.pstat{font-size:13px;color:var(--t2)}
.pstat strong{color:var(--t);font-family:var(--fd);font-weight:700;font-size:15px}

/* ── people cards ── */
.person{
  background:var(--s1);border:1px solid var(--b);border-radius:var(--r);
  padding:18px;display:flex;gap:14px;align-items:flex-start;
  margin-bottom:12px;cursor:pointer;transition:border-color .15s
}
.person:hover{border-color:var(--b2)}
.p-info{flex:1;min-width:0}
.p-name{font-weight:700;font-size:14px;font-family:var(--fd)}
.p-handle{color:var(--t3);font-size:12px;margin-bottom:4px}
.p-bio{font-size:13px;color:var(--t2);line-height:1.5}

/* ── tabs ── */
.tabs{display:flex;border-bottom:1px solid var(--b);margin-bottom:18px}
.tab{
  padding:11px 18px;border:none;background:none;cursor:pointer;
  font-family:var(--fb);font-size:14px;font-weight:500;border-bottom:2px solid transparent;
  color:var(--t3);transition:all .15s
}
.tab.on{color:var(--acc);border-bottom-color:var(--acc)}

/* ── modal ── */
.overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:1000;
  display:flex;align-items:center;justify-content:center;padding:20px;
  animation:bgi .15s ease
}
@keyframes bgi{from{opacity:0}to{opacity:1}}
.modal{
  background:var(--s1);border:1px solid var(--b);border-radius:var(--r);
  width:100%;max-width:540px;max-height:82vh;overflow-y:auto;
  animation:pop .2s ease
}
@keyframes pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
.modal-head{
  display:flex;justify-content:space-between;align-items:center;
  padding:18px 22px;border-bottom:1px solid var(--b);
  font-family:var(--fd);font-size:17px;font-weight:700
}
.btn-x{background:none;border:none;color:var(--t2);cursor:pointer;padding:5px;border-radius:7px;display:flex}
.btn-x:hover{color:var(--t);background:var(--s2)}

/* ── edit profile modal ── */
.edit-form{padding:22px}
.edit-field{margin-bottom:18px}
.edit-field label{display:block;font-size:12px;font-weight:600;color:var(--t2);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px}

/* ── toast ── */
.toast{
  position:fixed;bottom:22px;left:50%;transform:translateX(-50%);
  background:var(--s2);border:1px solid var(--b);color:var(--t);
  padding:11px 20px;border-radius:10px;font-size:13px;font-weight:500;
  z-index:9999;box-shadow:var(--shadow);white-space:nowrap;
  animation:toastIn .22s ease
}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

/* ── misc ── */
.divider{height:1px;background:var(--b);margin:6px 0}
.empty{text-align:center;padding:56px 20px;color:var(--t3)}
.empty h3{font-family:var(--fd);font-size:17px;color:var(--t2);margin-bottom:5px}
.loading{display:flex;align-items:center;justify-content:center;min-height:100vh;
  font-family:var(--fd);font-size:18px;color:var(--t3)}
.spinner{
  width:20px;height:20px;border:2px solid var(--b);border-top-color:var(--acc);
  border-radius:50%;animation:spin .7s linear infinite;margin-right:10px
}
@keyframes spin{to{transform:rotate(360deg)}}
.badge{
  display:inline-flex;align-items:center;justify-content:center;
  min-width:18px;height:18px;border-radius:9px;background:var(--acc);
  color:white;font-size:11px;font-weight:700;padding:0 5px
}

/* ── scrollbar ── */
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:var(--b);border-radius:3px}
`;

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */
const Ic = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  heart: (f) => <svg width={16} height={16} viewBox="0 0 24 24" fill={f?"#ef4444":"none"} stroke={f?"#ef4444":"currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  send: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  x: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
};

/* ═══════════════════════════════════════════════════════════
   AVATAR
═══════════════════════════════════════════════════════════ */
const Av = ({ user, size = "md" }) => (
  <div className={`av av-${size}`} style={{ background: user?.color || "#666" }}>
    {user ? (user.avatar || user.name?.slice(0,2).toUpperCase() || "?") : "?"}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   TOAST HOOK
═══════════════════════════════════════════════════════════ */
function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(null), 2600); }, []);
  return [msg, show];
}

/* ═══════════════════════════════════════════════════════════
   TIME HELPER
═══════════════════════════════════════════════════════════ */
function timeAgo(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [currentUid, setCurrentUid] = useState(null);
  const [page, setPage] = useState("feed");
  const [profileId, setProfileId] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [postModal, setPostModal] = useState(null);
  const [toast, showToast] = useToast();
  const pollRef = useRef(null);

  // ── initial load ──
  useEffect(() => {
    (async () => {
      const [u, p, sid] = await Promise.all([DB.getUsers(), DB.getPosts(), DB.getSession()]);
      setUsers(u); setPosts(p);
      if (sid) setCurrentUid(sid);
      setLoading(false);
    })();
  }, []);

  // ── live polling (every 5s) so multiple users see each other's activity ──
  useEffect(() => {
    if (!currentUid) return;
    pollRef.current = setInterval(async () => {
      const [u, p] = await Promise.all([DB.getUsers(), DB.getPosts()]);
      setUsers(u); setPosts(p);
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [currentUid]);

  const me = users.find(u => u.id === currentUid);

  // ── write helpers ──
  const saveUsers = async (next) => { setUsers(next); await DB.setUsers(next); };
  const savePosts = async (next) => { setPosts(next); await DB.setPosts(next); };

  const register = async ({ name, username, bio, color }) => {
    const fresh = await DB.getUsers();
    if (fresh.find(u => u.username.toLowerCase() === username.toLowerCase()))
      return "Username already taken";
    const user = { id: uid(), name, username: username.toLowerCase(), bio, color,
      avatar: name.slice(0,2).toUpperCase(), followers: [], following: [], joined: new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}) };
    const next = [...fresh, user];
    await saveUsers(next);
    await DB.setSession(user.id);
    setCurrentUid(user.id);
    return null;
  };

  const login = async ({ username, password }) => {
    const fresh = await DB.getUsers();
    const user = fresh.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return "User not found";
    if (user.password && user.password !== password) return "Wrong password";
    setUsers(fresh);
    await DB.setSession(user.id);
    setCurrentUid(user.id);
    return null;
  };

  const logout = async () => {
    await DB.clearSession(); setCurrentUid(null); setPage("feed");
  };

  const toggleLike = async (postId) => {
    const next = posts.map(p => {
      if (p.id !== postId) return p;
      const liked = p.likes.includes(currentUid);
      return { ...p, likes: liked ? p.likes.filter(id => id !== currentUid) : [...p.likes, currentUid] };
    });
    await savePosts(next);
  };

  const addComment = async (postId, text) => {
    if (!text.trim()) return;
    const next = posts.map(p => {
      if (p.id !== postId) return p;
      return { ...p, comments: [...p.comments, { id: uid(), userId: currentUid, text, ts: Date.now() }] };
    });
    await savePosts(next);
  };

  const addPost = async (content) => {
    if (!content.trim()) return;
    const np = { id: uid(), userId: currentUid, content: content.trim(), likes: [], comments: [], ts: Date.now() };
    await savePosts([np, ...posts]);
    showToast("✓ Post published");
  };

  const deletePost = async (postId) => {
    await savePosts(posts.filter(p => p.id !== postId));
    showToast("Post deleted");
  };

  const toggleFollow = async (targetId) => {
    if (targetId === currentUid) return;
    const isFollowing = me.following.includes(targetId);
    const next = users.map(u => {
      if (u.id === currentUid) return { ...u, following: isFollowing ? u.following.filter(x => x !== targetId) : [...u.following, targetId] };
      if (u.id === targetId) return { ...u, followers: isFollowing ? u.followers.filter(x => x !== currentUid) : [...u.followers, currentUid] };
      return u;
    });
    await saveUsers(next);
    const target = users.find(u => u.id === targetId);
    showToast(isFollowing ? "Unfollowed" : `Following @${target?.username}`);
  };

  const updateProfile = async ({ name, bio, color }) => {
    const next = users.map(u => u.id === currentUid
      ? { ...u, name: name||u.name, bio: bio||u.bio, color: color||u.color, avatar: (name||u.name).slice(0,2).toUpperCase() }
      : u);
    await saveUsers(next);
    setEditModal(false);
    showToast("✓ Profile updated");
  };

  const getUser = (id) => users.find(u => u.id === id);
  const openProfile = (id) => { setProfileId(id); setPage("profile"); };

  if (loading) return (
    <><style>{CSS}</style>
      <div className="loading"><div className="spinner"/>Loading…</div>
    </>
  );

  if (!currentUid) return (
    <><style>{CSS}</style>
      <AuthScreen onRegister={register} onLogin={login} />
    </>
  );

  if (!me) return (
    <><style>{CSS}</style>
      <div className="loading">Session expired. <button onClick={logout} style={{marginLeft:8,background:"none",border:"none",color:"var(--acc)",cursor:"pointer",fontFamily:"var(--fb)"}}>Sign in again</button></div>
    </>
  );

  const feedPosts = [...posts].sort((a, b) => b.ts - a.ts);

  return (
    <><style>{CSS}</style>
      <div className="app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="brand"><span className="brand-dot"/>thread.</div>
          <button className={`nav ${page==="feed"?"on":""}`} onClick={() => setPage("feed")}>{Ic.home} Feed</button>
          <button className={`nav ${page==="people"?"on":""}`} onClick={() => setPage("people")}>{Ic.users} People</button>
          <button className={`nav ${page==="profile"&&profileId===currentUid?"on":""}`} onClick={() => { setProfileId(currentUid); setPage("profile"); }}>{Ic.user} My Profile</button>
          <div className="divider"/>
          <div className="sidebar-bottom">
            <div className="sidebar-me" onClick={() => { setProfileId(currentUid); setPage("profile"); }}>
              <Av user={me} size="xs"/>
              <div className="me-info">
                <div className="me-name">{me.name}</div>
                <div className="me-handle">@{me.username}</div>
              </div>
            </div>
            <button className="nav" style={{color:"var(--t3)"}} onClick={logout}>{Ic.logout} Sign out</button>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="main">
          {page==="feed" && (
            <FeedPage posts={feedPosts} me={me} getUser={getUser}
              onPost={addPost} onLike={toggleLike} onComment={addComment}
              onDelete={deletePost} onProfile={openProfile} onOpen={setPostModal} />
          )}
          {page==="people" && (
            <PeoplePage users={users.filter(u=>u.id!==currentUid)} me={me}
              onFollow={toggleFollow} onProfile={openProfile} />
          )}
          {page==="profile" && profileId && (
            <ProfilePage
              user={getUser(profileId)||me}
              posts={feedPosts.filter(p=>p.userId===profileId)}
              me={me} getUser={getUser}
              onFollow={toggleFollow} onLike={toggleLike}
              onComment={addComment} onDelete={deletePost}
              onProfile={openProfile} onOpen={setPostModal}
              onEdit={() => setEditModal(true)} />
          )}
        </main>
      </div>

      {/* EDIT PROFILE MODAL */}
      {editModal && <EditProfileModal user={me} onSave={updateProfile} onClose={() => setEditModal(false)} />}

      {/* POST DETAIL MODAL */}
      {postModal && (() => {
        const p = posts.find(x => x.id === postModal) || null;
        if (!p) return null;
        return <PostModal post={p} me={me} getUser={getUser}
          onClose={() => setPostModal(null)} onLike={toggleLike} onComment={addComment}
          onProfile={(id) => { openProfile(id); setPostModal(null); }} />;
      })()}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUTH SCREEN
═══════════════════════════════════════════════════════════ */
function AuthScreen({ onRegister, onLogin }) {
  const [tab, setTab] = useState("register");
  const [form, setForm] = useState({ name:"", username:"", bio:"", password:"", color: AVATAR_COLORS[0] });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.name.trim()) return setErr("Name is required");
    if (!form.username.trim()) return setErr("Username is required");
    if (!/^[a-z0-9_]{3,20}$/i.test(form.username)) return setErr("Username: 3-20 chars, letters/numbers/underscores");
    setBusy(true); setErr("");
    const e = await onRegister(form);
    if (e) { setErr(e); setBusy(false); }
  };

  const handleLogin = async () => {
    if (!form.username.trim()) return setErr("Username is required");
    setBusy(true); setErr("");
    const e = await onLogin({ username: form.username, password: form.password });
    if (e) { setErr(e); setBusy(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-box">
        <div className="auth-logo">thread.</div>
        <p className="auth-sub">Your space to share ideas, connect with people,<br/>and follow what matters.</p>
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${tab==="register"?"on":""}`} onClick={() => { setTab("register"); setErr(""); }}>Create account</button>
            <button className={`auth-tab ${tab==="login"?"on":""}`} onClick={() => { setTab("login"); setErr(""); }}>Sign in</button>
          </div>

          {tab === "register" && (<>
            <div className="field"><label>Your name</label>
              <input className="input" placeholder="e.g. Alex Rivera" value={form.name} onChange={e=>set("name",e.target.value)} /></div>
            <div className="field"><label>Username</label>
              <input className="input" placeholder="e.g. alex_r (no spaces)" value={form.username} onChange={e=>set("username",e.target.value)} /></div>
            <div className="field"><label>Bio <span style={{color:"var(--t3)",textTransform:"none",fontWeight:400}}>(optional)</span></label>
              <input className="input" placeholder="Tell people a little about yourself…" value={form.bio} onChange={e=>set("bio",e.target.value)} /></div>
            <div className="field"><label>Avatar color</label>
              <div className="color-row">
                {AVATAR_COLORS.map(c => (
                  <div key={c} className={`color-swatch ${form.color===c?"picked":""}`}
                    style={{background:c}} onClick={() => set("color",c)} />
                ))}
              </div>
            </div>
            {err && <div className="auth-err">{err}</div>}
            <button className="btn-primary" disabled={busy} onClick={handleRegister}>
              {busy ? "Creating…" : "Create account →"}
            </button>
          </>)}

          {tab === "login" && (<>
            <div className="field"><label>Username</label>
              <input className="input" placeholder="your username" value={form.username} onChange={e=>set("username",e.target.value)} /></div>
            {err && <div className="auth-err">{err}</div>}
            <button className="btn-primary" disabled={busy} onClick={handleLogin}>
              {busy ? "Signing in…" : "Sign in →"}
            </button>
            <p style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginTop:12}}>No password needed — just your username.</p>
          </>)}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FEED PAGE
═══════════════════════════════════════════════════════════ */
function FeedPage({ posts, me, getUser, onPost, onLike, onComment, onDelete, onProfile, onOpen }) {
  const [draft, setDraft] = useState("");
  const MAX = 280;
  const over = draft.length > MAX;

  return (
    <div className="center">
      <div className="ph"><h1>Feed</h1><p>What's happening right now</p></div>

      {/* Compose */}
      <div className="compose">
        <div className="compose-row">
          <Av user={me} size="sm"/>
          <textarea placeholder="What's on your mind?"
            value={draft} onChange={e=>setDraft(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)&&!over){onPost(draft);setDraft("")}}}
          />
        </div>
        <div className="compose-foot">
          <span className={`char-count ${over?"over":draft.length>MAX-40?"warn":""}`}>{draft.length}/{MAX}</span>
          <button className="btn-primary" style={{width:"auto",padding:"9px 22px",marginTop:0,fontSize:13}}
            disabled={!draft.trim()||over} onClick={()=>{onPost(draft);setDraft("")}}>Post</button>
        </div>
      </div>

      {posts.length === 0 && <div className="empty"><h3>No posts yet</h3><p>Be the first to share something!</p></div>}
      {posts.map(p => (
        <PostCard key={p.id} post={p} author={getUser(p.userId)} me={me}
          onLike={onLike} onComment={onComment} onDelete={onDelete}
          onProfile={onProfile} onOpen={onOpen} getUser={getUser} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   POST CARD
═══════════════════════════════════════════════════════════ */
function PostCard({ post, author, me, onLike, onComment, onDelete, onProfile, onOpen, getUser }) {
  const [open, setOpen] = useState(false);
  const [cmt, setCmt] = useState("");
  const liked = post.likes.includes(me.id);
  const isOwn = post.userId === me.id;

  const submit = () => { if(!cmt.trim()) return; onComment(post.id,cmt); setCmt(""); };

  if (!author) return null;

  return (
    <div className="post">
      <div className="post-head" onClick={() => onProfile(author.id)}>
        <Av user={author} size="sm"/>
        <div><div className="post-name">{author.name}</div><div className="post-handle">@{author.username}</div></div>
        <div className="post-time">{timeAgo(post.ts)}</div>
      </div>
      <div className="post-body">{post.content}</div>
      <div className="post-foot">
        <button className={`act ${liked?"liked":""}`} onClick={() => onLike(post.id)}>
          {Ic.heart(liked)}{post.likes.length > 0 && <span>{post.likes.length}</span>}
        </button>
        <button className="act" onClick={() => setOpen(o=>!o)}>
          {Ic.comment}{post.comments.length > 0 && <span>{post.comments.length}</span>}
        </button>
        <button className="act" onClick={() => onOpen(post.id)} style={{marginLeft:"auto",fontSize:12}}>View</button>
        {isOwn && <button className="act" style={{color:"var(--red)"}} onClick={() => onDelete(post.id)}>Delete</button>}
      </div>
      {open && (
        <div className="cmts">
          {post.comments.length > 0 && (
            <div className="cmts-list">
              {post.comments.map(c => {
                const cu = getUser(c.userId);
                if (!cu) return null;
                return (
                  <div key={c.id} className="cmt">
                    <Av user={cu} size="xs"/>
                    <div className="cmt-body">
                      <div className="cmt-meta"><strong>{cu.name}</strong><time>{timeAgo(c.ts)}</time></div>
                      <div className="cmt-text">{c.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="cmt-form">
            <Av user={me} size="xs"/>
            <input className="cmt-input" placeholder="Reply…" value={cmt}
              onChange={e=>setCmt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
            <button className="btn-send" onClick={submit}>{Ic.send}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   POST MODAL
═══════════════════════════════════════════════════════════ */
function PostModal({ post, me, getUser, onClose, onLike, onComment, onProfile }) {
  const [cmt, setCmt] = useState("");
  const author = getUser(post.userId);
  const liked = post.likes.includes(me.id);
  const submit = () => { if(!cmt.trim()) return; onComment(post.id,cmt); setCmt(""); };
  if (!author) return null;
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-head">Post <button className="btn-x" onClick={onClose}>{Ic.x}</button></div>
        <div className="post-head" style={{padding:"16px 22px 12px",cursor:"pointer"}} onClick={()=>{onProfile(author.id)}}>
          <Av user={author} size="sm"/>
          <div><div className="post-name">{author.name}</div><div className="post-handle">@{author.username}</div></div>
          <div className="post-time">{timeAgo(post.ts)}</div>
        </div>
        <div className="post-body" style={{padding:"0 22px 16px"}}>{post.content}</div>
        <div className="post-foot" style={{padding:"10px 22px 14px"}}>
          <button className={`act ${liked?"liked":""}`} onClick={()=>onLike(post.id)}>
            {Ic.heart(liked)}{post.likes.length>0&&<span>{post.likes.length}</span>}
          </button>
          <span className="act" style={{pointerEvents:"none"}}>{Ic.comment}<span>{post.comments.length}</span></span>
        </div>
        <div className="cmts">
          {post.comments.length>0 && (
            <div className="cmts-list">
              {post.comments.map(c=>{
                const cu=getUser(c.userId); if(!cu) return null;
                return (
                  <div key={c.id} className="cmt">
                    <Av user={cu} size="xs"/>
                    <div className="cmt-body">
                      <div className="cmt-meta"><strong>{cu.name}</strong><time>{timeAgo(c.ts)}</time></div>
                      <div className="cmt-text">{c.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="cmt-form" style={{padding:"12px 22px"}}>
            <Av user={me} size="xs"/>
            <input className="cmt-input" placeholder="Reply…" value={cmt} autoFocus
              onChange={e=>setCmt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
            <button className="btn-send" onClick={submit}>{Ic.send}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PEOPLE PAGE
═══════════════════════════════════════════════════════════ */
function PeoplePage({ users, me, onFollow, onProfile }) {
  if (users.length === 0) return (
    <div className="center">
      <div className="ph"><h1>People</h1><p>Discover and follow others</p></div>
      <div className="empty"><h3>No one else yet</h3><p>Share this app with friends to grow the community!</p></div>
    </div>
  );
  return (
    <div className="center">
      <div className="ph"><h1>People</h1><p>{users.length} member{users.length!==1?"s":""} on thread.</p></div>
      {users.map(u => {
        const isFollowing = me.following.includes(u.id);
        return (
          <div key={u.id} className="person" onClick={() => onProfile(u.id)}>
            <Av user={u} size="md"/>
            <div className="p-info">
              <div className="p-name">{u.name}</div>
              <div className="p-handle">@{u.username}</div>
              {u.bio && <div className="p-bio">{u.bio}</div>}
              <div style={{display:"flex",gap:14,marginTop:8,fontSize:12,color:"var(--t2)"}}>
                <span><strong style={{color:"var(--t)",fontFamily:"var(--fd)"}}>{u.followers.length}</strong> followers</span>
                <span><strong style={{color:"var(--t)",fontFamily:"var(--fd)"}}>{u.following.length}</strong> following</span>
              </div>
            </div>
            <button className={`btn-follow ${isFollowing?"undo":"do"}`}
              onClick={e=>{e.stopPropagation();onFollow(u.id)}}>
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════════════════════ */
function ProfilePage({ user, posts, me, getUser, onFollow, onLike, onComment, onDelete, onProfile, onOpen, onEdit }) {
  const [tab, setTab] = useState("posts");
  const isOwn = user.id === me.id;
  const isFollowing = me.following.includes(user.id);
  const likedPosts = posts.filter(p => p.likes.includes(user.id));

  return (
    <div className="center">
      <div className="prof-card">
        <div className="prof-banner" style={{background:`linear-gradient(135deg,${user.color}33,var(--s3))`}}/>
        <div className="prof-body">
          <div className="prof-top">
            <Av user={user} size="xl"/>
            {isOwn
              ? <button className="btn-follow edit" onClick={onEdit}>{Ic.edit} Edit Profile</button>
              : <button className={`btn-follow ${isFollowing?"undo":"do"}`} onClick={() => onFollow(user.id)}>
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
            }
          </div>
          <div className="prof-name">{user.name}</div>
          <div className="prof-handle">@{user.username} · Joined {user.joined}</div>
          {user.bio && <div className="prof-bio">{user.bio}</div>}
          <div className="prof-stats">
            <div className="pstat"><strong>{posts.length}</strong> posts</div>
            <div className="pstat"><strong>{user.followers.length}</strong> followers</div>
            <div className="pstat"><strong>{user.following.length}</strong> following</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab==="posts"?"on":""}`} onClick={() => setTab("posts")}>Posts</button>
        <button className={`tab ${tab==="liked"?"on":""}`} onClick={() => setTab("liked")}>Liked</button>
      </div>

      {tab==="posts" && (
        posts.length===0
          ? <div className="empty"><h3>No posts yet</h3></div>
          : posts.map(p => <PostCard key={p.id} post={p} author={user} me={me}
              onLike={onLike} onComment={onComment} onDelete={onDelete}
              onProfile={onProfile} onOpen={onOpen} getUser={getUser} />)
      )}
      {tab==="liked" && (
        likedPosts.length===0
          ? <div className="empty"><h3>No liked posts yet</h3></div>
          : likedPosts.map(p => <PostCard key={p.id} post={p} author={getUser(p.userId)} me={me}
              onLike={onLike} onComment={onComment} onDelete={onDelete}
              onProfile={onProfile} onOpen={onOpen} getUser={getUser} />)
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EDIT PROFILE MODAL
═══════════════════════════════════════════════════════════ */
function EditProfileModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({ name: user.name, bio: user.bio||"", color: user.color });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-head">Edit Profile <button className="btn-x" onClick={onClose}>{Ic.x}</button></div>
        <div className="edit-form">
          <div className="edit-field"><label>Display name</label>
            <input className="input" value={form.name} onChange={e=>set("name",e.target.value)} /></div>
          <div className="edit-field"><label>Bio</label>
            <input className="input" value={form.bio} onChange={e=>set("bio",e.target.value)}
              placeholder="Tell people about yourself…" /></div>
          <div className="edit-field"><label>Avatar color</label>
            <div className="color-row">
              {AVATAR_COLORS.map(c=>(
                <div key={c} className={`color-swatch ${form.color===c?"picked":""}`}
                  style={{background:c}} onClick={()=>set("color",c)} />
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={()=>onSave(form)}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

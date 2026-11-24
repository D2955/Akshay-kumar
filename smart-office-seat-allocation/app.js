/*
  SeatWise - DBMS Mini Project
  Demo mode works in your browser. Add Supabase credentials to use PostgreSQL online.
*/
const SUPABASE_URL = ""; // Paste your Supabase Project URL here
const SUPABASE_ANON_KEY = ""; // Paste your Supabase anon/public key here
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
const db = supabaseReady ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const defaultZones = [
  {id:"z1",name:"Open Workspace",description:"Open desks for everyday productivity",color:"#eeecff",icon:"▦"},
  {id:"z2",name:"Quiet Zone",description:"A calm space for focused work",color:"#e7f7f1",icon:"◉"},
  {id:"z3",name:"Collaboration Hub",description:"Flexible seating for team sessions",color:"#fff1e5",icon:"⌘"}
];
const defaultSeats = [
  ...["A-01","A-02","A-03","A-04","A-05"].map((n,i)=>({id:"s"+(i+1),seat_number:n,zone_id:"z1",seat_type:i===1?"Window":"Standard"})),
  ...["Q-01","Q-02","Q-03","Q-04"].map((n,i)=>({id:"s"+(i+6),seat_number:n,zone_id:"z2",seat_type:i===0?"Window":"Quiet"})),
  ...["C-01","C-02","C-03"].map((n,i)=>({id:"s"+(i+10),seat_number:n,zone_id:"z3",seat_type:i===0?"Standing":"Standard"}))
];
let zones = [...defaultZones], seats = [...defaultSeats], bookings = [];
let selectedSeat = null, currentPage = "overview", currentUser = null;

const $ = id => document.getElementById(id);
const localGet = key => JSON.parse(localStorage.getItem("seatwise_"+key) || "null");
const localSet = (key,value) => localStorage.setItem("seatwise_"+key,JSON.stringify(value));
const today = () => new Date().toISOString().slice(0,10);
const dateTime = d => new Date(d).toLocaleString([], {dateStyle:"medium",timeStyle:"short"});
const zoneName = id => zones.find(z=>z.id===id)?.name || "Workspace";
const seatById = id => seats.find(s=>s.id===id);
const isActive = b => b.status==="confirmed" && new Date(b.end_time)>new Date();
function toast(message){$("toast").textContent=message;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2600)}
function setUser(name,email){currentUser={name,email};$("sideName").textContent=name;$("sideEmail").textContent=email;$("topName").textContent=name.split(" ")[0];$("welcomeName").textContent=name.split(" ")[0];$("sideAvatar").textContent=name[0].toUpperCase();$("topAvatar").textContent=name[0].toUpperCase();localSet("user",currentUser)}
function navigate(page){currentPage=page;document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));$(page+"Page").classList.remove("hidden");document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("pageTitle").textContent=page==="overview"?"Overview":page==="seats"?"Seat allocation":"My bookings";if(page==="seats")renderSeats();if(page==="bookings")renderBookings();window.scrollTo(0,0)}
async function loadData(){
  const savedUser=localGet("user");setUser(savedUser?.name||"Guest User",savedUser?.email||"demo@seatwise.local");
  if(supabaseReady){
    try{
      const [z,s,b]=await Promise.all([db.from("zones").select("*").order("name"),db.from("seats").select("*").order("seat_number"),db.from("bookings").select("*, seats(seat_number, zone_id), users(full_name,email)").order("start_time",{ascending:false})]);
      if(z.error||s.error||b.error)throw z.error||s.error||b.error;
      zones=z.data||zones;seats=s.data||seats;bookings=(b.data||[]).map(x=>({...x,seat_number:x.seats?.seat_number,zone_id:x.seats?.zone_id,user_name:x.users?.full_name,user_email:x.users?.email}));
    }catch(e){console.error(e);toast("Database connection issue. Showing demo data.");}
  }else{
    bookings=localGet("bookings")||[];
  }
  renderAll();
}
function saveDemo(){if(!supabaseReady)localSet("bookings",bookings)}
function renderAll(){renderZones();renderStats();renderSeats();renderBookings();renderNextBooking();populateZoneFilter()}
function renderZones(){
  $("zoneCards").innerHTML=zones.map(z=>{const count=seats.filter(s=>s.zone_id===z.id).length;return `<article class="zone-card" data-zone="${z.id}"><div class="zone-art" style="background:${z.color||"#f0efff"}">${z.icon||"▦"}</div><h4>${z.name}</h4><p>${z.description||"Flexible workspace"}</p><div class="zone-meta"><span>${count} seats</span><b>Explore →</b></div></article>`}).join("");
  document.querySelectorAll(".zone-card").forEach(c=>c.onclick=()=>{navigate("seats");$("zoneFilter").value=c.dataset.zone;renderSeats()});
}
function renderStats(){
  const active=bookings.filter(isActive);const bookedNow=new Set(bookings.filter(b=>b.status==="confirmed"&&new Date(b.start_time)<=new Date()&&new Date(b.end_time)>new Date()).map(b=>b.seat_id));
  $("totalSeats").textContent=seats.length;$("availableSeats").textContent=seats.length-bookedNow.size;$("myBookingCount").textContent=bookings.filter(b=>b.user_email===currentUser.email&&isActive(b)).length;$("zoneCount").textContent=zones.length;
}
function populateZoneFilter(){const old=$("zoneFilter").value;$("zoneFilter").innerHTML='<option value="all">All zones</option>'+zones.map(z=>`<option value="${z.id}">${z.name}</option>`).join("");if(old)$("zoneFilter").value=old}
function seatIsBooked(seatId){const start=new Date($("startTime")?.value||new Date().toISOString());const end=new Date($("endTime")?.value||new Date(Date.now()+3600000).toISOString());return bookings.some(b=>b.seat_id===seatId&&b.status==="confirmed"&&new Date(b.start_time)<end&&new Date(b.end_time)>start)}
function renderSeats(){
  const zone=$("zoneFilter").value||"all",type=$("typeFilter").value||"all",search=($("seatSearch").value||"").toLowerCase();
  const list=seats.filter(s=>(zone==="all"||s.zone_id===zone)&&(type==="all"||s.seat_type===type)&&s.seat_number.toLowerCase().includes(search));
  $("seatGrid").innerHTML=list.map(s=>{const booked=seatIsBooked(s.id);return `<button class="seat-card ${booked?"booked":""}" data-seat="${s.id}" ${booked?"disabled":""}><span class="seat-symbol">▤</span><span><b>${s.seat_number}</b><small>${s.seat_type} · ${zoneName(s.zone_id)}</small></span><span class="seat-status">${booked?"Booked":"Available"}</span></button>`}).join("")||'<div class="empty-state">No seats match these filters.</div>';
  document.querySelectorAll(".seat-card:not(:disabled)").forEach(c=>c.onclick=()=>openBooking(c.dataset.seat));
}
function renderBookings(){
  const mine=bookings.filter(b=>b.user_email===currentUser.email).sort((a,b)=>new Date(b.start_time)-new Date(a.start_time));
  $("bookingTotal").textContent=mine.length+" reservations";$("emptyBookings").style.display=mine.length?"none":"block";
  $("bookingRows").innerHTML=mine.map(b=>{const seat=seatById(b.seat_id);const seatNo=b.seat_number||seat?.seat_number||"Seat";const zone=zoneName(b.zone_id||seat?.zone_id);return `<tr><td><b>${seatNo}</b></td><td>${zone}</td><td>${new Date(b.start_time).toLocaleDateString()}</td><td>${new Date(b.start_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} – ${new Date(b.end_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</td><td><span class="status-tag">${b.status||"confirmed"}</span></td><td>${b.status==="confirmed"&&new Date(b.end_time)>new Date()?`<button class="cancel-btn" data-cancel="${b.id}">Cancel</button>`:"—"}</td></tr>`}).join("");
  document.querySelectorAll("[data-cancel]").forEach(btn=>btn.onclick=()=>cancelBooking(btn.dataset.cancel));
}
function renderNextBooking(){
  const next=bookings.filter(b=>b.user_email===currentUser.email&&b.status==="confirmed"&&new Date(b.start_time)>new Date()).sort((a,b)=>new Date(a.start_time)-new Date(b.start_time))[0];
  if(!next){$("nextBooking").innerHTML='<div class="empty-state">No upcoming bookings yet. Reserve a seat to see it here.</div>';return}
  const s=seatById(next.seat_id);$("nextBooking").innerHTML=`<div class="next-row"><div class="seat-thumb">▤</div><div><b>${next.seat_number||s?.seat_number||"Workspace seat"}</b><small>${zoneName(next.zone_id||s?.zone_id)} · ${next.purpose||"Work session"}</small></div><div class="next-date">${dateTime(next.start_time)}<small>Until ${new Date(next.end_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</small></div></div>`;
}
function openBooking(seatId){
  selectedSeat=seatById(seatId);if(!selectedSeat)return;
  $("selectedSeatLabel").textContent=selectedSeat.seat_number+" · "+zoneName(selectedSeat.zone_id)+" · "+selectedSeat.seat_type;
  $("userFullName").value=currentUser.name==="Guest User"?"":currentUser.name;$("userEmail").value=currentUser.email==="demo@seatwise.local"?"":currentUser.email;
  const start=new Date();start.setMinutes(Math.ceil(start.getMinutes()/30)*30,0,0);const end=new Date(start.getTime()+3600000);
  const localInput=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
  $("startTime").value=localInput(start);$("endTime").value=localInput(end);$("formMessage").textContent="";$("bookingModal").classList.remove("hidden");
}
function closeModal(){$("bookingModal").classList.add("hidden");selectedSeat=null}
async function getOrCreateUser(name,email){
  if(!supabaseReady)return {id:"demo-"+email,email,full_name:name};
  let {data,error}=await db.from("users").select("*").eq("email",email).maybeSingle();if(error)throw error;
  if(!data){const result=await db.from("users").insert({full_name:name,email}).select().single();if(result.error)throw result.error;data=result.data}
  return data;
}
async function createBooking(e){
  e.preventDefault();const name=$("userFullName").value.trim(),email=$("userEmail").value.trim().toLowerCase(),start=$("startTime").value,end=$("endTime").value;
  if(new Date(end)<=new Date(start)){$("formMessage").textContent="End time must be after start time.";return}
  if(new Date(start)<new Date(Date.now()-60000)){$("formMessage").textContent="Please choose a future time.";return}
  $("confirmBooking").disabled=true;$("confirmBooking").textContent="Saving...";
  try{
    if(supabaseReady){
      const user=await getOrCreateUser(name,email);
      const {data,error}=await db.rpc("book_seat",{p_seat_id:selectedSeat.id,p_user_id:user.id,p_start_time:new Date(start).toISOString(),p_end_time:new Date(end).toISOString(),p_purpose:$("purpose").value});
      if(error)throw error;if(data?.error)throw new Error(data.error);
    }else{
      const conflict=bookings.some(b=>b.seat_id===selectedSeat.id&&b.status==="confirmed"&&new Date(b.start_time)<new Date(end)&&new Date(b.end_time)>new Date(start));
      if(conflict)throw new Error("This seat has already been booked for that time.");
      bookings.push({id:"b"+Date.now(),seat_id:selectedSeat.id,seat_number:selectedSeat.seat_number,zone_id:selectedSeat.zone_id,user_email:email,user_name:name,start_time:new Date(start).toISOString(),end_time:new Date(end).toISOString(),purpose:$("purpose").value,status:"confirmed"});
      saveDemo();
    }
    setUser(name,email);await loadData();closeModal();toast("Your seat has been reserved!");
  }catch(err){$("formMessage").textContent=err.message||"Could not save booking.";console.error(err)}
  finally{$("confirmBooking").disabled=false;$("confirmBooking").textContent="Confirm reservation"}
}
async function cancelBooking(id){
  if(!confirm("Cancel this reservation?"))return;
  try{
    if(supabaseReady){const {error}=await db.from("bookings").update({status:"cancelled"}).eq("id",id);if(error)throw error}
    else{bookings=bookings.map(b=>b.id===id?{...b,status:"cancelled"}:b);saveDemo()}
    await loadData();toast("Booking cancelled.");
  }catch(e){toast(e.message||"Unable to cancel booking.")}
}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));
$("findSeatBtn").onclick=()=>navigate("seats");$("bookAnotherBtn").onclick=()=>navigate("seats");
$("closeModal").onclick=closeModal;$("bookingModal").addEventListener("click",e=>{if(e.target===$("bookingModal"))closeModal()});
$("bookingForm").addEventListener("submit",createBooking);
["zoneFilter","typeFilter","seatSearch"].forEach(id=>$(id).addEventListener("input",renderSeats));
$("startTime").addEventListener("change",renderSeats);$("endTime").addEventListener("change",renderSeats);
$("userButton").onclick=()=>{const name=prompt("Enter your display name:",currentUser.name);if(name?.trim()){const email=prompt("Enter your email:",currentUser.email);if(email?.trim())setUser(name.trim(),email.trim().toLowerCase());renderAll()}};
$("todayLabel").textContent=new Date().toLocaleDateString([],{weekday:"long",month:"long",day:"numeric"});
loadData();

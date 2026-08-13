/* ═══════════ MODELLI VVF — core condiviso ═══════════
   Config Firebase, autenticazione (email + PIN), overlay/toast,
   helper data/ora comuni a dashboard e a tutti i moduli.
   La apiKey NON e' un segreto: la protezione sta nelle security
   rules di Firestore (ogni utente legge/scrive solo i propri doc). */
var FB_CFG = {
  apiKey: "AIzaSyAydXyoJulUJ_UFc2HHJ3vXtoULNNx90Jk",
  authDomain: "modelli-vvf.firebaseapp.com",
  projectId: "modelli-vvf",
  storageBucket: "modelli-vvf.firebasestorage.app",
  messagingSenderId: "621514452342",
  appId: "1:621514452342:web:8018a3722e7c5572f35e57"
};
var CRED_KEY = 'vvf_creds';
var DEF_CMD  = 'Ing. Salvatore Angelo CAPOLONGO';

firebase.initializeApp(FB_CFG);
var fbAuth = firebase.auth(), fbDb = firebase.firestore();
try{ fbDb.enablePersistence({synchronizeTabs:true}).catch(function(){}); }catch(e){}

function slugify(e){return String(e||'').toLowerCase().replace(/@.*$/,'').replace(/[^a-z0-9]/g,'.');}
function getCreds(){try{return JSON.parse(localStorage.getItem(CRED_KEY));}catch(e){return null;}}
function clearCreds(){localStorage.removeItem(CRED_KEY);}

function authErr(e){
  var c=e&&e.code;
  if(c==='auth/wrong-password'||c==='auth/invalid-credential')return 'PIN errato';
  if(c==='auth/invalid-email')return 'Email non valida';
  if(c==='auth/weak-password')return 'PIN non accettato';
  if(c==='auth/network-request-failed')return 'Nessuna connessione';
  if(c==='auth/too-many-requests')return 'Troppi tentativi, riprova piu\' tardi';
  return 'Accesso non riuscito';
}

/* Login/registrazione con email+PIN (usato solo dalla dashboard). */
function fbLogin(email,pin){
  return fbAuth.signInWithEmailAndPassword(email,pin)
    .catch(function(e){
      var c=e&&e.code;
      if(c==='auth/user-not-found'||c==='auth/invalid-credential'||c==='auth/invalid-login-credentials'){
        return fbAuth.createUserWithEmailAndPassword(email,pin).catch(function(e2){
          if(e2&&e2.code==='auth/email-already-in-use'){
            var er=new Error('pin');er.code='auth/wrong-password';throw er;
          }
          throw e2;
        });
      }
      throw e;
    });
}

/* Per le pagine modulo: richiede una sessione valida, altrimenti torna alla dashboard. */
function requireAuth(cb){
  var unsub=fbAuth.onAuthStateChanged(function(u){
    unsub();
    if(u)cb(u);
    else window.location.href='index.html';
  });
}

/* ─── overlay / toast ─── */
function showOv(t){
  var el=document.getElementById('overlay');if(!el)return;
  document.getElementById('spintxt').textContent=t;
  el.classList.remove('hidden');
}
function hideOv(){var el=document.getElementById('overlay');if(el)el.classList.add('hidden');}
function toast(m,c){
  var el=document.getElementById('toast');if(!el)return;
  el.textContent=m;el.className='toast '+(c||'');void el.offsetWidth;el.classList.add('show');
  setTimeout(function(){el.classList.remove('show');},2600);
}
function setDot(c,l){
  var d=document.getElementById('cdot'),lb=document.getElementById('clbl');
  if(d)d.className='sdot '+c;if(lb)lb.textContent=l;
}
function updTime(t){
  var el=document.getElementById('ctime');if(!el||!t)return;
  var p=function(n){return String(n).padStart(2,'0');};
  el.textContent=p(t.getHours())+':'+p(t.getMinutes());
}

/* ─── data/ora ─── */
function pad2(n){return String(n).padStart(2,'0');}
function oggiIt(){var d=new Date();return pad2(d.getDate())+'/'+pad2(d.getMonth()+1)+'/'+d.getFullYear();}
function mese2label(v){
  if(!v)return'';
  var m=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  return m[parseInt(v.split('-')[1],10)-1]||v;
}
function nowMese(){var d=new Date();return d.getFullYear()+'-'+pad2(d.getMonth()+1);}

/* ─── Firestore: un documento per utente per modulo ─── */
function moduleDocRef(collection){
  if(!fbAuth.currentUser)return null;
  return fbDb.collection(collection).doc(fbAuth.currentUser.uid);
}
function loadModuleData(collection){
  var ref=moduleDocRef(collection);
  if(!ref)return Promise.reject(0);
  return ref.get().then(function(s){return s.exists?s.data():{init:true};});
}
function saveModuleData(collection,data){
  var ref=moduleDocRef(collection);
  if(!ref)return Promise.reject(0);
  return ref.set(data);
}

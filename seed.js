/* =====================================================================
   Bamako Move — preloaded plan
   ---------------------------------------------------------------------
   HOW TO ADD TASKS LATER WITHOUT TOUCHING YOUR EXISTING DATA
   1. Add new rows at the end of SEED_TASKS with a NEW, unique id
      (e.g. 'x1', 'x2'). Never reuse or rename an existing id.
   2. Increase SEED_VERSION by 1.
   3. Upload the file. On next open, the app adds ONLY the rows whose id
      it has never seen. Tasks you edited, completed or deleted are left
      exactly as they are (deleted seed tasks never come back).

   Row format:
   [id, category, window, title, minutes, priority, options]
     window   'MM-DD' (one day) or 'MM-DD..MM-DD' (a window), null = unscheduled
     priority C = Critical, H = High, N = Normal, L = Low
     options  k:1  suitable for kids' days   k:0 never on kids' days
              o:1  ongoing across the whole window (e.g. answering buyers)
              f:1  fixed date (never moved by the planner)
              d:[] prerequisite ids
              sub:[] checklist items, desc:'' description
   ===================================================================== */
window.SEED_VERSION = 1;

window.SEED_TASKS = [
  // ---------- A. Vehicle sale ----------
  ['v1','vehicle','11-02','Gather ownership & registration documents',20,'H',{k:1}],
  ['v2','vehicle','11-02','Gather maintenance records and spare keys',20,'N',{k:1}],
  ['v3','vehicle','11-02','Check for any outstanding lien or financing',20,'H',{k:1}],
  ['v4','vehicle','11-02','Research comparable vehicles and set asking price',45,'H',{}],
  ['v5','vehicle','11-02','Decide minimum acceptable sale price',10,'H',{k:1,d:['v4']}],
  ['v6','vehicle','11-02','Create vehicle sale checklist',15,'N',{k:1}],
  ['v7','vehicle','11-03','Clean and prepare the vehicle',120,'H',{}],
  ['v8','vehicle','11-03','Photograph exterior, interior, odometer and details',45,'H',{d:['v7']}],
  ['v9','vehicle','11-03','Prepare Marketplace and other listings',45,'H',{d:['v8','v4']}],
  ['v10','vehicle','11-04','Publish vehicle listing',20,'C',{k:1,d:['v9']}],
  ['v11','vehicle','11-04..12-10','Respond to inquiries & track interested buyers',15,'H',{o:1,d:['v10'],desc:'Ongoing. Keep a short note of each buyer in the task notes.'}],
  ['v12','vehicle','11-09..11-19','Arrange viewings and test drives (child-free weekdays)',60,'H',{o:1,d:['v10']}],
  ['v13','vehicle','11-09..11-19','Negotiate offers and keep the listing updated',20,'H',{o:1,d:['v10']}],
  ['v14','vehicle','11-16..11-19','Review price if there is insufficient interest',20,'H',{k:1,d:['v10']}],
  ['v15','vehicle','11-20..12-03','Continue viewings and negotiations',60,'H',{o:1,d:['v10']}],
  ['v16','vehicle','11-20..12-03','Prepare ownership transfer and payment process',45,'H',{desc:'Check ICBC transfer paperwork and agree a safe payment method (e.g. verify a bank draft at the issuing bank).'}],
  ['v17','vehicle','11-20..12-03','Decide whether to lower the price',15,'N',{k:1}],
  ['v18','vehicle','12-04','Review sale status — if unsold, activate backup plan',45,'C',{sub:['Dealer trade-in / offer','Vehicle-buying service quote','Revised asking price']}],
  ['v19','vehicle','12-10','Vehicle sold — or backup option completed',30,'C',{d:['v18'],desc:'Target deadline. If not sold, prioritise the backup option.'}],
  ['v20','vehicle','12-10..12-17','Complete ownership transfer',60,'C',{d:['v19'],desc:'Only after an accepted offer and confirmed payment.'}],
  ['v21','vehicle','12-10..12-17','Remove personal data from infotainment system',20,'H',{d:['v19']}],
  ['v22','vehicle','12-10..12-17','Remove personal belongings from vehicle',20,'N',{k:1,d:['v19']}],
  ['v23','vehicle','12-10..12-17','Cancel or adjust insurance (only after transfer)',20,'H',{k:1,d:['v20']}],
  ['v24','vehicle','12-10..12-17','Complete plate / registration steps',30,'H',{d:['v20']}],
  ['v25','vehicle','12-10..12-17','Arrange transport after losing vehicle access',30,'H',{d:['v19']}],

  // ---------- B. Phone number ----------
  ['p1','phone','11-02','Review Koodo account: number, account #, PIN, SIM/eSIM status',20,'H',{k:1}],
  ['p2','phone','11-02','Check whether the phone is unlocked',10,'H',{k:1}],
  ['p3','phone','11-02','List accounts that use this number for 2-factor sign-in',30,'H',{k:1}],
  ['p4','phone','11-03','Research Canadian number-porting options usable from Mali',60,'H',{desc:'Research & verify — do not assume any provider works internationally.'}],
  ['p5','phone','11-03','Compare Fongo and other VoIP / number-retention services',45,'H',{d:['p4'],sub:['Incoming SMS','Short-code SMS','Bank verification codes','Calls in/out','Usable from Mali','Port can be done while in Canada','Emergency-address / account setup requirements']}],
  ['p6','phone','11-04..11-06','Select a service — only after verifying its limitations',30,'C',{k:1,d:['p5']}],
  ['p7','phone','11-04..11-06','Confirm the number can be ported from Koodo, and how',30,'H',{k:1,d:['p6'],sub:['Port is possible from Koodo','Steps to port without losing the number','Must the Koodo line stay active during the port?']}],
  ['p8','phone','11-09..11-13','Complete number port while still in Canada',45,'C',{d:['p7'],desc:'Keep Koodo active until the port completes. Do NOT cancel Koodo manually.'}],
  ['p9','phone','11-09..11-13','Test incoming and outgoing calls',20,'H',{k:1,d:['p8']}],
  ['p10','phone','11-09..11-13','Test SMS from critical services',45,'H',{d:['p8'],sub:['Banks','Gmail','Apple ID','Microsoft','CRA','Other critical services']}],
  ['p11','phone','11-16..12-19','Test new service over Wi-Fi and mobile data',20,'H',{k:1,d:['p8']}],
  ['p12','phone','11-16..12-19','Confirm the service will work from Mali',30,'H',{d:['p8']}],
  ['p13','phone','11-16..12-19','Update 2FA for accounts that don’t support the new number',60,'H',{d:['p10']}],
  ['p14','phone','12-21..12-30','Final verification of phone service and account access',30,'C',{d:['p13']}],
  ['p15','phone','12-21..12-30','Remove Koodo SIM/eSIM (only after port & testing)',10,'N',{k:1,d:['p14']}],
  ['p16','phone','12-21..12-30','Confirm no remaining Koodo contract or device balance',15,'H',{k:1,d:['p8']}],

  // ---------- C. Taxes ----------
  ['t1','taxes','11-02','Contact Braham to request a tax meeting',15,'C',{k:1,sub:['Explain the move to Mali on Dec 31','Ask what information he needs before the meeting']}],
  ['t2','taxes','11-09..11-13','Schedule tax meeting with Braham',10,'H',{k:1,d:['t1']}],
  ['t3','taxes','11-09..11-13','Prepare questions for Braham',45,'H',{sub:['Canadian tax residency and departure date','CRA departure tax requirements','Departure tax return and forms','Employment and business income after departure','Canadian bank accounts and credit cards','Business ownership and contractor payments','Tax treatment of income earned in Mali','Is a Mali tax professional needed?','Documents to retain','Withholding or reporting obligations']}],
  ['t4','taxes','11-16..11-20','Gather tax records and documents',90,'H',{}],
  ['t5','taxes','11-16..11-20','Summarise Canadian ties, housing, work, business and Mali plans',60,'H',{}],
  ['t6','taxes','11-16..11-20','Attend meeting with Braham',90,'C',{d:['t2','t3','t4','t5']}],
  ['t7','taxes','11-16..11-23','Record decisions, action items and missing documents',30,'H',{d:['t6']}],
  ['t8','taxes','11-23..12-10','Complete tax follow-up actions',30,'H',{o:1,d:['t7']}],
  ['t9','taxes','11-23..12-10','Obtain written clarification on unresolved issues',30,'H',{d:['t7']}],
  ['t10','taxes','11-23..12-10','Save tax advice and documents in the move folder',15,'N',{k:1,d:['t7']}],

  // ---------- D. Electronics ----------
  ['e1','electronics','11-03','Create electronics inventory (model, serial, value, condition)',45,'H',{sub:['Computer tower','PS5','Monitors','Meta headset']}],
  ['e2','electronics','11-03','Photograph each device',30,'N',{}],
  ['e3','electronics','11-03','Check voltage compatibility for Mali',20,'H',{k:1,desc:'Check each power supply label (Mali uses roughly 220 V / 50 Hz).'}],
  ['e4','electronics','11-05','Research shipping options for electronics',60,'H',{sub:['Checked luggage','Cabin (where permitted)','Insured courier','Freight shipment','With personal effects']}],
  ['e5','electronics','11-05','Check airline baggage rules for PS5, monitors, headset',30,'H',{}],
  ['e6','electronics','11-05','Check carrier restrictions for devices with batteries',20,'N',{k:1}],
  ['e7','electronics','11-09..11-13','Decide which electronics travel with me vs. shipped',30,'C',{d:['e4','e5']}],
  ['e8','electronics','11-09..11-13','Get separate shipping quotes for electronics if needed',45,'H',{d:['e7']}],
  ['e9','electronics','11-09..11-13','Ask forwarders: insurance, packaging, tamper evidence, claims',30,'H',{}],
  ['e10','electronics','11-09..11-13','Decide: ship computer assembled or disassembled',20,'N',{k:1}],
  ['e11','electronics','11-09..11-13','Back up all computer data',120,'C',{}],
  ['e12','electronics','11-16..11-20','Remove sensitive data or encrypt drives',90,'H',{d:['e11']}],
  ['e13','electronics','11-16..11-20','Store serial numbers & photos separately',15,'N',{k:1,d:['e1','e2']}],
  ['e14','electronics','11-16..11-20','Obtain protective packaging for devices',45,'H',{d:['e7']}],
  ['e15','electronics','11-16..11-20','Prepare devices for shipment',90,'H',{d:['e12','e14'],desc:'No passwords or account credentials inside the shipment.'}],
  ['e16','electronics','12-01..12-10','Photograph electronics packaging before sealing',20,'H',{d:['e15']}],
  ['e17','electronics','12-01..12-10','Photograph sealed cartons; record dimensions & weight',30,'H',{d:['e16']}],
  ['e18','electronics','12-01..12-10','Save insurance and shipping documents for electronics',15,'H',{k:1}],
  ['e19','electronics','12-01..12-10','Keep electronics inventory separate from the cartons',10,'N',{k:1}],

  // ---------- E. Marketplace ----------
  ['m1','market','11-02..11-05','Photograph large items for sale',60,'H',{sub:['Desk','Office chair','Stationary bike','Beds and mattresses','Furniture not being shipped','TV (optional)','Adjustable dumbbells (if shipping isn’t economical)']}],
  ['m2','market','11-02..11-05','List large items on Marketplace',90,'H',{d:['m1'],desc:'Track each item in Tasks → Sale items.'}],
  ['m3','market','11-09..11-19','Respond to inquiries and track offers',15,'H',{o:1,d:['m2']}],
  ['m4','market','11-09..11-19','Schedule viewings/pickups on child-free weekdays',15,'H',{o:1,d:['m2']}],
  ['m5','market','11-09..11-19','Update prices if needed',20,'N',{k:1,d:['m2']}],
  ['m6','market','11-20..12-03','List remaining items',60,'H',{}],
  ['m7','market','11-20..12-03','Bundle low-value items',30,'N',{}],
  ['m8','market','11-20..12-03','Set firm pickup deadlines with buyers',15,'H',{k:1}],
  ['m9','market','12-04..12-10','Final sale window for large items',30,'H',{o:1}],
  ['m10','market','12-04..12-10','Reduce prices on unsold items',20,'H',{k:1}],
  ['m11','market','12-11..12-17','Final Marketplace pickups',30,'H',{o:1}],
  ['m12','market','12-11..12-17','Mark unsold items for donation or disposal',20,'H',{k:1}],

  // ---------- F. Donations ----------
  ['d1','donate','11-13','Research donation centres and accepted items',45,'N',{}],
  ['d2','donate','11-13','Confirm opening hours, pickup requirements and restrictions',20,'N',{k:1,d:['d1']}],
  ['d3','donate','11-13','Identify drop-off locations by item type',20,'N',{k:1,sub:['Clothes','Books','Food','Utensils','Toys','Household items']}],
  ['d4','donate','11-20','Create donation inventory',90,'H',{sub:['Clothing','Books','Toys','Food','Kitchen utensils','Household goods','Electronics','Recycling','Waste']}],
  ['d5','donate','11-27','Arrange donation drop-off or collection',30,'H',{d:['d1','d4']}],
  ['d6','donate','12-04','First donation run',120,'H',{d:['d5']}],
  ['d7','donate','12-11','Final donation run',150,'C',{d:['d6']}],
  ['d8','donate','12-11','Dispose of items not accepted by donation centres',60,'H',{}],
  ['d9','donate','12-18','Confirm no unsold or unwanted items remain',30,'C',{d:['d7','d8']}],

  // ---------- G. Packing ----------
  ['k1','packing','11-09','Buy packing materials',60,'H',{}],
  ['k2','packing','11-09','Create carton numbering system',20,'N',{k:1}],
  ['k3','packing','11-09','Set up carton inventory list',30,'N',{k:1}],
  ['k4','packing','11-13..11-19','Pack books (small boxes)',120,'H',{d:['k1']}],
  ['k5','packing','11-13..11-19','Pack off-season clothes',90,'N',{d:['k1']}],
  ['k6','packing','11-13..11-19','Pack decor and nonessential items',90,'N',{d:['k1']}],
  ['k7','packing','11-13..11-19','Label cartons: number, contents, destination',30,'N',{k:1}],
  ['k8','packing','11-27..12-03','Pack kitchen (except daily-use items)',180,'H',{}],
  ['k9','packing','11-27..12-03','Pack living room, bedroom and storage',180,'H',{}],
  ['k10','packing','11-27..12-03','Photograph contents before closing each carton',30,'N',{}],
  ['k11','packing','11-27..12-03','Record carton dimensions and weight',45,'N',{}],
  ['k12','packing','12-04..12-10','Pack remaining nonessential items',180,'H',{desc:'Keep daily-use items accessible.'}],
  ['k13','packing','12-08..12-11','Finish shipment packing (before freight handover)',180,'C',{d:['k12'],desc:'Your plan had this Dec 11–17, but the freight handover target is Dec 11, so it is placed just before. Move it if your carrier cutoff is later.'}],
  ['k14','packing','12-08..12-11','Confirm final carton dimensions and weight',30,'H',{d:['k13']}],
  ['k15','packing','12-08..12-11','Complete shipping inventory',45,'H',{d:['k13']}],

  // ---------- H. Freight ----------
  ['f1','freight','11-02','Contact freight forwarders for quotes',60,'C',{sub:['Air and sea/alternative route estimates','Destination charges in Bamako','Customs clearance and delivery','Late-December pickup or storage']}],
  ['f2','freight','11-05','Compare freight quotes',45,'H',{d:['f1'],sub:['Route','Transit time','Insurance','Chargeable weight','Exclusions']}],
  ['f3','freight','11-09','Select preferred freight provider',30,'H',{d:['f2']}],
  ['f4','freight','11-09','Confirm collection before Dec 20 or holding until later',15,'H',{k:1,d:['f3']}],
  ['f5','freight','11-13','Confirm shipping requirements and paperwork',30,'H',{k:0,d:['f3']}],
  ['f6','freight','11-27','Confirm shipment schedule',15,'H',{k:1,d:['f5']}],
  ['f7','freight','11-27','Prepare customs inventory and documents',60,'H',{}],
  ['f8','freight','12-11..12-17','Freight handover (target Dec 11, subject to carrier cutoff)',120,'C',{d:['f6','f7','k13','k14','k15']}],
  ['f9','freight','12-11..12-17','Save receipt, tracking number, measurements and documents',15,'H',{k:1,d:['f8']}],
  ['f10','freight','12-11..12-17','Send shipment details to Bamako consignee / clearing agent',20,'H',{k:1,d:['f8']}],
  ['f11','freight','12-11..12-31','Track shipment; keep customs documents accessible',10,'N',{o:1,d:['f8']}],

  // ---------- I. Apartment, internet, utilities ----------
  ['a1','apartment','11-02','Review lease and notice requirements',30,'C',{k:1}],
  ['a2','apartment','11-02','Identify move-out and key-return date',10,'C',{k:1,d:['a1']}],
  ['a3','apartment','11-02','Contact landlord / property manager',15,'H',{k:1,d:['a1']}],
  ['a4','apartment','11-02','Request inspection and cleaning requirements',10,'H',{k:1,d:['a3']}],
  ['a5','apartment','11-05','Send formal notice (if required)',20,'C',{k:1,d:['a1'],desc:'Check your lease for the notice period and required form. Send in writing.'}],
  ['a6','apartment','11-05','Get written confirmation of notice',10,'H',{k:1,d:['a5']}],
  ['i1','phone','11-09','Contact internet/TV provider about cancellation',30,'H',{k:1,sub:['Cancellation notice period','Equipment return','Final billing']}],
  ['i2','phone','11-09','Schedule internet/TV cancellation date',10,'H',{k:1,d:['i1']}],
  ['i3','phone','11-13','Confirm internet/TV cancellation and equipment return plan',15,'H',{k:1,d:['i2']}],
  ['a7','apartment','11-13','Check utilities and service termination dates',20,'N',{k:1}],
  ['a8','apartment','11-27','Confirm final inspection and key-return appointment',15,'C',{k:1}],
  ['a9','apartment','11-27','Confirm deposit return process',10,'H',{k:1}],
  ['a10','apartment','11-27','Confirm whether professional cleaning is required',10,'N',{k:1}],
  ['a11','apartment','12-18','Confirm final apartment clear-out date',10,'H',{k:1}],
  ['a12','apartment','12-21..12-24','Remove remaining belongings',180,'C',{}],
  ['a13','apartment','12-21..12-24','Clear storage, parking, mailbox, balcony and cupboards',120,'H',{}],
  ['i4','phone','12-21..12-24','Return internet/TV equipment',30,'H',{d:['i3']}],
  ['c1','cleaning','12-25..12-30','Deep clean kitchen and bathrooms',240,'C',{d:['a12']}],
  ['c2','cleaning','12-25..12-30','Clean floors, walls, windows and appliances',240,'C',{d:['a12']}],
  ['c3','cleaning','12-25..12-30','Photograph apartment condition',30,'H',{d:['c1','c2']}],
  ['c4','cleaning','12-25..12-30','Complete move-out inspection',60,'C',{d:['c3']}],
  ['c5','cleaning','12-25..12-30','Return keys, fobs and remotes',15,'C',{d:['c4']}],
  ['c6','cleaning','12-25..12-30','Obtain written acknowledgment of key return',15,'C',{d:['c5']}],

  // ---------- J. Address changes ----------
  ['b1','banking','11-09..11-13','Create address-change list',45,'H',{}],
  ['b2','banking','11-09..11-13','Identify accounts that must stay accessible from Mali',30,'H',{k:1}],
  ['b3','banking','11-16..11-20','Update banks and credit cards',60,'H',{d:['b1']}],
  ['b4','banking','11-16..11-20','Update CRA and government accounts',45,'H',{d:['b1']}],
  ['b5','banking','11-16..11-20','Update insurance, payroll and professional registrations',45,'N',{d:['b1']}],
  ['b6','banking','11-16..11-20','Update shopping and subscription accounts',30,'L',{k:1,d:['b1']}],
  ['b7','banking','11-23..12-10','Confirm account recovery and authentication',45,'H',{d:['b2']}],
  ['b8','banking','11-23..12-10','Save recovery codes securely',20,'H',{k:1}],
  ['b9','banking','11-23..12-10','Test account access from a non-Canadian network',30,'N',{}],

  // ---------- K. Travel ----------
  ['r1','travel','12-04','Create personal luggage checklist',20,'N',{k:1}],
  ['r2','travel','12-11','Prepare travel document folder',30,'C',{k:1}],
  ['r3','travel','12-11','Check baggage allowance and luggage weights',20,'H',{k:1}],
  ['r4','travel','12-18','Pack nonessential travel items',60,'N',{d:['r1']}],
  ['r5','travel','12-21..12-24','Pack final clothes and personal items',90,'H',{}],
  ['r6','travel','12-21..12-24','Keep passports, medication, valuables, key electronics accessible',10,'C',{k:1,desc:'Never in the freight shipment.'}],
  ['r7','travel','12-25..12-30','Final luggage check',30,'H',{d:['r5']}],
  ['r8','travel','12-29..12-30','Confirm flight status',10,'H',{k:1}],

  // ---------- L. Hotel & airport ----------
  ['h1','hotel','11-27','Research hotels near the airport',45,'N',{sub:['Cost','Parking','Airport transfer','Cancellation policy']}],
  ['h2','hotel','12-03','Book hotel with Dad',20,'C',{d:['h1']}],
  ['h3','hotel','12-18','Confirm hotel booking and airport transportation',15,'H',{k:1,d:['h2']}],
  ['h4','hotel','12-25..12-30','Check in at airport hotel with Dad (after handover)',30,'H',{d:['c6']}],
  ['h5','hotel','12-28..12-30','Reconfirm hotel stay and airport transfer',10,'N',{k:1,d:['h3']}],
  ['h6','hotel','12-31','Airport transfer',30,'C',{f:1}],

  // ---------- Fixed events ----------
  ['fam1','family','12-20',"Children fly to Mali ✈",0,'C',{f:1,desc:'From today the custody restriction no longer applies.'}],
  ['dep1','travel','12-31','Depart for Mali ✈',0,'C',{f:1}],

  // ---------- Ideas / unscheduled (no date on purpose) ----------
  ['u1','family',null,"Confirm children's travel documents and any consent letter with their other parent",30,'H',{k:1}],
  ['u2','travel',null,'Check passport validity and Mali entry/visa requirements',30,'C',{k:1}],
  ['u3','travel',null,'Check vaccination requirements for Mali (yellow fever certificate)',30,'H',{k:1}],
  ['u4','misc',null,'Refill prescriptions and collect medical records',45,'N',{}],
  ['u5','banking',null,'Set up mail forwarding or a mail-handling address in Canada',20,'N',{k:1}],
  ['u6','misc',null,'Cancel or pause subscriptions and memberships',30,'L',{k:1}],
];

// Move-readiness milestones: [key, label, [seed ids that must ALL be complete]]
window.MILESTONES = [
  ['vehicle','Vehicle sold or backup transport arranged',['v19']],
  ['phone','Phone number ported and tested',['p10','p14']],
  ['tax','Tax meeting with Braham completed',['t6']],
  ['shipping','Shipping booked and shipment handed over',['f3','f8']],
  ['notice','Apartment notice and move-out date confirmed',['a2','a6']],
  ['internet','Internet/TV cancellation and equipment return arranged',['i3']],
  ['donations','Donations and disposal completed',['d9']],
  ['travel','Travel documents and hotel confirmed',['r2','h3']],
  ['keys','Apartment cleaned and keys returned',['c6']],
];

// Sale items: [id, name, asking price, minimum price]
window.SEED_SALES = [
  ['s1','Vehicle',null,null],
  ['s2','Desk',null,null],
  ['s3','Office chair',null,null],
  ['s4','Stationary bike',null,null],
  ['s5','Beds',null,null],
  ['s6','Mattresses',null,null],
  ['s7','Other furniture (not shipping)',null,null],
  ['s8','TV (optional)',null,null],
  ['s9','Adjustable dumbbells (if not shipping)',null,null],
];

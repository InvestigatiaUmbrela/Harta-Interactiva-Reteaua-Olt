/* ============================================================
   REȚEAUA OLT — date extrase din harta Figma + transcriptul
   documentarului. Fiecare nod și fiecare relație poartă o sursă:
     'harta'      = apare explicit pe harta din Figma
     'documentar' = afirmat în naraţiunea documentarului
   ============================================================ */

const DISCLAIMER =
  "Informațiile de mai jos reproduc afirmațiile din documentar și din materialele " +
  "de presă citate în el. Toate persoanele menționate beneficiază de prezumția de nevinovăție.";

/* ---------- NODURI ---------- */
/* kind: person | office | company-state | company-private | service | event */

const NODES = [
  {
    id: "stanescu", kind: "person", x: 690, y: 215,
    label: ["Paul", "STĂNESCU"], eyebrow: "PSD",
    role: "Baronul. Mentorul politic al rețelei.",
    lead: "Politicianul care a cultivat structura din Olt și care, în goana după putere, a scos cândva toată România în stradă. În documentar apare drept omul care ridică scara pe care urcă toți ceilalți.",
    facts: [
      "Mentorul politic al lui Marius Oprescu, președintele Consiliului Județean Olt.",
      "O propulsează pe Mariana Moț în funcția de secretar de stat în Ministerul Justiției.",
      "Îl instalează pe Florin „Busi” Barbu la ANIF, iar ulterior acesta ajunge ministru al Agriculturii.",
      "În 2023 rețeaua se extinde la nivel național prin afacerea cu stuful din Delta Dunării.",
      "Documentarul îl leagă de Sorin Grindeanu, actualul lider PSD, drept omul care a mișcat sforile pentru Stănescu și Barbu."
    ],
    src: "harta"
  },
  {
    id: "cjolt", kind: "office", x: 470, y: 250,
    label: ["Președinte", "CJ OLT"],
    role: "Funcția-cheie a județului.",
    lead: "Consiliul Județean Olt este ordonatorul de credite care decide traseul banilor publici din județ: drumuri, spital, companii proprii, achiziții europene.",
    facts: [
      "Ocupată de Marius Oprescu, care ajunge aici la câțiva ani după ce fusese inculpat într-un dosar de ucidere din culpă.",
      "Controlează Spitalul Județean de Urgență Slatina și societatea Olt Drum.",
      "Prin CJ Olt s-a făcut cea mai scumpă achiziție de microbuze școlare electrice din România: aproximativ 262.000 € bucata."
    ],
    src: "harta"
  },
  {
    id: "oprescu", kind: "person", x: 500, y: 425,
    label: ["Marius", "OPRESCU"], eyebrow: "PSD",
    role: "Locotenentul devenit baron local.",
    lead: "Trece în câțiva ani de la statutul de inculpat într-un dosar de ucidere din culpă la președinte al Consiliului Județean Olt. Documentarul îl descrie drept nodul prin care trec contractele publice ale județului.",
    facts: [
      "3 octombrie 2013, Piatra Olt: un Toyota Hilux achiziționat la ISU, folosit nelegal ca mașină personală, lovește o căruță nesemnalizată cu patru persoane. Un bărbat de 34 de ani moare după câteva săptămâni.",
      "Refuză etilotestul; recoltarea probei de sânge se face într-un cabinet, fără supravegherea polițiștilor.",
      "Rechizitoriul Parchetului de pe lângă Curtea de Apel Craiova arată că proba din seara accidentului are grupa A1, în timp ce Oprescu are grupa 0.",
      "În 2017 Judecătoria Slatina îl achită.",
      "Este nașul lui Emil Moț și cumnatul lui Nicușor Rada, primarul din Piatra-Olt.",
      "În 2009 apare în sala Consiliului Județean Olt, în dreapta interlopului Bercea Mondial, la ceremonia în care acesta e numit „președintele romilor”."
    ],
    src: "harta"
  },
  {
    id: "mariana", kind: "person", x: 320, y: 222,
    label: ["Mariana", "MOȚ"],
    role: "Omul-punte între partid și justiție.",
    lead: "Apropiată a lui Paul Stănescu, ajunge secretar de stat în Ministerul Justiției. Este mama lui Emil Moț, primarul Slatinei.",
    facts: [
      "Propulsată de Paul Stănescu în funcția de secretar de stat în Ministerul Justiției.",
      "Presa a documentat că este moașă în familia Bercea — o legătură de cumetrie cu clanul interlop.",
      "Fiul ei, Emil Moț, ajunge primar al Slatinei, iar nașul lui este Marius Oprescu."
    ],
    src: "harta"
  },
  {
    id: "primarslatina", kind: "office", x: 310, y: 336,
    label: ["Primar", "SLATINA"],
    role: "Primăria municipiului reședință de județ.",
    lead: "Împreună cu Compania de Apă Olt, Primăria Slatina devine, în relatarea documentarului, poarta prin care se aranjează licitații sau se atribuie direct proiecte către contractorii de casă.",
    facts: [
      "Ocupată de Emil Moț, finul lui Marius Oprescu și fiul Marianei Moț.",
      "În vara lui 2024 candidatul rețelei pierde municipiul Slatina — primul șoc real al structurii.",
      "Urmează demisii în cascadă, de la primărie până la Compania de Apă Olt."
    ],
    src: "harta"
  },
  {
    id: "emilmot", kind: "person", x: 300, y: 464,
    label: ["Emil", "MOȚ"], eyebrow: "PSD",
    role: "Primarul Slatinei. Finul lui Oprescu.",
    lead: "Fiul Marianei Moț și finul lui Marius Oprescu. Alianța dintre Primăria Slatina și Consiliul Județean închide cercul local de putere.",
    facts: [
      "Pierde al treilea mandat la Slatina în vara lui 2024.",
      "Apare în dosarul DIICOT în care este implicată și Marina Pandarov.",
      "Au apărut informații că ar fi fost filmat consumând droguri alături de Pandarov.",
      "Socrul său, Vasile Covaciu, fost angajat SRI, ajunge director adjunct la Compania de Apă Olt."
    ],
    src: "harta"
  },
  {
    id: "primarpiatra", kind: "office", x: 900, y: 340,
    label: ["Primar", "PIATRA-OLT"],
    role: "Primăria care semnează autorizațiile.",
    lead: "Primăria din Piatra-Olt emite autorizațiile de construire pentru balastierele de pe Lunca Oltului — cheia întregii exploatări de agregate minerale.",
    facts: [
      "Ocupată de Nicușor Rada, cumnatul lui Marius Oprescu.",
      "Autorizații emise pentru balastiere pe terenuri agricole, fără scoatere din circuitul agricol.",
      "În schimb, Consiliul Județean alocă fonduri suplimentare acestei primării."
    ],
    src: "harta"
  },
  {
    id: "rada", kind: "person", x: 890, y: 450,
    label: ["Nicușor", "RADA"], eyebrow: "PSD",
    role: "Primarul din Piatra-Olt. Cumnatul lui Oprescu.",
    lead: "Semnătura lui deschide balastierele. Documentarul îl descrie ca fiind ținut în funcție prin fonduri alocate de cumnatul său de la Consiliul Județean.",
    facts: [
      "Emite autorizații de construire pentru balastiere pe terenuri agricole, fără scoatere din circuitul agricol.",
      "ANRM dă permise doar pe unele tarlale, dar excavatoarele intră și în perimetre neautorizate.",
      "Rezultatul, spune documentarul: dezastru ecologic pe Lunca Oltului."
    ],
    src: "harta"
  },
  {
    id: "spital", kind: "office", x: 980, y: 250,
    label: ["Spitalul JUDEȚEAN", "Slatina"],
    role: "Spitalul controlat de Consiliul Județean.",
    lead: "Instituția în care, în noaptea accidentului din 2013, se recoltează proba de sânge care nu se va potrivi cu cea a lui Marius Oprescu. Aceeași instituție plătește ulterior milioane către firma-fanion a rețelei.",
    facts: [
      "Recoltarea probei de sânge s-a făcut într-un cabinet, fără supravegherea polițiștilor.",
      "Procurorii notează suspiciuni grave privind procedura și implicarea managerului spitalului.",
      "A plătit aproape 15 milioane de lei către Wagramer Termo 2000, în timp ce evaluările estimează valoarea reală a lucrărilor la de trei ori mai puțin."
    ],
    src: "harta"
  },
  {
    id: "anif", kind: "office", x: 1150, y: 130,
    label: ["ANIF", "Min. Agriculturii"],
    role: "Robinetul național de bani pentru irigații.",
    lead: "Agenția Națională de Îmbunătățiri Funciare, condusă de un om de bază al lui Paul Stănescu, devine sursa celor mai mari plăți din poveste.",
    facts: [
      "A virat peste 500 de milioane de lei către Wagramer pentru modernizarea canalelor de irigații din Olt.",
      "Agricultorii locali nu au primit niciun strop de apă pe câmpuri — semn că lucrările fie nu au fost executate, fie au fost făcute de mântuială.",
      "Florin „Busi” Barbu, conducătorul ei de atunci, promovează ulterior ca ministru al Agriculturii."
    ],
    src: "harta"
  },
  {
    id: "busi", kind: "person", x: 1220, y: 250,
    label: ["Florin ‘Busi’", "BARBU"], eyebrow: "PSD",
    role: "Protejatul care ajunge ministru.",
    lead: "Deputat PSD de Olt, apropiat de Paul Stănescu, instalat la ANIF și promovat ministru al Agriculturii. În jurul lui, spune documentarul, amendamentele par să apară din neant.",
    facts: [
      "Sub conducerea lui, ANIF virează peste 500 de milioane de lei către Wagramer.",
      "Invocă paludicultura și susține că schimbările legislative din Deltă respectă regulile Uniunii Europene.",
      "Stufărișurile din Delta Dunării au fost recategorizate ca pășuni printr-o lege modificată pe repede înainte."
    ],
    src: "harta"
  },
  {
    id: "carmin", kind: "company-private", x: 1450, y: 185,
    label: ["CARMIN"],
    role: "Firma de casă de la vârful ministerului.",
    lead: "Companie privată descrisă pe hartă drept firma de casă a lui Florin „Busi” Barbu, către care acesta acordă proiecte.",
    facts: [
      "Relația e reciprocă pe hartă: el acordă proiecte, ea funcționează ca firmă de casă."
    ],
    src: "harta"
  },
  {
    id: "delta", kind: "event", x: 1400, y: 60,
    label: ["„Stuful din Delta Dunării”"], eyebrow: "2023 — extindere națională",
    role: "Momentul în care rețeaua iese din județ.",
    lead: "O lege modificată pe ascuns în Parlament transformă Delta Dunării în pășune. A doua zi, cineva merge la cadastru și schimbă în acte terenurile deltei din ape în pășuni. Prin ordin de ministru al agriculturii, stuful este transformat din pix.",
    facts: [
      "În Deltă se află cea mai mare suprafață compactă cu stuf din Europa; miza ajunge la sute de milioane de euro.",
      "Două firme, apărute peste noapte și cu același acționariat, ajung să controleze aproape tot stuful din Deltă.",
      "Resursele care ar fi trebuit să ajungă la toți oamenii din Deltă sunt capturate de grupuri restrânse și bine conectate politic.",
      "Amendamentele apar în jurul deputatului PSD de Olt Florin „Busi” Barbu."
    ],
    src: "harta"
  },
  {
    id: "sri", kind: "service", x: 118, y: 142,
    label: ["S.R.I."],
    role: "Filiera din spatele numirilor.",
    lead: "Doi dintre directorii Companiei de Apă Olt vin pe filiera serviciilor. Documentarul ridică întrebarea protecției informative de care s-ar fi bucurat rețeaua.",
    facts: [
      "Vasile Covaciu, socrul lui Emil Moț, este fost angajat SRI.",
      "Marius Cătălin Ușurelu ajunge tot director al Companiei de Apă Olt.",
      "Documentarul întreabă de ce rețeaua PSD Olt a fost lăsată în pace atâția ani."
    ],
    src: "harta"
  },
  {
    id: "coldea", kind: "person", x: 150, y: 312,
    label: ["Florian", "COLDEA"],
    role: "Numele care aduce în discuție protecția informativă.",
    lead: "Marina Pandarov este cunoscută în presă drept „blonda lui Coldea”. Documentarul folosește această legătură pentru a pune întrebarea protecției informative de care ar fi beneficiat rețeaua.",
    facts: [
      "Legătura apare pe hartă ca sprijin acordat Marinei Pandarov.",
      "Ridică întrebarea de ce rețeaua PSD Olt nu a fost deranjată ani la rând."
    ],
    src: "harta"
  },
  {
    id: "pandarof", kind: "person", x: 95, y: 484,
    label: ["Marina", "PANDAROV"],
    role: "„Blonda lui Coldea”.",
    lead: "Interceptată când negocia cantitatea de cocaină pe care să i-o trimită fostului director al Companiei de Apă din Slatina. Punctul în care drogurile intră în schema banilor publici.",
    facts: [
      "Apare în rechizitoriul DIICOT alături de Cătălin Ușurelu.",
      "În dosar este implicat și primarul Slatinei, Emil Moț.",
      "Banii din traficul de stupefiante ar fi fost folosiți pentru campaniile electorale ale unor lideri locali care protejau dealerii de droguri.",
      "Scandalul explodează în presă în vara lui 2024, imediat după pierderea Slatinei."
    ],
    src: "harta"
  },
  {
    id: "usurelu", kind: "person", x: 196, y: 666,
    label: ["Cătălin", "UȘURELU"], eyebrow: "Director C.A.O. · PSD",
    role: "Directorul companiei de apă din rechizitoriul DIICOT.",
    lead: "Marius Cătălin Ușurelu, director al Companiei de Apă Olt, apare în rechizitoriul DIICOT cumpărând și distribuind cocaină de la Marina Pandarov.",
    facts: [
      "Ajunge director pe filiera SRI.",
      "Interceptările din dosar surprind negocierea cantităților.",
      "Este fostul director al companiei de apă din Slatina din relatările de presă."
    ],
    src: "harta"
  },
  {
    id: "covaciu", kind: "person", x: 378, y: 666,
    label: ["Vasile", "COVACIU"], eyebrow: "Director C.A.O. · S.R.I.",
    role: "Socrul primarului, fost angajat SRI.",
    lead: "Socrul lui Emil Moț și fost angajat SRI, ajunge director adjunct la Compania de Apă Olt — instituția prin care trec licitațiile.",
    facts: [
      "Legătura de familie cu primarul Slatinei.",
      "Numirea vine pe filiera serviciilor.",
      "Pe hartă apare susținând Old&New Construct."
    ],
    src: "harta"
  },
  {
    id: "cao", kind: "company-state", x: 280, y: 780,
    label: ["COMPANIA DE", "APĂ OLT"],
    role: "Robinetul local de bani publici.",
    lead: "Compania de Apă Olt și Primăria Slatina devin poarta prin care se aranjează licitații sau se atribuie direct proiecte pentru contractorii de casă.",
    facts: [
      "Conducerea vine pe filiera SRI: Vasile Covaciu și Cătălin Ușurelu.",
      "Alimentează cu proiecte Old&New Construct, Panadria și Condor Păduraru.",
      "După scandalul din 2024, rețeaua își pierde accesul la robinetul de bani de aici."
    ],
    src: "harta"
  },
  {
    id: "oltdrum", kind: "company-state", x: 600, y: 558,
    label: ["OLT DRUM"],
    role: "Societatea de drumuri a Consiliului Județean.",
    lead: "Compania de stat a Consiliului Județean Olt. Nu doar cumpără de la firmele grupului, ci merge cu ele în tandem la licitații.",
    facts: [
      "Cumpără asfalt și balast de la Mineralport la prețuri descrise ca discutabile.",
      "Merge în tandem la licitații cu Mineralport.",
      "I-a plătit lui Adi Barbu milioane de lei pentru multiple lucrări și prestări de servicii."
    ],
    src: "harta"
  },
  {
    id: "mineralport", kind: "company-private", x: 786, y: 528,
    label: ["Mineralport"],
    role: "Nodul de agregate minerale.",
    lead: "Al doilea nod al lui Oprescu, pe agregate minerale, administrat de Claudiu Postolache, alături de familia de firme Unimineral.",
    facts: [
      "Exploatează balastiere deschise cu autorizațiile emise de primarul din Piatra-Olt.",
      "Vinde asfalt și balast către Olt Drum, compania Consiliului Județean.",
      "Merge în tandem la licitații cu Olt Drum."
    ],
    src: "harta"
  },
  {
    id: "wagramer", kind: "company-private", x: 988, y: 534,
    label: ["WAGRAMER", "TERMO 2000"],
    role: "Firma-fanion a rețelei.",
    lead: "Firma prin care, spune documentarul, se sifonează milioane de lei din contracte publice pe care chiar Oprescu le aranja în calitate de ordonator de credite. Administrată de fațadă de Valeriu Țițirigă.",
    facts: [
      "Peste 500 de milioane de lei de la ANIF pentru modernizarea canalelor de irigații din Olt.",
      "Aproape 15 milioane de lei de la Spitalul Județean Slatina, pentru lucrări evaluate la de trei ori mai puțin.",
      "Primește lucrări directe dinspre SGA Olt.",
      "Prin Panadria apar plăți circulare pe servicii fără acoperire."
    ],
    src: "harta"
  },
  {
    id: "postolache", kind: "person", x: 802, y: 654,
    label: ["Claudiu", "POSTOLACHE"],
    role: "Administratorul Mineralport.",
    lead: "Administrează Mineralport și familia de firme Unimineral — brațul de agregate minerale al rețelei.",
    facts: [
      "Primește proiecte de la Olt Drum.",
      "Primește plăți de la Panadria.",
      "Exploatările se întind și în perimetre neautorizate, dincolo de permisele ANRM."
    ],
    src: "harta"
  },
  {
    id: "titiriga", kind: "person", x: 992, y: 656,
    label: ["Valeriu", "ȚIȚIRIGĂ"],
    role: "Administratorul de fațadă.",
    lead: "Fost șofer de taxi și fost șofer la compania Condor Păduraru, ajunge administratorul de fațadă al Wagramer Termo 2000 — firma prin care trec sutele de milioane.",
    facts: [
      "Administrează formal firma-fanion a rețelei.",
      "Primește proiecte de la SGA Olt.",
      "Face plăți circulare cu Panadria."
    ],
    src: "harta"
  },
  {
    id: "sga", kind: "office", x: 856, y: 764,
    label: ["S.G.A.", "OLT"],
    role: "Sistemul de Gospodărire a Apelor Olt.",
    lead: "Instituția în care Adi Barbu este instalat și menținut, și care acordă lucrări directe către Wagramer și Valeriu Țițirigă.",
    facts: [
      "Adi Barbu este instalat și menținut aici.",
      "Dinspre SGA Olt, Wagramer primește lucrări directe."
    ],
    src: "harta"
  },
  {
    id: "panadria", kind: "company-private", x: 716, y: 764,
    label: ["PANADRIA"],
    role: "Firma-pivot pe zona de apă și lucrări civile.",
    lead: "Administrată de facto de Adi Barbu, este firma pivot care participă în circuitul ce duce banii prin firmele de casă.",
    facts: [
      "Primește proiecte de la Compania de Apă Olt.",
      "Face plăți lui Claudiu Postolache.",
      "Face plăți circulare cu Valeriu Țițirigă, pe servicii fără acoperire."
    ],
    src: "harta"
  },
  {
    id: "adrianbarbu", kind: "person", x: 802, y: 898,
    label: ["Adrian", "BARBU"],
    role: "Directorul SGA și administratorul de facto al Panadria.",
    lead: "Instalat și menținut la SGA Olt, este în același timp administratorul de facto al firmei de construcții Panadria — o poziție care închide circuitul dintre instituție și contractor.",
    facts: [
      "Primește proiecte de la Compania de Apă Olt.",
      "Olt Drum i-a plătit milioane de lei pentru multiple lucrări și prestări de servicii.",
      "Panadria este descrisă drept firma pivot pe zona de apă și lucrări civile."
    ],
    src: "harta"
  },
  {
    id: "oldnew", kind: "company-private", x: 512, y: 770,
    label: ["OLD&NEW", "CONSTRUCT"],
    role: "Constructorul de casă al Slatinei.",
    lead: "Firma de construcții care primește lucrări de la Compania de Apă Olt și de la Primăria Slatina.",
    facts: [
      "Controlată de Mircea „Pisicu” Ungureanu.",
      "Pe hartă apare achitând un comision de „10%” către Marius Oprescu.",
      "Primește proiecte direct de la președintele Consiliului Județean."
    ],
    src: "harta"
  },
  {
    id: "pisicu", kind: "person", x: 506, y: 898,
    label: ["Mircea ‘Pisicu’", "UNGUREANU"],
    role: "Interlopul devenit antreprenor de casă.",
    lead: "Și-a aliniat interesele cu ale baronului local, participând la fondul de protocol al rețelei. Istoricul lui penal — dosare de corupție și evaziune — a fost tărăgănat sau clasat.",
    facts: [
      "Firma lui, Old&New Construct, primește lucrări de la CAO și de la Primăria Slatina.",
      "Documentarul spune că rețeaua și-a protejat membrii, permițându-i să pice mereu în picioare.",
      "Rezultatul: drenarea resurselor publice și menținerea circuitului șpăgilor în sistem."
    ],
    src: "harta"
  },
  {
    id: "condor", kind: "company-private", x: 1078, y: 768,
    label: ["Condor", "PĂDURARU"],
    role: "Al doilea contractor major pe apă.",
    lead: "Unul dintre cei doi jucători cruciali către care Compania de Apă Olt atribuie lucrări.",
    facts: [
      "Primește proiecte de la Compania de Apă Olt.",
      "Valeriu Țițirigă, administratorul Wagramer, a fost șofer la această companie."
    ],
    src: "harta"
  },
  {
    id: "sorin", kind: "person", x: 1078, y: 898,
    label: ["Sorin", "PĂDURARU"],
    role: "Omul din spatele Condor.",
    lead: "Primește proiecte prin Compania de Apă Olt. Legătura lui cu Valeriu Țițirigă — fostul șofer al tatălui său — arată cât de scurtă e distanța dintre firmele care par independente.",
    facts: [
      "Condor Păduraru este unul dintre cei doi jucători cruciali pe zona de apă.",
      "Valeriu Țițirigă, administratorul de fațadă al Wagramer, a fost șoferul tatălui său."
    ],
    src: "harta"
  }
];

/* ---------- RELAȚII ---------- */
/* route: 'hvh' | 'vhv' | 'hv' | 'vh' | 'line'  — mid = coordonată absolută opțională */

const EDGES = [
  { from: "stanescu", to: "cjolt", label: "este Mentorul Politic al lui", route: "vhv", mid: 232,
    detail: "Baronul ridică scara, locotenentul urcă. Documentarul descrie transferul de putere dintre Paul Stănescu și Marius Oprescu ca pe o aterizare pe roți: relații politice, instituții prietene și o rețea care amortizează orice șoc.", src: "harta" },

  { from: "stanescu", to: "mariana", label: "o propulsează în funcția de Secretar de Stat în Ministerul Justiției", route: "hvh", mid: 430,
    detail: "Presa a documentat că Mariana Moț este apropiată a lui Paul Stănescu. Numirea ei într-o funcție de conducere din Ministerul Justiției este, în logica documentarului, piesa care leagă partidul de sistemul judiciar.", src: "harta" },

  { from: "stanescu", to: "busi", label: "l-a instalat pe", route: "hvh", mid: 950,
    detail: "Florin „Busi” Barbu este descris drept protejat al grupării și om de bază al lui Paul Stănescu. Instalat la ANIF, ajunge ulterior ministru al Agriculturii.", src: "harta" },

  { from: "stanescu", to: "delta", label: "împreună cu", route: "hvh", mid: 1120,
    detail: "În 2023 rețeaua iese din județ. Documentarul plasează extinderea națională — afacerea cu stuful din Delta Dunării — pe axa Stănescu–Barbu.", src: "harta" },

  { from: "busi", to: "delta", label: "împreună cu", route: "vhv", mid: 150,
    detail: "Stufărișurile din Deltă sunt recategorizate ca pășuni printr-o lege modificată pe repede înainte, iar Barbu, ministru al Agriculturii, invocă paludicultura și conformitatea cu regulile UE.", src: "harta" },

  { from: "busi", to: "carmin", label: "acordă proiecte către", route: "hvh", mid: 1330,
    detail: "Pe hartă, relația e bidirecțională: ministrul acordă proiecte, iar firma funcționează ca firmă de casă.", src: "harta" },

  { from: "carmin", to: "busi", label: "este firma de casă a lui", route: "hvh", mid: 1330, offset: 26,
    detail: "Tiparul se repetă identic la fiecare nivel al rețelei: instituția publică pe de o parte, firma de casă pe cealaltă, iar între ele o singură persoană.", src: "harta" },

  { from: "busi", to: "wagramer", label: "acordă proiecte lui", route: "vhv", mid: 470,
    detail: "Doar ANIF, condus atunci de Florin „Busi” Barbu, a virat peste 500 de milioane de lei către Wagramer pentru modernizarea canalelor de irigații din Olt. Agricultorii locali nu au primit niciun strop de apă pe câmpuri.", src: "harta" },

  { from: "cjolt", to: "spital", label: "controlează", route: "line",
    detail: "Spitalul Județean de Urgență Slatina se află în subordinea Consiliului Județean Olt — instituția condusă de Marius Oprescu.", src: "harta" },

  { from: "cjolt", to: "spital", label: "scapă de acuzare de ucidere prin", route: "line", offset: 24,
    detail: "În noaptea accidentului din 2013, recoltarea probei de sânge se face într-un cabinet, fără supravegherea polițiștilor. Rechizitoriul arată că proba din seara accidentului are grupa A1, în timp ce Oprescu are grupa 0. În 2017, Judecătoria Slatina îl achită.", src: "harta" },

  { from: "spital", to: "wagramer", label: "acordă proiecte lui", route: "vhv", mid: 400,
    detail: "Spitalul Județean de Urgență Slatina a plătit aproape 15 milioane de lei către Wagramer, în timp ce evaluările estimează valoarea reală a lucrărilor la de trei ori mai puțin.", src: "harta" },

  { from: "mariana", to: "primarslatina", label: "este Mama lui", route: "line",
    detail: "Legătura de sânge dintre secretarul de stat din Ministerul Justiției și primarul Slatinei. Presa a mai documentat că Mariana Moț este moașă în familia Bercea.", src: "harta" },

  { from: "oprescu", to: "primarslatina", label: "este Nașul lui", route: "hvh", mid: 400,
    detail: "Cumetria devine politică: nașul conduce Consiliul Județean, finul conduce Primăria Slatina. Alianța locală închide cercul.", src: "harta" },

  { from: "oprescu", to: "primarpiatra", label: "este Cumnatul lui", route: "hvh", mid: 700,
    detail: "Nicușor Rada, primarul din Piatra-Olt, este cumnatul lui Marius Oprescu. Semnătura lui deschide balastierele de pe Lunca Oltului.", src: "harta" },

  { from: "oprescu", to: "primarpiatra", label: "alocă fonduri suplimentare primăriei lui", route: "hvh", mid: 700, offset: 24,
    detail: "La schimb pentru autorizațiile de construire, Oprescu alocă fonduri suplimentare primăriei cumnatului său, pentru a-l ține în funcție.", src: "harta" },

  { from: "rada", to: "mineralport", label: "emite ilegal autorizații pentru", route: "vhv", mid: 495,
    detail: "Autorizații de construire pentru balastiere pe terenuri agricole, fără scoatere din circuitul agricol. ANRM dă permise doar pe unele tarlale, dar excavatoarele intră și în perimetre neautorizate. Rezultatul: dezastru ecologic pe Lunca Oltului.", src: "harta" },

  { from: "mineralport", to: "oprescu", label: "este firma de casă a lui", route: "vhv", mid: 372,
    detail: "Al doilea nod al lui Oprescu este pe agregate minerale: Mineralport, administrată de Claudiu Postolache, și familia de firme Unimineral.", src: "harta" },

  { from: "wagramer", to: "oprescu", label: "este firma de casă a lui", route: "vhv", mid: 348,
    detail: "Documentarul o numește firma fanion a lui Oprescu: administrată de fațadă de Valeriu Țițirigă, folosită pentru a sifona milioane de lei din contracte publice pe care chiar el le aranja în calitate de ordonator de credite.", src: "harta" },

  { from: "coldea", to: "pandarof", label: "o sprijină pe", route: "vh",
    detail: "Marina Pandarov este cunoscută în presă drept „blonda lui Coldea”. Numele aduce în discuție posibila protecție informativă și întrebarea de ce rețeaua PSD Olt a fost lăsată în pace atâția ani.", src: "harta" },

  { from: "pandarof", to: "emilmot", label: "îl aprovizionează cu droguri pe", route: "vhv", mid: 552,
    detail: "În dosarul DIICOT este implicat și primarul Slatinei. Au apărut informații că ar fi fost filmat consumând droguri alături de Pandarov.", src: "harta" },

  { from: "pandarof", to: "usurelu", label: "îl aprovizionează cu droguri pe", route: "vhv", mid: 604,
    detail: "Marina Pandarov a fost interceptată când negocia cantitatea de cocaină pe care să i-o trimită lui Cătălin Ușurelu, fostul director al companiei de apă din Slatina. Banii din traficul de stupefiante ar fi fost folosiți pentru campaniile electorale ale unor lideri locali care protejau dealerii de droguri.", src: "harta" },

  { from: "covaciu", to: "emilmot", label: "este Socrul lui", route: "vh",
    detail: "Vasile Covaciu, fost angajat SRI, este socrul primarului Slatinei — și ajunge director adjunct la Compania de Apă Olt.", src: "harta" },

  { from: "usurelu", to: "cao", label: "este Director la", route: "vhv", mid: 716,
    detail: "Marius Cătălin Ușurelu ajunge director al Companiei de Apă Olt pe filiera SRI. Apare în rechizitoriul DIICOT cumpărând și distribuind cocaină.", src: "harta" },

  { from: "covaciu", to: "cao", label: "este Director la", route: "vhv", mid: 716,
    detail: "Vasile Covaciu, socrul lui Emil Moț și fost angajat SRI, ajunge director adjunct la compania de apă.", src: "harta" },

  { from: "covaciu", to: "oldnew", label: "susține pe", route: "vhv", mid: 700,
    detail: "Directorul companiei de apă susține constructorul de casă. Old&New Construct primește lucrări atât de la CAO, cât și de la Primăria Slatina.", src: "harta" },

  { from: "oldnew", to: "oprescu", label: "achită comisionul de „10%”", route: "vhv", mid: 614,
    detail: "Pe hartă, relația dintre constructor și președintele Consiliului Județean este descrisă direct ca un comision de zece la sută.", src: "harta" },

  { from: "oprescu", to: "oldnew", label: "acordă proiecte direct lui", route: "vhv", mid: 646,
    detail: "Contractele merg în ambele sensuri: proiecte publice într-o direcție, comision în cealaltă.", src: "harta" },

  { from: "oprescu", to: "oltdrum", label: "controlează", route: "vhv", mid: 505,
    detail: "Olt Drum este societatea Consiliului Județean Olt. Nu se rezumă la a cumpăra de la firmele grupului: merge cu ele în tandem la licitații.", src: "harta" },

  { from: "mineralport", to: "oltdrum", label: "vinde asfalt și balast către", route: "vhv", mid: 604,
    detail: "Mineralport vinde asfalt și balast la prețuri discutabile către Olt Drum, compania Consiliului Județean Olt. Totul pe banii publici.", src: "harta" },

  { from: "oltdrum", to: "postolache", label: "acordă proiecte lui", route: "hvh", mid: 690,
    detail: "Compania de stat a județului atribuie lucrări administratorului Mineralport.", src: "harta" },

  { from: "oltdrum", to: "adrianbarbu", label: "acordă proiecte lui", route: "vhv", mid: 946,
    detail: "Societatea CJ Olt Drum i-a plătit lui Adi Barbu milioane de lei pentru multiple lucrări și prestări de servicii — tot din bani publici.", src: "harta" },

  { from: "panadria", to: "postolache", label: "face plăți lui", route: "vhv", mid: 700,
    detail: "Plățile circulă între firmele grupului, nu doar dinspre instituțiile publice.", src: "harta" },

  { from: "panadria", to: "titiriga", label: "face plăți circulare cu", route: "vhv", mid: 832,
    detail: "Prin Panadria apar plăți circulare pe servicii fără acoperire — suveici care îngroașă același buzunar.", src: "harta" },

  { from: "sga", to: "titiriga", label: "acordă proiecte lui", route: "vhv", mid: 812,
    detail: "Adi Barbu, instalat și menținut la SGA Olt, acordă lucrări către administratorul Wagramer.", src: "harta" },

  { from: "sga", to: "wagramer", label: "acordă proiecte lui", route: "vhv", mid: 884,
    detail: "Dinspre SGA Olt, Wagramer primește lucrări directe.", src: "harta" },

  { from: "adrianbarbu", to: "sga", label: "este Director la", route: "line",
    detail: "Adi Barbu este instalat și menținut la Sistemul de Gospodărire a Apelor Olt.", src: "harta" },

  { from: "adrianbarbu", to: "panadria", label: "este administratorul de facto al", route: "vhv", mid: 862,
    detail: "Aceeași persoană conduce instituția publică și firma privată care ia lucrările: Panadria, firma pivot pe zona de apă și lucrări civile.", src: "documentar" },

  { from: "cao", to: "pisicu", label: "acordă proiecte lui", route: "vhv", mid: 952,
    detail: "Firma de construcții Old&New Construct primește lucrări de la CAO și de la Primăria Slatina.", src: "harta" },

  { from: "cao", to: "adrianbarbu", label: "acordă proiecte lui", route: "vhv", mid: 962,
    detail: "CAO alimentează cu proiecte și Panadria, care la rândul ei participă în circuitul ce duce banii prin firmele de casă.", src: "harta" },

  { from: "cao", to: "sorin", label: "acordă proiecte lui", route: "vhv", mid: 972,
    detail: "CAO mai atribuie lucrări către încă doi jucători cruciali: Condor Păduraru și firma-fanion a lui Oprescu, Wagramer Termo 2000.", src: "harta" },

  { from: "pisicu", to: "oldnew", label: "controlează", route: "line",
    detail: "Mircea „Pisicu” Ungureanu și-a aliniat interesele cu ale baronului local, participând la fondul de protocol al rețelei. Dosarele lui de corupție și evaziune au fost tărăgănate sau clasate.", src: "harta" },

  { from: "sorin", to: "condor", label: "controlează", route: "line",
    detail: "Condor Păduraru este unul dintre cei doi jucători cruciali către care CAO atribuie lucrări.", src: "harta" },

  { from: "titiriga", to: "wagramer", label: "este administratorul de fațadă al", route: "line",
    detail: "Fost șofer de taxi, Valeriu Țițirigă ajunge administratorul formal al firmei prin care trec sute de milioane de lei din bani publici.", src: "harta" },

  { from: "titiriga", to: "sorin", label: "fostul șofer al tatălui lui", route: "hvh", mid: 1256,
    detail: "Legătura care arată cât de scurtă e distanța dintre firmele care par independente: administratorul Wagramer a fost șofer la compania Condor Păduraru.", src: "harta" },

  { from: "oprescu", to: "cjolt", label: "deține funcția de", route: "line",
    detail: "Un început tumultuos, cu acuzații de omor și probe de sânge controversate. Totuși, în doar câțiva ani, Marius Oprescu trece de la statutul de inculpat la președinte al Consiliului Județean Olt.", src: "documentar" },

  { from: "emilmot", to: "primarslatina", label: "deține funcția de", route: "line",
    detail: "Emil Moț conduce Primăria Slatina, în timp ce nașul său preia Consiliul Județean. Pierde municipiul în vara lui 2024.", src: "documentar" },

  { from: "rada", to: "primarpiatra", label: "deține funcția de", route: "line",
    detail: "Nicușor Rada este primarul din Piatra-Olt și cumnatul lui Marius Oprescu.", src: "documentar" },

  { from: "busi", to: "anif", label: "a condus", route: "line",
    detail: "Florin „Busi” Barbu conduce ANIF înainte de a promova ca ministru al Agriculturii — instituția care virează peste 500 de milioane de lei către Wagramer.", src: "documentar" },

  { from: "sri", to: "covaciu", label: "filiera numirilor", route: "vhv", mid: 566,
    detail: "Pe filiera SRI ajung la conducerea Companiei de Apă Olt atât Vasile Covaciu, cât și Marius Cătălin Ușurelu.", src: "harta" },

  { from: "sri", to: "usurelu", label: "filiera numirilor", route: "line",
    detail: "Documentarul întreabă de ce rețeaua PSD Olt a fost lăsată în pace atâția ani.", src: "harta" }
];

/* ---------- CRONOLOGIE ---------- */

const TIMELINE = [
  { year: "2009", title: "Aplauze în sala Consiliului Județean",
    body: "Interlopul Bercea Mondial este prezentat în aplauze în sala CJ Olt și numit „președintele romilor” de regele Florin Cioabă. În dreapta lui, la eveniment: Marius Oprescu.",
    nodes: ["oprescu"] },
  { year: "3 oct. 2013", title: "Accidentul de la Piatra Olt",
    body: "Un Toyota Hilux achiziționat la ISU, folosit nelegal ca mașină personală, lovește o căruță nesemnalizată în care se aflau patru persoane. Un bărbat de 34 de ani moare după câteva săptămâni. Oprescu refuză etilotestul; proba de sânge se recoltează fără supravegherea polițiștilor.",
    nodes: ["oprescu", "spital"] },
  { year: "2017", title: "Achitarea",
    body: "Deși rechizitoriul arată că proba din seara accidentului are grupa A1, iar Oprescu are grupa 0, Judecătoria Slatina îl achită.",
    nodes: ["oprescu", "cjolt"] },
  { year: "2023", title: "Stuful din Delta Dunării",
    body: "O lege modificată pe ascuns în Parlament transformă Delta în pășune. A doua zi terenurile sunt schimbate în acte din ape în pășuni, iar stuful este recategorizat prin ordin de ministru. Două firme apărute peste noapte ajung să controleze aproape tot stuful din Deltă.",
    nodes: ["delta", "busi", "anif"] },
  { year: "vara 2024", title: "Șocul",
    body: "Emil Moț pierde municipiul Slatina. În orele și zilele următoare, scandalul cu drogurile și Marina Pandarov explodează în presă. Urmează demisii în cascadă, de la primărie până la Compania de Apă Olt.",
    nodes: ["emilmot", "pandarof", "cao"] },
  { year: "2025", title: "Microbuzele",
    body: "Din 250 de milioane de euro alocați pentru 3.200 de microbuze școlare electrice, banii se topesc după aproximativ 1.300 de vehicule. Cel mai scump microbuz din România se cumpără la Consiliul Județean Olt: aproximativ 262.000 € bucata.",
    nodes: ["cjolt", "oprescu"] }
];

/* ---------- CIFRE ---------- */

const FIGURES = [
  { value: 262000, prefix: "", suffix: " €", label: "cel mai scump microbuz școlar din România",
    note: "cumpărat la Consiliul Județean Olt — de peste trei ori estimarea europeană" },
  { value: 250, prefix: "", suffix: " mil. €", label: "fonduri europene pentru microbuze electrice",
    note: "program gândit pentru 3.200 de vehicule la nivel național" },
  { value: 1300, prefix: "≈ ", suffix: "", label: "microbuze cumpărate din cele 3.200 promise",
    note: "banii s-au topit după aproximativ o treime din flotă" },
  { value: 500, prefix: "peste ", suffix: " mil. lei", label: "virați de ANIF către Wagramer",
    note: "pentru irigații din care agricultorii nu au primit niciun strop de apă" },
  { value: 15, prefix: "≈ ", suffix: " mil. lei", label: "plătiți de Spitalul Județean către Wagramer",
    note: "pentru lucrări evaluate la de trei ori mai puțin" },
  { value: 10, prefix: "", suffix: " %", label: "comisionul de pe harta rețelei",
    note: "achitat de constructorul de casă către președintele CJ" }
];

const KIND_META = {
  "person":          { label: "Persoană",           short: "PERS" },
  "office":          { label: "Instituție publică", short: "INST" },
  "company-state":   { label: "Companie de stat",   short: "STAT" },
  "company-private": { label: "Companie privată",   short: "PRIV" },
  "service":         { label: "Serviciu",           short: "SRI"  },
  "event":           { label: "Operațiune",         short: "OPER" }
};

/* ---------- IMAGINI DIN FIGMA ----------
   Portretele decupate și siglele, exact fișierele din board.
   ASPECT = lățime/înălțime, ca să calculăm lățimea din înălțimea dorită. */

const ASPECT = {
  adrianbarbu: 1.277, busi: 0.899, cao: 0.918, carmin: 0.945, coldea: 0.949,
  covaciu: 1.270, emilmot: 0.845, mariana: 1.050, mineralport: 5.970,
  oltdrum: 9.683, oprescu: 1.037, pandarof: 0.578, pisicu: 1.768,
  postolache: 1.000, psd: 0.756, rada: 0.919, sorin: 1.345, sri: 1.000,
  stanescu: 0.942, titiriga: 1.193, usurelu: 0.845, wagramer: 6.059
};

/* h = înălțimea în unitățile planșei (1600 × 980)
   logoOnly = sigla conține deja numele, nu mai desenăm text */
const MEDIA = {
  stanescu:    { img: "stanescu", imgH: 112, logo: "psd", logoH: 74 },
  oprescu:     { img: "oprescu",  imgH: 108, logo: "psd", logoH: 72 },
  emilmot:     { img: "emilmot",  imgH: 92,  logo: "psd", logoH: 58 },
  rada:        { img: "rada",     imgH: 88,  logo: "psd", logoH: 56 },
  busi:        { img: "busi",     imgH: 96,  logo: "psd", logoH: 62 },
  usurelu:     { img: "usurelu",  imgH: 90,  logo: "psd", logoH: 56 },
  covaciu:     { img: "covaciu",  imgH: 86,  logo: "sri", logoH: 56 },
  mariana:     { img: "mariana",  imgH: 88 },
  coldea:      { img: "coldea",   imgH: 80 },
  pandarof:    { img: "pandarof", imgH: 104 },
  postolache:  { img: "postolache", imgH: 86 },
  titiriga:    { img: "titiriga", imgH: 82 },
  adrianbarbu: { img: "adrianbarbu", imgH: 92 },
  pisicu:      { img: "pisicu",   imgH: 82 },
  sorin:       { img: "sorin",    imgH: 88 },
  sri:         { img: "sri",      imgH: 68, logoOnly: true },
  carmin:      { img: "carmin",   imgH: 62, logoOnly: true },
  mineralport: { img: "mineralport", imgH: 26, logoOnly: true },
  wagramer:    { img: "wagramer", imgH: 26, logoOnly: true },
  oltdrum:     { img: "oltdrum",  imgH: 20, logoOnly: true },
  cao:         { img: "cao",      imgH: 44 }
};

NODES.forEach(n => { if (MEDIA[n.id]) Object.assign(n, MEDIA[n.id]); });

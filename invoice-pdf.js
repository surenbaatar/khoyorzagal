function generateInvoicePDF(reservation) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF library not loaded. Please refresh the page and try again.');
    console.error('jsPDF not loaded — window.jspdf is', window.jspdf);
    return;
  }
  try {
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({ unit: 'pt', format: 'a4' });
  var pageW = 595, pageH = 842;
  var marginL = 52, marginR = 44, marginT = 40, marginB = 40;
  var W = pageW - marginL - marginR;

  /* helper — moved to top to avoid any hoisting issues */
  function nightsBetween(a, b) {
    if (!a || !b) return 1;
    return Math.max(1, Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000));
  }

  var GREEN = '#4F1413';
  var LINE_COLOR = '#DDD4D4';
  var BG_GREEN = '#F7F4F4';
  var MID_GRAY = '#999999';
  var CHILD_GRAY = '#AAAAAA';
  var DARK = '#1C1C1C';
  var SUBTOT_GREEN = '#8F5B5A';

  var GERS_DATA = [
    {n:1,type:'ensuite',bf:true},{n:2,type:'ensuite',bf:true},{n:3,type:'ensuite',bf:true},{n:4,type:'ensuite',bf:true},
    {n:5,type:'ensuite',bf:true},{n:6,type:'ensuite',bf:true},{n:7,type:'ensuite',bf:true},{n:8,type:'ensuite',bf:true},
    {n:9,type:'ensuite',bf:true},{n:10,type:'ensuite',bf:true},{n:11,type:'ensuite',bf:true},{n:12,type:'ensuite',bf:true},
    {n:13,type:'ensuite',bf:true},{n:14,type:'ensuite',bf:true},{n:15,type:'ensuite',bf:true},{n:16,type:'ensuite',bf:true},
    {n:17,type:'ensuite',bf:true},{n:18,type:'ensuite',bf:true},{n:19,type:'ensuite',bf:true},{n:20,type:'ensuite',bf:true},
    {n:21,type:'ensuite',bf:true},{n:22,type:'ensuite',bf:true},{n:23,type:'ensuite',bf:true},{n:24,type:'ensuite',bf:true},
    {n:25,type:'ensuite',bf:true},{n:26,type:'ensuite',bf:true},{n:27,type:'ensuite',bf:true},{n:28,type:'ensuite',bf:true},
    {n:101,type:'new_ensuite',bf:true},{n:102,type:'new_ensuite',bf:true},{n:103,type:'new_ensuite',bf:true},{n:104,type:'new_ensuite',bf:true},
    {n:105,type:'new_ensuite',bf:true},{n:106,type:'new_ensuite',bf:true},{n:107,type:'new_ensuite',bf:true},{n:108,type:'new_ensuite',bf:true},
    {n:109,type:'new_ensuite',bf:true},{n:110,type:'new_ensuite',bf:true},
    {n:29,type:'standard',bf:false},{n:30,type:'standard',bf:false},{n:31,type:'standard',bf:false},{n:32,type:'standard',bf:false},
    {n:33,type:'standard',bf:false},{n:34,type:'standard',bf:false},{n:35,type:'standard',bf:false},
    {n:36,type:'standard',bf:false},{n:37,type:'standard',bf:false},{n:38,type:'standard',bf:false},{n:39,type:'standard',bf:false},
    {n:40,type:'standard',bf:false},{n:41,type:'standard',bf:false},{n:42,type:'standard',bf:false},
    {n:43,type:'standard',bf:false},{n:44,type:'standard',bf:false},{n:45,type:'standard',bf:false},{n:46,type:'standard',bf:false},
    {n:47,type:'standard',bf:false},{n:48,type:'standard',bf:false},{n:49,type:'standard',bf:false},{n:50,type:'standard',bf:false}
  ];

  var PRICES = {ensuite:{rate:190000,supplement:90000},new_ensuite:{rate:190000,supplement:90000},standard:{group:65000,fit:85000,supplement:60000}};
  var FIT_THRESHOLD = 5;
  var MEAL_PRICES = {breakfast:25000,lunch:55000,dinner:45000,khorkhog:55000,boolton:40000};
  var STAFF_MEAL = {bed:45000,supplement:60000,breakfast:12000,lunch:29000,dinner:24000};

  var rates = {
    bed: {ensuite_rate:PRICES.ensuite.rate, ensuite_supplement:PRICES.ensuite.supplement,
          standard_group:PRICES.standard.group, standard_fit:PRICES.standard.fit, standard_supplement:PRICES.standard.supplement},
    meal: {breakfast:MEAL_PRICES.breakfast, lunch:MEAL_PRICES.lunch, dinner:MEAL_PRICES.dinner,
           khorkhog:MEAL_PRICES.khorkhog, boolton:MEAL_PRICES.boolton},
    staff: {bed:STAFF_MEAL.bed, supplement:STAFF_MEAL.supplement, breakfast:STAFF_MEAL.breakfast,
            lunch:STAFF_MEAL.lunch, dinner:STAFF_MEAL.dinner}
  };

  if (reservation.companyId) {
    try {
      var companies = JSON.parse(localStorage.getItem('kz_companies') || '[]');
      var comp = companies.find(function(c) { return String(c.id) === String(reservation.companyId); });
      if (comp) {
        if (comp.bed) {
          if (comp.bed.ensuite_group != null) rates.bed.ensuite_rate = comp.bed.ensuite_group;
          if (comp.bed.ensuite_rate != null) rates.bed.ensuite_rate = comp.bed.ensuite_rate;
          if (comp.bed.ensuite_supplement != null) rates.bed.ensuite_supplement = comp.bed.ensuite_supplement;
          if (comp.bed.standard_group != null) rates.bed.standard_group = comp.bed.standard_group;
          if (comp.bed.standard_fit != null) rates.bed.standard_fit = comp.bed.standard_fit;
          if (comp.bed.standard_single != null && comp.bed.standard_fit == null) rates.bed.standard_fit = comp.bed.standard_single;
          if (comp.bed.standard_supplement != null) rates.bed.standard_supplement = comp.bed.standard_supplement;
        }
        if (comp.meal) { for (var k in comp.meal) { if (comp.meal[k] != null && rates.meal[k] !== undefined) rates.meal[k] = comp.meal[k]; } }
        if (comp.staff) { for (var k in comp.staff) { if (comp.staff[k] != null && rates.staff[k] !== undefined) rates.staff[k] = comp.staff[k]; } }
      }
    } catch(e) {}
  }

  var r = reservation;
  var nights = nightsBetween(r.checkIn, r.checkOut);
  var adults = r.adults || 0;
  var c03 = r.children03 || 0;
  var c48 = r.children48 || 0;
  var totalGuests = r.guests || (adults + c03 + c48);
  var guidesM = r.guidesM || 0;
  var guidesF = r.guidesF || 0;
  var driversM = r.driversM || 0;
  var driversF = r.driversF || 0;
  var totalStaff = guidesM + guidesF + driversM + driversF;

  var today = new Date();
  var todayStr = today.toISOString().slice(0, 10);
  var dueDate = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10);
  var invoiceNum = 'INV-' + todayStr.slice(0, 4) + '-' + String(r.id).slice(-4).padStart(4, '0');
  var bookingRef = 'KZ-' + todayStr.slice(0, 4) + '-' + String(r.id).slice(-4).padStart(4, '0');

  function gerInfo(n) {
    var g = GERS_DATA.find(function(x) { return x.n === n; });
    return g || {n: n, type: 'ensuite', bf: true};
  }

  function isEnsuite(type) { return type === 'ensuite' || type === 'new_ensuite'; }

  var isFIT = totalGuests < FIT_THRESHOLD;
  var stdRate = isFIT ? rates.bed.standard_fit : rates.bed.standard_group;

  function getRate(type) {
    if (isEnsuite(type)) return rates.bed.ensuite_rate;
    return stdRate;
  }

  function getSupplement(type) {
    if (isEnsuite(type)) return rates.bed.ensuite_supplement;
    return rates.bed.standard_supplement;
  }

  function fmtN(n) { return (Number(n) || 0).toLocaleString('en-US'); }

  function fmtDate(d) {
    if (!d) return '';
    var dt = new Date(d + 'T00:00:00');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[dt.getMonth()] + ' ' + String(dt.getDate()).padStart(2,'0');
  }

  var curY = marginT;

  function ensureSpace(needed) {
    if (curY + needed > pageH - marginB - 20) {
      doc.addPage();
      curY = marginT;
      drawAccentStrip();
    }
  }

  function drawAccentStrip() {
    doc.setFillColor(79, 20, 19);
    doc.rect(0, 0, 4, pageH, 'F');
  }

  function hexToRGB(hex) {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }

  function setColor(hex) {
    var c = hexToRGB(hex);
    doc.setTextColor(c.r, c.g, c.b);
  }

  function setFill(hex) {
    var c = hexToRGB(hex);
    doc.setFillColor(c.r, c.g, c.b);
  }

  function setDraw(hex) {
    var c = hexToRGB(hex);
    doc.setDrawColor(c.r, c.g, c.b);
  }

  drawAccentStrip();

  var col = {
    desc: marginL,
    qty: marginL + W * 0.50,
    rate: marginL + W * 0.65,
    sub: marginL + W * 0.80
  };
  var colW = {
    desc: W * 0.50,
    qty: W * 0.15,
    rate: W * 0.15,
    sub: W * 0.20
  };

  if (typeof LOGO_CAMP_B64 !== 'undefined' && LOGO_CAMP_B64) {
    var logoH = 50;
    var logoW = Math.round(logoH * (117 / 80));
    var logoX = marginL + (W - logoW) / 2;
    try {
      var campSrc = LOGO_CAMP_B64.indexOf('data:') === 0 ? LOGO_CAMP_B64 : 'data:image/jpeg;base64,' + LOGO_CAMP_B64;
      doc.addImage(campSrc, 'JPEG', logoX, curY, logoW, logoH);
    } catch(e) { console.warn('Camp logo failed:', e); }
    var lineY = curY + logoH / 2;
    setDraw(LINE_COLOR);
    doc.setLineWidth(0.5);
    doc.line(marginL, lineY, logoX - 12, lineY);
    doc.line(logoX + logoW + 12, lineY, marginL + W, lineY);
    curY += logoH + 8;
  }

  var hdrY = curY;
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  setColor(GREEN);
  doc.text('Khoyor Zagal Lodge', marginL, hdrY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setColor(MID_GRAY);
  doc.text('Khoyor Zagal Juulchin LLC', marginL, hdrY + 23);

  if (typeof LOGO_ITL_B64 !== 'undefined' && LOGO_ITL_B64) {
    var itlH = 26;
    var itlW = Math.round(itlH * (90 / 40));
    try {
      var itlSrc = LOGO_ITL_B64.indexOf('data:') === 0 ? LOGO_ITL_B64 : 'data:image/jpeg;base64,' + LOGO_ITL_B64;
      doc.addImage(itlSrc, 'JPEG', marginL + W - itlW, hdrY, itlW, itlH);
    } catch(e) { console.warn('ITL logo failed:', e); }
  }

  var badgeW = 90, badgeH = 22;
  var badgeX = marginL + W - badgeW;
  var badgeY = hdrY + 30;
  setFill(GREEN);
  doc.rect(badgeX, badgeY, badgeW, badgeH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor('#FFFFFF');
  doc.text('I N V O I C E', badgeX + badgeW / 2, badgeY + 15, { align: 'center' });

  curY = Math.max(hdrY + 26, badgeY + badgeH) + 12;

  setDraw('#E6E6E6');
  doc.setLineWidth(0.5);
  doc.line(marginL, curY, marginL + W, curY);
  curY += 14;

  var metaY = curY;
  var metaLeftW = W * 0.50;
  var metaRightX = marginL + W;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setColor(GREEN);
  doc.text('PREPARED FOR', marginL, metaY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor('#333333');
  doc.text(r.company || '', marginL, metaY + 11);

  if (r.contact) {
    doc.setFontSize(8.5);
    setColor(MID_GRAY);
    doc.text(r.contact, marginL, metaY + 22);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setColor(GREEN);
  doc.text('INVOICE NUMBER', marginL, metaY + 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor('#333333');
  doc.text(invoiceNum, marginL, metaY + 49);

  var rFields = [
    ['DATE', todayStr],
    ['DUE', dueDate],
    ['BOOKING', bookingRef]
  ];
  var rY = metaY;
  rFields.forEach(function(f) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setColor(GREEN);
    doc.text(f[0], metaRightX, rY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    setColor('#333333');
    doc.text(f[1], metaRightX, rY + 11, { align: 'right' });
    rY += 22;
  });

  curY = Math.max(metaY + 60, rY) + 10;

  var pills = [
    'Check-in  ' + fmtDate(r.checkIn),
    'Check-out  ' + fmtDate(r.checkOut),
    nights + ' Nights',
    totalGuests + ' Guests'
  ];
  var pillX = marginL;
  var pillH = 18, pillPad = 10, pillGap = 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  pills.forEach(function(text) {
    var tw = doc.getTextWidth(text);
    var pw = tw + pillPad * 2;
    setDraw(LINE_COLOR);
    doc.setLineWidth(0.7);
    doc.roundedRect(pillX, curY, pw, pillH, pillH / 2, pillH / 2, 'S');
    setColor(GREEN);
    doc.text(text, pillX + pillPad, curY + 12);
    pillX += pw + pillGap;
  });

  curY += pillH + 16;

  function drawTableHeader() {
    var hy = curY;
    setDraw(GREEN);
    doc.setLineWidth(1.5);
    doc.line(marginL, hy, marginL + W, hy);

    setFill(BG_GREEN);
    doc.rect(marginL, hy + 2, W, 16, 'F');

    setDraw(LINE_COLOR);
    doc.setLineWidth(0.5);
    doc.line(marginL, hy + 18, marginL + W, hy + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setColor(GREEN);
    doc.text('DESCRIPTION', col.desc + 6, hy + 12);
    doc.text('QTY', col.qty + colW.qty, hy + 12, { align: 'right' });
    doc.text('RATE', col.rate + colW.rate, hy + 12, { align: 'right' });
    doc.text('SUBTOTAL', col.sub + colW.sub, hy + 12, { align: 'right' });

    curY = hy + 22;
  }

  function drawSectionRow(title) {
    ensureSpace(20);
    curY += 6;
    setDraw(LINE_COLOR);
    doc.setLineWidth(0.5);
    doc.line(marginL, curY + 12, marginL + W, curY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor(GREEN);
    doc.text(title, col.desc + 6, curY + 8);
    curY += 16;
  }

  function drawRow(desc, qty, rate, subtotal, opts) {
    opts = opts || {};
    ensureSpace(16);
    var ry = curY;
    var fs = opts.isChild ? 7.5 : 8.5;
    var fc = opts.isChild ? CHILD_GRAY : '#333333';
    var indent = opts.isChild ? 14 : 6;

    doc.setFont(opts.bold ? 'helvetica' : 'helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(fs);
    setColor(fc);
    doc.text(desc, col.desc + indent, ry + 9);

    if (qty) doc.text(String(qty), col.qty + colW.qty, ry + 9, { align: 'right' });
    if (rate) {
      if (opts.italic) {
        doc.setFont('helvetica', 'italic');
        setColor(CHILD_GRAY);
      }
      doc.text(String(rate), col.rate + colW.rate, ry + 9, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    }
    if (subtotal) {
      if (opts.italic) {
        doc.setFont('helvetica', 'italic');
        setColor(CHILD_GRAY);
      }
      doc.text(String(subtotal), col.sub + colW.sub, ry + 9, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    }

    curY = ry + 13;

    if (!opts.noLine) {
      setDraw('#F0F0F0');
      doc.setLineWidth(0.3);
      doc.line(marginL, curY, marginL + W, curY);
      curY += 2;
    }
  }

  function drawSubtotalRow(label, amount) {
    ensureSpace(20);
    curY += 2;
    setDraw(LINE_COLOR);
    doc.setLineWidth(1);
    doc.line(marginL, curY, marginL + W, curY);
    doc.setLineWidth(0.3);
    doc.line(marginL, curY + 2.5, marginL + W, curY + 2.5);
    curY += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(GREEN);
    doc.text(label, col.desc + 6, curY);
    doc.setFontSize(9.5);
    doc.text(amount, col.sub + colW.sub, curY, { align: 'right' });
    curY += 10;
  }

  drawTableHeader();

  drawSectionRow('Guests / Zochid');

  var guestBedTotal = 0;
  var ensuiteGuestCount = 0;
  var standardGuestCount = 0;

  var gerNums = r.gerNums || [];
  var singles = r.singles || [];
  var gers = r.gers || [];

  var grouped = {};
  gerNums.forEach(function(n) {
    if (singles.indexOf(n) >= 0) return;
    var info = gerInfo(n);
    var typeKey = isEnsuite(info.type) ? 'ensuite' : 'standard';
    if (!grouped[typeKey]) grouped[typeKey] = { nums: [], pax: 0, type: info.type };
    var gerDetail = gers.find(function(g) { return g.n === n; });
    var occ = gerDetail ? gerDetail.occ : 2;
    grouped[typeKey].nums.push(n);
    grouped[typeKey].pax += occ;
    if (info.bf) ensuiteGuestCount += occ;
    else standardGuestCount += occ;
  });

  singles.forEach(function(n) {
    var info = gerInfo(n);
    if (info.bf) ensuiteGuestCount += 1;
    else standardGuestCount += 1;
  });

  for (var typeKey in grouped) {
    var g = grouped[typeKey];
    var rate = getRate(g.type);
    var typeLabel = isEnsuite(g.type) ? 'Deluxe Ger' : 'Standard Ger';
    var rateNote = isEnsuite(g.type) ? '' : (isFIT ? ' (FIT)' : ' (Group)');
    var label = typeLabel + rateNote;
    var typePax = g.pax;
    var typeShare = totalGuests > 0 ? typePax / totalGuests : 0;

    var adultPortion = Math.round(adults * rate * typeShare) * nights;
    drawRow(label, String(Math.round(adults * typeShare)) + ' x ' + nights, fmtN(rate), fmtN(adultPortion));
    guestBedTotal += adultPortion;

    if (c03 > 0) {
      var c03portion = 0;
      drawRow('child 0-3 / free bed', String(Math.round(c03 * typeShare)) + ' x ' + nights, '0', '0', { isChild: true });
      guestBedTotal += c03portion;
    }

    if (c48 > 0) {
      var childRate = Math.round(rate * 0.5);
      var c48count = Math.round(c48 * typeShare);
      var c48amt = c48count * childRate * nights;
      drawRow('child 4-8 (50%)', c48count + ' x ' + nights, fmtN(childRate), fmtN(c48amt), { isChild: true });
      guestBedTotal += c48amt;
    }
  }

  singles.forEach(function(n) {
    var info = gerInfo(n);
    var baseRate = getRate(info.type);
    var supp = getSupplement(info.type);
    var fullRate = baseRate + supp;
    var amt = fullRate * nights;
    var typeLabel = isEnsuite(info.type) ? 'Deluxe' : 'Standard';
    var label = typeLabel + ' Ger #' + n + ' single supplement';
    drawRow(label, String(nights), fmtN(baseRate) + '+' + fmtN(supp), fmtN(amt));
    guestBedTotal += amt;
  });

  var guestMealTotal = 0;
  var bfIncludedCount = ensuiteGuestCount;

  var bfRate = rates.meal.breakfast;
  var bfMs = (r.mealSelections && r.mealSelections.breakfast) || {};
  var bfNightsOn = (bfMs.nightsOn !== undefined) ? bfMs.nightsOn : nights;
  var bfDed = bfMs.deductions || 0;

  if (bfNightsOn > 0) {
    var totalBfMeals = totalGuests * bfNightsOn;
    var inclBfMeals = bfIncludedCount * bfNightsOn;
    var chargeableBeforeDed = Math.max(0, totalBfMeals - inclBfMeals);
    var chargeableBf = Math.max(0, chargeableBeforeDed - bfDed);

    if (chargeableBf === 0 && bfIncludedCount >= totalGuests) {
      drawRow('Breakfast', '', 'included', '', { italic: true });
    } else if (bfIncludedCount > 0) {
      var bfAmt = chargeableBf * bfRate;
      var bfLabel = bfNightsOn < nights ? 'Breakfast (' + bfNightsOn + '/' + nights + ' nights)' : 'Breakfast (partial)';
      drawRow(bfLabel, chargeableBf + ' chargeable', fmtN(bfRate), fmtN(bfAmt));
      guestMealTotal += bfAmt;
      drawRow(bfIncludedCount + ' ensuite guests - included', '', 'included', '', { isChild: true, italic: true });
      if (bfDed > 0) drawRow('  less ' + bfDed + ' deducted', '', '', '', { isChild: true });
    } else {
      var bfChargeable = Math.max(0, totalBfMeals - bfDed);
      var bfAmt = bfChargeable * bfRate;
      var bfLabel = bfNightsOn < nights ? 'Breakfast (' + bfNightsOn + '/' + nights + ' nights)' : 'Breakfast';
      drawRow(bfLabel, totalGuests + ' x ' + bfNightsOn, fmtN(bfRate), fmtN(bfAmt));
      guestMealTotal += bfAmt;
      if (bfDed > 0) drawRow('  less ' + bfDed + ' deducted', '', '', '', { isChild: true });
    }
  }

  // Lunch — respect meal grid selections
  var ms = r.mealSelections || {};
  var lunchNights = (ms.lunch && ms.lunch.nightsOn !== undefined) ? ms.lunch.nightsOn : nights;
  var lunchDed = (ms.lunch && ms.lunch.deductions) ? ms.lunch.deductions : 0;
  // Also include khorkhog nights as lunch substitute
  var khorkhogNights = (ms.khorkhog && ms.khorkhog.nightsOn !== undefined) ? ms.khorkhog.nightsOn : 0;
  var khorkhogDed = (ms.khorkhog && ms.khorkhog.deductions) ? ms.khorkhog.deductions : 0;

  if (lunchNights > 0) {
    var lunchRate = rates.meal.lunch;
    var lunchChargeable = Math.max(0, totalGuests * lunchNights - lunchDed);
    var lunchAmt = lunchChargeable * lunchRate;
    var lunchLabel = lunchNights < nights ? 'Lunch (' + lunchNights + '/' + nights + ' nights)' : 'Lunch';
    drawRow(lunchLabel, totalGuests + ' x ' + lunchNights, fmtN(lunchRate), fmtN(lunchAmt));
    guestMealTotal += lunchAmt;
    if (lunchDed > 0) drawRow('  less ' + lunchDed + ' deducted', '', '', '', { isChild: true });
  }

  if (khorkhogNights > 0) {
    var khRate = rates.meal.khorkhog;
    var khChargeable = Math.max(0, totalGuests * khorkhogNights - khorkhogDed);
    var khAmt = khChargeable * khRate;
    var khLabel = khorkhogNights < nights ? 'Khorkhog (' + khorkhogNights + '/' + nights + ' nights)' : 'Khorkhog';
    drawRow(khLabel, totalGuests + ' x ' + khorkhogNights, fmtN(khRate), fmtN(khAmt));
    guestMealTotal += khAmt;
    if (khorkhogDed > 0) drawRow('  less ' + khorkhogDed + ' deducted', '', '', '', { isChild: true });
  }

  // Dinner — respect meal grid selections
  var dinnerNights = (ms.dinner && ms.dinner.nightsOn !== undefined) ? ms.dinner.nightsOn : nights;
  var dinnerDed = (ms.dinner && ms.dinner.deductions) ? ms.dinner.deductions : 0;
  // Boolton as dinner substitute
  var booltonNights = (ms.boolton && ms.boolton.nightsOn !== undefined) ? ms.boolton.nightsOn : 0;
  var booltonDed = (ms.boolton && ms.boolton.deductions) ? ms.boolton.deductions : 0;

  if (dinnerNights > 0) {
    var dinnerRate = rates.meal.dinner;
    var dinnerChargeable = Math.max(0, totalGuests * dinnerNights - dinnerDed);
    var dinnerAmt = dinnerChargeable * dinnerRate;
    var dinnerLabel = dinnerNights < nights ? 'Dinner (' + dinnerNights + '/' + nights + ' nights)' : 'Dinner';
    drawRow(dinnerLabel, totalGuests + ' x ' + dinnerNights, fmtN(dinnerRate), fmtN(dinnerAmt));
    guestMealTotal += dinnerAmt;
    if (dinnerDed > 0) drawRow('  less ' + dinnerDed + ' deducted', '', '', '', { isChild: true });
  }

  if (booltonNights > 0) {
    var blRate = rates.meal.boolton;
    var blChargeable = Math.max(0, totalGuests * booltonNights - booltonDed);
    var blAmt = blChargeable * blRate;
    var blLabel = booltonNights < nights ? 'Boolton (' + booltonNights + '/' + nights + ' nights)' : 'Boolton';
    drawRow(blLabel, totalGuests + ' x ' + booltonNights, fmtN(blRate), fmtN(blAmt));
    guestMealTotal += blAmt;
    if (booltonDed > 0) drawRow('  less ' + booltonDed + ' deducted', '', '', '', { isChild: true });
  }

  var guestSub = guestBedTotal + guestMealTotal;
  drawSubtotalRow('Subtotal — Guests', fmtN(guestSub));

  var staffSub = 0;
  if (totalStaff > 0) {
    drawSectionRow('Guides & Drivers');

    var staffGers = r.staffGers || [];
    var staffBedTotal = 0;

    if (staffGers.length > 0) {
      staffGers.forEach(function(sg) {
        var occ = sg.occ || 1;
        var isSingle = occ === 1;
        if (isSingle) {
          var bedAmt = (rates.staff.bed + rates.staff.supplement) * nights;
          drawRow('Ger #' + sg.n + ' (' + (sg.label || 'staff') + ')', String(nights), fmtN(rates.staff.bed + rates.staff.supplement), fmtN(bedAmt));
          staffBedTotal += bedAmt;
          drawRow('single supplement', '', fmtN(rates.staff.supplement), '', { isChild: true });
        } else {
          var bedAmt = occ * rates.staff.bed * nights;
          drawRow('Ger #' + sg.n + ' (' + occ + ' staff)', occ + ' x ' + nights, fmtN(rates.staff.bed), fmtN(bedAmt));
          staffBedTotal += bedAmt;
        }
      });
    } else {
      var bedAmt = totalStaff * rates.staff.bed * nights;
      drawRow('Accommodation', totalStaff + ' x ' + nights, fmtN(rates.staff.bed), fmtN(bedAmt));
      staffBedTotal += bedAmt;
    }

    var staffMealTotal = 0;
    var smn = r.staffMealNights || {};

    var sbfNights = (smn.breakfast !== undefined) ? smn.breakfast : nights;
    var sbfAmt = totalStaff * rates.staff.breakfast * sbfNights;
    if (sbfNights > 0) {
      drawRow('Staff Breakfast', totalStaff + ' x ' + sbfNights, fmtN(rates.staff.breakfast), fmtN(sbfAmt));
      staffMealTotal += sbfAmt;
    }

    var slNights = (smn.lunch !== undefined) ? smn.lunch : nights;
    if (slNights > 0) {
      var slAmt = totalStaff * rates.staff.lunch * slNights;
      var slLabel = slNights < nights ? 'Staff Lunch (' + slNights + '/' + nights + ')' : 'Staff Lunch';
      drawRow(slLabel, totalStaff + ' x ' + slNights, fmtN(rates.staff.lunch), fmtN(slAmt));
      staffMealTotal += slAmt;
    }

    var sdNights = (smn.dinner !== undefined) ? smn.dinner : nights;
    if (sdNights > 0) {
      var sdAmt = totalStaff * rates.staff.dinner * sdNights;
      var sdLabel = sdNights < nights ? 'Staff Dinner (' + sdNights + '/' + nights + ')' : 'Staff Dinner';
      drawRow(sdLabel, totalStaff + ' x ' + sdNights, fmtN(rates.staff.dinner), fmtN(sdAmt));
      staffMealTotal += sdAmt;
    }

    staffSub = staffBedTotal + staffMealTotal;
    drawSubtotalRow('Subtotal — Guides', fmtN(staffSub));
  }

  var extrasSub = 0;
  var hasExtras = false;

  if (r.comments && r.comments.trim()) {
    var extraLines = r.comments.trim().split('\n');
    var parsedExtras = [];
    extraLines.forEach(function(line) {
      var match = line.match(/^(.+?)\s*[xX]\s*(\d+)\s*@\s*([\d,]+)/);
      if (match) {
        parsedExtras.push({
          name: match[1].trim(),
          qty: parseInt(match[2]),
          price: parseInt(match[3].replace(/,/g, ''))
        });
      }
    });
    if (parsedExtras.length > 0) {
      hasExtras = true;
      drawSectionRow('Extras');
      parsedExtras.forEach(function(item) {
        var amt = item.qty * item.price;
        drawRow(item.name, String(item.qty), fmtN(item.price), fmtN(amt));
        extrasSub += amt;
      });
      drawSubtotalRow('Subtotal — Extras', fmtN(extrasSub));
    }
  }

  var grandTotal = guestSub + staffSub + extrasSub;

  ensureSpace(60);
  curY += 8;
  var totCardW = 220;
  var totCardH = 50;
  var totCardX = marginL + W - totCardW;
  var totCardY = curY;

  setFill(BG_GREEN);
  doc.rect(totCardX, totCardY, totCardW, totCardH, 'F');
  setFill(GREEN);
  doc.rect(totCardX, totCardY, 3, totCardH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setColor(SUBTOT_GREEN);
  doc.text('AMOUNT DUE  (MNT)', totCardX + 14, totCardY + 14);

  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  setColor(GREEN);
  doc.text(fmtN(grandTotal), totCardX + totCardW - 14, totCardY + 38, { align: 'right' });

  curY = totCardY + totCardH + 12;

  var footerMinY = pageH - marginB - 60;
  if (curY < footerMinY) curY = footerMinY;

  setDraw('#E6E6E6');
  doc.setLineWidth(0.5);
  doc.line(marginL, curY, marginL + W, curY);
  curY += 10;

  var fY = curY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setColor(GREEN);
  doc.text('PAYMENT DETAILS', marginL, fY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setColor(MID_GRAY);
  doc.text('Khoyor Zagal Juulchin LLC  |  Golomt Bank', marginL, fY + 10);
  doc.text('iBan: 97001500  |  Account: 1102034451  |  Ref: ' + bookingRef, marginL, fY + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setColor(GREEN);
  doc.text('TERMS & NOTES', marginL, fY + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setColor(MID_GRAY);
  doc.text('50% deposit required / 50% uriin tulbur', marginL, fY + 44);

  doc.setFont('times', 'italic');
  doc.setFontSize(18);
  setColor(LINE_COLOR);
  doc.text('Thank you', marginL + W, fY + 20, { align: 'right' });

  var safeName = (r.company || 'invoice').replace(/[^a-zA-Z0-9]/g, '-');
  doc.save('KZ-Invoice-' + safeName + '.pdf');

  } catch(err) {
    console.error('Invoice PDF generation failed:', err);
    alert('Invoice generation failed: ' + err.message);
  }
}

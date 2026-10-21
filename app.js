// Default false: locks viewports <= 768px to a crisp static illustration and native vertical card stack.
// Flip to true to enable damped horizontal scroll-scrubbing on mobile devices.
const MOBILE_SCROLL_SCRUB = false;

(function () {
  'use strict';

  /* ==========================================================================
     UTILITIES & MORTGAGE AMORTIZATION ENGINE
     ========================================================================== */

  function formatCurrency(amount) {
    return '$' + Math.round(amount).toLocaleString('en-US');
  }

  function calculateMonthlyPI(loanAmount, annualRatePercent, termYears) {
    const monthlyRate = annualRatePercent / 100 / 12;
    const totalPayments = termYears * 12;
    if (monthlyRate <= 0) return loanAmount / totalPayments;
    const factor = Math.pow(1 + monthlyRate, totalPayments);
    return (loanAmount * (monthlyRate * factor)) / (factor - 1);
  }

  /* ==========================================================================
     1. STICKY NAVBAR & MOBILE MENU
     ========================================================================== */

  const siteNavbar = document.getElementById('siteNavbar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', function () {
    if (!siteNavbar) return;
    if (window.scrollY > 18) {
      siteNavbar.classList.add('scrolled');
    } else {
      siteNavbar.classList.remove('scrolled');
    }
  }, { passive: true });

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('mobile-open');
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('mobile-open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ==========================================================================
     2. HERO PURCHASE / REFINANCE TOGGLE & LIVE PAYMENT SNAPSHOT CARD
     ========================================================================== */

  let heroIntent = 'purchase';
  const heroIntentBtns = document.querySelectorAll('[data-hero-intent]');
  const heroIntentSummary = document.getElementById('heroIntentSummary');
  const heroPrimaryCta = document.getElementById('heroPrimaryCta');
  const snapshotModeLabel = document.getElementById('snapshotModeLabel');
  const snapshotBadgeRate = document.getElementById('snapshotBadgeRate');
  const snapshotTotalMonthly = document.getElementById('snapshotTotalMonthly');
  const snapshotRateDisplay = document.getElementById('snapshotRateDisplay');
  const snapshotAprDisplay = document.getElementById('snapshotAprDisplay');
  const snapshotSliderTitle = document.getElementById('snapshotSliderTitle');
  const snapshotPriceValue = document.getElementById('snapshotPriceValue');
  const snapshotPriceSlider = document.getElementById('snapshotPriceSlider');
  const snapshotPI = document.getElementById('snapshotPI');
  const snapshotTax = document.getElementById('snapshotTax');
  const snapshotIns = document.getElementById('snapshotIns');
  const snapshotCustomizeBtn = document.getElementById('snapshotCustomizeBtn');

  function updateHeroSnapshot() {
    if (!snapshotPriceSlider) return;
    const price = parseFloat(snapshotPriceSlider.value) || 485000;
    const isRefi = heroIntent === 'refinance';
    const loanRatio = isRefi ? 0.75 : 0.80;
    const loanAmount = price * loanRatio;
    const rate = isRefi ? 5.875 : 5.990;
    const apr = isRefi ? 5.962 : 6.084;

    const pi = calculateMonthlyPI(loanAmount, rate, 30);
    const taxes = (price * 0.0103) / 12;
    const insurance = (price * 0.0036) / 12;
    const total = pi + taxes + insurance;

    if (snapshotPriceValue) snapshotPriceValue.textContent = formatCurrency(price);
    if (snapshotPI) snapshotPI.textContent = formatCurrency(pi) + '/mo';
    if (snapshotTax) snapshotTax.textContent = formatCurrency(taxes) + '/mo';
    if (snapshotIns) snapshotIns.textContent = formatCurrency(insurance) + '/mo';
    if (snapshotTotalMonthly) snapshotTotalMonthly.textContent = formatCurrency(total);
    if (snapshotRateDisplay) snapshotRateDisplay.textContent = rate.toFixed(3) + '%';
    if (snapshotAprDisplay) snapshotAprDisplay.textContent = apr.toFixed(3) + '% APR · 0.5 Pts';
    if (snapshotBadgeRate) snapshotBadgeRate.textContent = rate.toFixed(2) + '% Rate';
    if (snapshotModeLabel) {
      snapshotModeLabel.textContent = isRefi
        ? 'Refinance Snapshot · 30-Yr Fixed'
        : 'Purchase Snapshot · 30-Yr Fixed';
    }
    if (snapshotSliderTitle) {
      snapshotSliderTitle.textContent = isRefi
        ? 'Estimated Property Value'
        : 'Estimated Home Purchase Price';
    }
  }

  heroIntentBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      heroIntent = btn.getAttribute('data-hero-intent') || 'purchase';
      heroIntentBtns.forEach(function (b) {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });

      if (heroIntent === 'refinance') {
        if (heroIntentSummary) {
          heroIntentSummary.innerHTML = '<strong>Zero-Lender-Fee Refi Options</strong> · Lower your payment or tap home equity.';
        }
        if (heroPrimaryCta) heroPrimaryCta.textContent = 'Start Refinance Quote →';
      } else {
        if (heroIntentSummary) {
          heroIntentSummary.innerHTML = '<strong>Same-day Pre-Approval Letter</strong> · Average 19-day clear-to-close.';
        }
        if (heroPrimaryCta) heroPrimaryCta.textContent = 'Start Purchase Quote →';
      }

      updateHeroSnapshot();

      // Also sync the Today's Rates table purpose tab
      const matchingPurposeTab = document.querySelector('[data-rate-purpose="' + heroIntent + '"]');
      if (matchingPurposeTab) matchingPurposeTab.click();
    });
  });

  if (snapshotPriceSlider) {
    snapshotPriceSlider.addEventListener('input', updateHeroSnapshot);
  }

  if (snapshotCustomizeBtn) {
    snapshotCustomizeBtn.addEventListener('click', function () {
      openCustomizeModal({
        program: heroIntent === 'refinance' ? '30-Year Fixed Refinance' : '30-Year Fixed Purchase',
        rate: snapshotRateDisplay ? snapshotRateDisplay.textContent : '5.990%',
        apr: snapshotAprDisplay ? snapshotAprDisplay.textContent.split(' ')[0] : '6.084%',
        points: '0.500 pts',
        payment: (snapshotTotalMonthly ? snapshotTotalMonthly.textContent : '$2,884') + '/mo (PITI)'
      });
    });
  }

  /* ==========================================================================
     3. INTERACTIVE "TODAY'S LIVE MORTGAGE RATES" TABLE
     ========================================================================== */

  const RATE_CATALOG = {
    '30yr': {
      label: '30-Year Fixed',
      termYears: 30,
      tiers: [
        {
          strategy: 'Lowest Payment',
          badge: 'Most Popular',
          badgeClass: 'popular',
          sub: 'Maximum monthly savings with modest discount points',
          baseRate: 5.875,
          aprSpread: 0.107,
          points: 0.875
        },
        {
          strategy: 'Balanced Standard',
          badge: 'Balanced',
          badgeClass: '',
          sub: 'Ideal blend of low fixed rate and minimal upfront cost',
          baseRate: 5.990,
          aprSpread: 0.094,
          points: 0.500
        },
        {
          strategy: 'Zero-Point Par',
          badge: '',
          badgeClass: '',
          sub: 'Keep more cash in hand at closing with 0.00 discount points',
          baseRate: 6.125,
          aprSpread: 0.043,
          points: 0.000
        },
        {
          strategy: 'Lender Credit Offset',
          badge: '',
          badgeClass: '',
          sub: 'Includes lender credit toward your title & escrow closing costs',
          baseRate: 6.375,
          aprSpread: 0.020,
          points: -0.500
        }
      ]
    },
    '15yr': {
      label: '15-Year Fixed',
      termYears: 15,
      tiers: [
        {
          strategy: 'Accelerated Payoff Saver',
          badge: 'Best APR',
          badgeClass: 'popular',
          sub: 'Build equity twice as fast with ultra-low 15-year pricing',
          baseRate: 5.250,
          aprSpread: 0.135,
          points: 0.750
        },
        {
          strategy: 'Balanced 15-Year',
          badge: 'Balanced',
          badgeClass: '',
          sub: 'Low fixed interest rate with half-point buydown',
          baseRate: 5.375,
          aprSpread: 0.110,
          points: 0.375
        },
        {
          strategy: 'Zero-Point 15-Year Par',
          badge: '',
          badgeClass: '',
          sub: 'Zero discount points required at closing table',
          baseRate: 5.500,
          aprSpread: 0.055,
          points: 0.000
        },
        {
          strategy: 'Lender Credit 15-Year',
          badge: '',
          badgeClass: '',
          sub: 'Offsets closing fees while cutting 15 years off your term',
          baseRate: 5.625,
          aprSpread: 0.030,
          points: -0.375
        }
      ]
    },
    'va': {
      label: 'VA 30-Year Fixed',
      termYears: 30,
      tiers: [
        {
          strategy: 'VA Benefit Max Saver',
          badge: 'Veterans Choice',
          badgeClass: 'popular',
          sub: '0% down payment eligible with zero monthly PMI ever',
          baseRate: 5.375,
          aprSpread: 0.165,
          points: 0.625
        },
        {
          strategy: 'VA Standard Fixed',
          badge: '0% Down',
          badgeClass: '',
          sub: 'Streamlined VA underwriting with minimal upfront points',
          baseRate: 5.490,
          aprSpread: 0.148,
          points: 0.250
        },
        {
          strategy: 'VA Zero-Point Par',
          badge: '',
          badgeClass: '',
          sub: 'Keep your liquid reserves untouched at closing',
          baseRate: 5.625,
          aprSpread: 0.120,
          points: 0.000
        },
        {
          strategy: 'VA IRRRL / Closing Credit',
          badge: '',
          badgeClass: '',
          sub: 'Includes lender credit to cover title and recording fees',
          baseRate: 5.875,
          aprSpread: 0.095,
          points: -0.500
        }
      ]
    },
    'fha': {
      label: 'FHA 30-Year Fixed',
      termYears: 30,
      tiers: [
        {
          strategy: 'FHA Low-Down Saver',
          badge: '3.5% Down',
          badgeClass: 'popular',
          sub: 'Flexible credit guidelines and low 3.5% minimum down payment',
          baseRate: 5.500,
          aprSpread: 0.420,
          points: 0.750
        },
        {
          strategy: 'FHA Balanced Standard',
          badge: 'First-Time Buyer',
          badgeClass: '',
          sub: 'Gift funds permitted for 100% of down payment & closing',
          baseRate: 5.625,
          aprSpread: 0.395,
          points: 0.250
        },
        {
          strategy: 'FHA Zero-Point Par',
          badge: '',
          badgeClass: '',
          sub: 'Zero origination points with predictable monthly P&I',
          baseRate: 5.750,
          aprSpread: 0.360,
          points: 0.000
        },
        {
          strategy: 'FHA Seller/Lender Assist',
          badge: '',
          badgeClass: '',
          sub: 'Lender credit reduces cash-to-close for first-time buyers',
          baseRate: 5.990,
          aprSpread: 0.335,
          points: -0.500
        }
      ]
    },
    'jumbo': {
      label: 'Jumbo 30-Year Fixed',
      termYears: 30,
      tiers: [
        {
          strategy: 'Private Client Jumbo',
          badge: 'Preferred Tier',
          badgeClass: 'popular',
          sub: 'For loan amounts up to $3.5M with relationship pricing',
          baseRate: 5.990,
          aprSpread: 0.088,
          points: 0.750
        },
        {
          strategy: 'Jumbo Portfolio Standard',
          badge: 'Up to $3.5M',
          badgeClass: '',
          sub: 'Common-sense underwriting for complex K-1 or RSU income',
          baseRate: 6.125,
          aprSpread: 0.068,
          points: 0.250
        },
        {
          strategy: 'Jumbo Zero-Point Par',
          badge: '',
          badgeClass: '',
          sub: 'Zero points on high-balance coastal and metro properties',
          baseRate: 6.250,
          aprSpread: 0.042,
          points: 0.000
        },
        {
          strategy: 'Jumbo Reserve Flex',
          badge: '',
          badgeClass: '',
          sub: 'Includes closing cost credit for jumbo purchase or refi',
          baseRate: 6.450,
          aprSpread: 0.025,
          points: -0.375
        }
      ]
    }
  };

  let activeRatePurpose = 'purchase';
  let activeRateProgram = '30yr';

  const purposeTabs = document.querySelectorAll('[data-rate-purpose]');
  const programTabs = document.querySelectorAll('[data-rate-program]');
  const tableHomeValue = document.getElementById('tableHomeValue');
  const tableDownPayment = document.getElementById('tableDownPayment');
  const tableCreditTier = document.getElementById('tableCreditTier');
  const ratesTableBody = document.getElementById('ratesTableBody');
  const activeProgramCountLabel = document.getElementById('activeProgramCountLabel');

  function updateDownPaymentLabels() {
    if (!tableHomeValue || !tableDownPayment) return;
    const homeVal = parseFloat(tableHomeValue.value) || 485000;
    Array.from(tableDownPayment.options).forEach(function (opt) {
      const pct = parseFloat(opt.value) || 0.2;
      const pctWhole = Math.round(pct * 100);
      opt.textContent = pctWhole + '% (' + formatCurrency(homeVal * pct) + ')';
    });
  }

  function renderRatesTable() {
    if (!ratesTableBody) return;
    updateDownPaymentLabels();

    const homeVal = tableHomeValue ? parseFloat(tableHomeValue.value) : 485000;
    const downPct = tableDownPayment ? parseFloat(tableDownPayment.value) : 0.20;
    const creditAdjustment = tableCreditTier ? parseFloat(tableCreditTier.value) : 0;
    const refiAdjustment = activeRatePurpose === 'refinance' ? -0.05 : 0.0;

    const loanAmount = Math.max(50000, homeVal * (1 - downPct));
    const catalogEntry = RATE_CATALOG[activeRateProgram] || RATE_CATALOG['30yr'];

    if (activeProgramCountLabel) {
      activeProgramCountLabel.textContent =
        catalogEntry.tiers.length + ' ' + catalogEntry.label + ' (' +
        (activeRatePurpose === 'refinance' ? 'Refi' : 'Purchase') + ') tiers';
    }

    ratesTableBody.innerHTML = '';

    catalogEntry.tiers.forEach(function (tier) {
      const finalRate = Math.max(4.5, tier.baseRate + creditAdjustment + refiAdjustment);
      const finalApr = finalRate + tier.aprSpread;
      const monthlyPI = calculateMonthlyPI(loanAmount, finalRate, catalogEntry.termYears);
      const pointDollar = Math.round((loanAmount * Math.abs(tier.points)) / 100);

      let pointsLabel = '0.000 pts ($0)';
      if (tier.points > 0) {
        pointsLabel = tier.points.toFixed(3) + ' pts (' + formatCurrency(pointDollar) + ')';
      } else if (tier.points < 0) {
        pointsLabel = tier.points.toFixed(3) + ' pts (-' + formatCurrency(pointDollar) + ' credit)';
      }

      const fullTierTitle = catalogEntry.label + ' — ' + tier.strategy;
      const badgeHtml = tier.badge
        ? '<span class="tier-badge ' + tier.badgeClass + '">' + tier.badge + '</span>'
        : '';

      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' +
          '<div class="loan-tier-cell">' +
            '<span class="loan-tier-name">' + fullTierTitle + ' ' + badgeHtml + '</span>' +
            '<span class="loan-tier-sub">' + tier.sub + '</span>' +
          '</div>' +
        '</td>' +
        '<td><span class="rate-num-large">' + finalRate.toFixed(3) + '%</span></td>' +
        '<td><span class="apr-num">' + finalApr.toFixed(3) + '%</span></td>' +
        '<td><span class="points-num">' + pointsLabel + '</span></td>' +
        '<td><span class="payment-num">' + formatCurrency(monthlyPI) + '/mo</span></td>' +
        '<td style="text-align: right;">' +
          '<button type="button" class="btn btn-outline btn-sm customize-rate-btn" ' +
            'data-program="' + fullTierTitle + '" ' +
            'data-rate="' + finalRate.toFixed(3) + '%" ' +
            'data-apr="' + finalApr.toFixed(3) + '%" ' +
            'data-points="' + pointsLabel + '" ' +
            'data-payment="' + formatCurrency(monthlyPI) + '/mo">' +
            'Customize Rate' +
          '</button>' +
        '</td>';

      ratesTableBody.appendChild(tr);
    });

    bindCustomizeButtons();
  }

  purposeTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activeRatePurpose = tab.getAttribute('data-rate-purpose') || 'purchase';
      purposeTabs.forEach(function (t) {
        const isCurrent = t === tab;
        t.classList.toggle('active', isCurrent);
        t.setAttribute('aria-selected', String(isCurrent));
      });
      renderRatesTable();
    });
  });

  programTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activeRateProgram = tab.getAttribute('data-rate-program') || '30yr';
      programTabs.forEach(function (t) {
        const isCurrent = t === tab;
        t.classList.toggle('active', isCurrent);
        t.setAttribute('aria-selected', String(isCurrent));
      });
      renderRatesTable();
    });
  });

  // Navbar / Footer quick program links
  document.querySelectorAll('[data-select-program]').forEach(function (link) {
    link.addEventListener('click', function () {
      const prog = link.getAttribute('data-select-program');
      const targetTab = document.querySelector('[data-rate-program="' + prog + '"]');
      if (targetTab) targetTab.click();
    });
  });

  [tableHomeValue, tableDownPayment, tableCreditTier].forEach(function (selectEl) {
    if (selectEl) {
      selectEl.addEventListener('change', renderRatesTable);
    }
  });

  /* ==========================================================================
     4. PHASE 3: PINNED HORIZONTAL-SCROLL VW & DOG "ROAD AHEAD" ENGINE
     ========================================================================== */

  const roadProcessTrack = document.getElementById('road-ahead');
  const vwCruiserWrapper = document.getElementById('vwCruiserWrapper');
  const vwChassisGroup = document.getElementById('vwChassisGroup');
  const wheelFront = document.getElementById('wheelFront');
  const wheelRear = document.getElementById('wheelRear');
  const parallaxClouds = document.getElementById('parallaxClouds');
  const parallaxHillsAndTrees = document.getElementById('parallaxHillsAndTrees');
  const keysSignpostGroup = document.getElementById('keysSignpostGroup');
  const roadScrubFill = document.getElementById('roadScrubFill');
  const roadCardsTrack = document.getElementById('roadCardsTrack');
  const milestoneCards = document.querySelectorAll('.milestone-card');
  const roadStepPills = document.querySelectorAll('.road-step-pill');

  let targetProgress = 0;
  let currentProgress = 0;
  let isMobileStatic = false;

  function evaluateMobileScrollMode() {
    if (!roadProcessTrack) return;
    const isSmallViewport = window.innerWidth <= 768;

    if (isSmallViewport && !MOBILE_SCROLL_SCRUB) {
      isMobileStatic = true;
      roadProcessTrack.classList.add('mobile-static-mode');
      // Place VW & Dog illustration in a crisp hero pose on mobile static mode
      if (vwCruiserWrapper) vwCruiserWrapper.setAttribute('transform', 'translate(140, 114)');
      if (vwChassisGroup) vwChassisGroup.setAttribute('transform', 'translate(0, 0)');
      if (wheelFront) wheelFront.style.transform = 'rotate(0deg)';
      if (wheelRear) wheelRear.style.transform = 'rotate(0deg)';
      if (roadCardsTrack) roadCardsTrack.style.transform = 'none';
      if (roadScrubFill) roadScrubFill.style.width = '100%';
    } else {
      isMobileStatic = false;
      roadProcessTrack.classList.remove('mobile-static-mode');
      updateTargetScrollProgress();
    }
  }

  function updateTargetScrollProgress() {
    if (!roadProcessTrack || isMobileStatic) return;
    const rect = roadProcessTrack.getBoundingClientRect();
    const trackHeight = roadProcessTrack.offsetHeight;
    const scrollableDistance = Math.max(1, trackHeight - window.innerHeight);

    // Normalized scroll progress [0..1]
    targetProgress = Math.min(1, Math.max(0, -rect.top / scrollableDistance));
  }

  function renderRoadAheadFrame() {
    if (!isMobileStatic && roadProcessTrack) {
      // Damped Lerp Interpolation (0.08 factor)
      currentProgress += (targetProgress - currentProgress) * 0.08;

      // Clamp very small residuals
      if (Math.abs(targetProgress - currentProgress) < 0.0002) {
        currentProgress = targetProgress;
      }

      // 1. Horizontal Travel of Vintage VW & Golden Retriever Co-Pilot
      // Travels from x = 36px at start to x = 686px at Milestone 06 (pulling right up to the Destination Home & Signpost)
      const vwX = 36 + currentProgress * 650;
      if (vwCruiserWrapper) {
        vwCruiserWrapper.setAttribute('transform', 'translate(' + vwX.toFixed(2) + ', 114)');
      }

      // 2. Chassis Suspension Oscillation (1.5px to 2.5px vertical oscillation)
      const velocity = Math.abs(targetProgress - currentProgress);
      const suspensionAmplitude = 1.5 + Math.min(1.0, velocity * 14);
      const bounceY = Math.sin(currentProgress * Math.PI * 16) * suspensionAmplitude;
      if (vwChassisGroup) {
        vwChassisGroup.setAttribute('transform', 'translate(0, ' + bounceY.toFixed(2) + ')');
      }

      // 3. Independent Wheel Rotation: rotate(${currentProgress * 1080}deg)
      const wheelAngle = (currentProgress * 1080).toFixed(2);
      if (wheelFront) {
        wheelFront.style.transform = 'rotate(' + wheelAngle + 'deg)';
      }
      if (wheelRear) {
        wheelRear.style.transform = 'rotate(' + wheelAngle + 'deg)';
      }

      // 4. Multi-Layer Parallax: Cypress/Hills at 0.25x & Clouds at 0.12x
      const totalSceneShift = 640;
      const hillsOffset = -(currentProgress * totalSceneShift * 0.25);
      const cloudsOffset = -(currentProgress * totalSceneShift * 0.12);

      if (parallaxHillsAndTrees) {
        parallaxHillsAndTrees.setAttribute('transform', 'translate(' + hillsOffset.toFixed(2) + ', 0)');
      }
      if (parallaxClouds) {
        parallaxClouds.setAttribute('transform', 'translate(' + cloudsOffset.toFixed(2) + ', 0)');
      }

      // 5. Horizontal Milestone Card Track Synchronization
      if (roadCardsTrack) {
        const viewportEl = roadCardsTrack.parentElement;
        const innerWidth = viewportEl ? viewportEl.clientWidth - 56 : 1180;
        const totalTrackWidth = roadCardsTrack.scrollWidth;
        const maxCardTranslate = Math.max(0, totalTrackWidth - innerWidth);
        const cardOffset = -(currentProgress * maxCardTranslate);
        roadCardsTrack.style.transform = 'translate3d(' + cardOffset.toFixed(2) + 'px, 0, 0)';
      }

      // 6. Progress Bar & Active/Current Milestone Illumination (01 to 06)
      if (roadScrubFill) {
        const fillPct = 6 + currentProgress * 94;
        roadScrubFill.style.width = fillPct.toFixed(1) + '%';
      }

      const activeStepIndex = Math.min(5, Math.floor(currentProgress * 6));
      milestoneCards.forEach(function (card, idx) {
        card.classList.toggle('active', idx <= activeStepIndex);
        card.classList.toggle('current', idx === activeStepIndex);
      });

      roadStepPills.forEach(function (pill, idx) {
        pill.classList.toggle('active', idx < activeStepIndex);
        pill.classList.toggle('current', idx === activeStepIndex);
      });

      // 7. Destination Home "KEYS IN HAND" Signpost Animation when currentProgress > 0.86
      if (keysSignpostGroup) {
        if (currentProgress > 0.86) {
          keysSignpostGroup.classList.add('keys-unlocked');
        } else {
          keysSignpostGroup.classList.remove('keys-unlocked');
        }
      }
    }

    requestAnimationFrame(renderRoadAheadFrame);
  }

  // Click-to-Scrub on Step Pills & Milestone Cards
  function scrollToMilestoneStep(stepIndex) {
    if (!roadProcessTrack) return;
    if (isMobileStatic) {
      const targetCard = milestoneCards[stepIndex];
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const trackTop = roadProcessTrack.offsetTop;
    const scrollableDistance = Math.max(1, roadProcessTrack.offsetHeight - window.innerHeight);
    const stepRatio = stepIndex === 5 ? 0.94 : (stepIndex / 5.4);
    const targetScrollY = trackTop + scrollableDistance * stepRatio;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  }

  roadStepPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      const idx = parseInt(pill.getAttribute('data-jump-step') || '0', 10);
      scrollToMilestoneStep(idx);
    });
  });

  milestoneCards.forEach(function (card) {
    card.addEventListener('click', function () {
      const idx = parseInt(card.getAttribute('data-milestone-index') || '0', 10);
      scrollToMilestoneStep(idx);
    });
  });

  window.addEventListener('scroll', updateTargetScrollProgress, { passive: true });
  window.addEventListener('resize', evaluateMobileScrollMode);

  /* ==========================================================================
     5. SINGLE-CARD 60-SECOND CUSTOM RATE QUOTE CALCULATOR
     ========================================================================== */

  let selectedQuoteGoal = 'Buying a Home';
  let selectedQuoteBaseRate = 5.99;

  const quoteGoalPills = document.querySelectorAll('.quote-goal-pill');
  const customQuoteForm = document.getElementById('customQuoteForm');
  const quoteLoanAmount = document.getElementById('quoteLoanAmount');
  const quoteCreditScore = document.getElementById('quoteCreditScore');
  const quoteContactInput = document.getElementById('quoteContactInput');
  const quoteInstantResult = document.getElementById('quoteInstantResult');
  const quoteResultGoalName = document.getElementById('quoteResultGoalName');
  const quoteResultSentNotice = document.getElementById('quoteResultSentNotice');
  const quoteResultRate = document.getElementById('quoteResultRate');
  const quoteResultApr = document.getElementById('quoteResultApr');
  const quoteResultPayment = document.getElementById('quoteResultPayment');

  quoteGoalPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      quoteGoalPills.forEach(function (p) {
        p.classList.toggle('active', p === pill);
      });
      selectedQuoteGoal = pill.getAttribute('data-quote-goal') || 'Buying a Home';
      selectedQuoteBaseRate = parseFloat(pill.getAttribute('data-base-rate') || '5.99');
    });
  });

  if (quoteLoanAmount) {
    quoteLoanAmount.addEventListener('blur', function () {
      const raw = parseFloat(quoteLoanAmount.value.replace(/[^0-9.]/g, '')) || 485000;
      quoteLoanAmount.value = formatCurrency(raw);
    });
  }

  if (customQuoteForm) {
    customQuoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const rawPrice = quoteLoanAmount
        ? parseFloat(quoteLoanAmount.value.replace(/[^0-9.]/g, '')) || 485000
        : 485000;
      const creditSpread = quoteCreditScore ? parseFloat(quoteCreditScore.value) || 0 : 0;
      const contactVal = quoteContactInput && quoteContactInput.value.trim()
        ? quoteContactInput.value.trim()
        : 'your inbox';

      const loanPrincipal = selectedQuoteGoal === 'Buying a Home' ? rawPrice * 0.80 : rawPrice;
      const matchedRate = selectedQuoteBaseRate + creditSpread;
      const matchedApr = matchedRate + 0.092;
      const monthlyPI = calculateMonthlyPI(loanPrincipal, matchedRate, 30);

      if (quoteResultGoalName) quoteResultGoalName.textContent = selectedQuoteGoal;
      if (quoteResultSentNotice) {
        quoteResultSentNotice.textContent =
          'Sent custom rate sheet for ' + formatCurrency(rawPrice) + ' to ' + contactVal + ' — zero credit impact.';
      }
      if (quoteResultRate) quoteResultRate.textContent = matchedRate.toFixed(3) + '%';
      if (quoteResultApr) quoteResultApr.textContent = matchedApr.toFixed(3) + '%';
      if (quoteResultPayment) quoteResultPayment.textContent = formatCurrency(monthlyPI) + '/mo';
      if (quoteInstantResult) quoteInstantResult.classList.add('visible');
    });
  }

  /* ==========================================================================
     6. VERIFIED BORROWER REVIEWS FILTER (ALL / ZILLOW / GOOGLE)
     ========================================================================== */

  const reviewFilterTabs = document.querySelectorAll('[data-review-filter]');
  const reviewCards = document.querySelectorAll('[data-review-platform]');

  reviewFilterTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const platform = tab.getAttribute('data-review-filter') || 'all';

      reviewFilterTabs.forEach(function (t) {
        const isCurrent = t === tab;
        t.classList.toggle('active', isCurrent);
        t.setAttribute('aria-selected', String(isCurrent));
      });

      reviewCards.forEach(function (card) {
        const cardPlatform = card.getAttribute('data-review-platform');
        if (platform === 'all' || cardPlatform === platform) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* ==========================================================================
     7. MODALS: RATE DROP ALERT & CUSTOMIZE RATE SCENARIO
     ========================================================================== */

  function openModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('[data-open-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      const modalId = trigger.getAttribute('data-open-modal');
      if (modalId) openModalById(modalId);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(function (closeBtn) {
    closeBtn.addEventListener('click', function () {
      const modalId = closeBtn.getAttribute('data-close-modal');
      if (modalId) closeModalById(modalId);
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) {
        backdrop.classList.remove('open');
        backdrop.setAttribute('aria-hidden', 'true');
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(function (backdrop) {
        backdrop.classList.remove('open');
        backdrop.setAttribute('aria-hidden', 'true');
      });
    }
  });

  function openCustomizeModal(data) {
    const progEl = document.getElementById('modalSelectedProgram');
    const rateEl = document.getElementById('modalSelectedRate');
    const ptsEl = document.getElementById('modalSelectedPoints');
    const payEl = document.getElementById('modalSelectedPayment');
    const successEl = document.getElementById('customizeRateSuccessMsg');

    if (progEl) progEl.textContent = data.program || '30-Year Fixed';
    if (rateEl) rateEl.textContent = (data.rate || '5.990%') + ' Rate (' + (data.apr || '6.084%') + ' APR)';
    if (ptsEl) ptsEl.textContent = data.points || '0.500 pts';
    if (payEl) payEl.textContent = data.payment || '$2,324/mo';
    if (successEl) successEl.classList.remove('visible');

    openModalById('customizeRateModal');
  }

  function bindCustomizeButtons() {
    document.querySelectorAll('.customize-rate-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openCustomizeModal({
          program: btn.getAttribute('data-program'),
          rate: btn.getAttribute('data-rate'),
          apr: btn.getAttribute('data-apr'),
          points: btn.getAttribute('data-points'),
          payment: btn.getAttribute('data-payment')
        });
      });
    });
  }

  const rateAlertForm = document.getElementById('rateAlertForm');
  const rateAlertSuccessMsg = document.getElementById('rateAlertSuccessMsg');
  if (rateAlertForm) {
    rateAlertForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (rateAlertSuccessMsg) rateAlertSuccessMsg.classList.add('visible');
    });
  }

  const customizeRateForm = document.getElementById('customizeRateForm');
  const customizeRateSuccessMsg = document.getElementById('customizeRateSuccessMsg');
  if (customizeRateForm) {
    customizeRateForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (customizeRateSuccessMsg) customizeRateSuccessMsg.classList.add('visible');
    });
  }

  /* ==========================================================================
     8. CONVERSATIONAL AI MORTGAGE CONCIERGE & 3-MODE LEAD CAPTURE ENGINE
     ========================================================================== */

  const heroAiDock = document.getElementById('heroAiDock');
  const heroAiDockForm = document.getElementById('heroAiDockForm');
  const heroAiDockInput = document.getElementById('heroAiDockInput');
  const floatingAiLauncher = document.getElementById('floatingAiLauncher');
  const aiConciergeBackdrop = document.getElementById('aiConciergeBackdrop');
  const closeAiDrawerBtn = document.getElementById('closeAiDrawerBtn');
  const aiModeBtns = document.querySelectorAll('[data-ai-tab]');
  const aiPaneChat = document.getElementById('aiPaneChat');
  const aiPaneSms = document.getElementById('aiPaneSms');
  const aiPaneCallback = document.getElementById('aiPaneCallback');
  const aiChatComposer = document.getElementById('aiChatComposer');
  const aiChatStream = document.getElementById('aiChatStream');
  const aiInlineLeadCard = document.getElementById('aiInlineLeadCard');
  const aiDrawerChatForm = document.getElementById('aiDrawerChatForm');
  const aiDrawerChatInput = document.getElementById('aiDrawerChatInput');

  // Auto-hide Floating AI Launcher while Hero Contextual AI Dock is in view
  function updateFloatingLauncherVisibility() {
    if (!floatingAiLauncher || !heroAiDock) return;
    const dockRect = heroAiDock.getBoundingClientRect();
    const pastHeroDock = dockRect.bottom < 80;
    floatingAiLauncher.classList.toggle('is-hidden-in-hero', !pastHeroDock);
  }

  window.addEventListener('scroll', updateFloatingLauncherVisibility, { passive: true });

  function switchAiDrawerMode(mode) {
    aiModeBtns.forEach(function (btn) {
      const isMatch = btn.getAttribute('data-ai-tab') === mode;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', String(isMatch));
    });

    if (aiPaneChat) aiPaneChat.classList.toggle('active', mode === 'chat');
    if (aiPaneSms) aiPaneSms.classList.toggle('active', mode === 'sms');
    if (aiPaneCallback) aiPaneCallback.classList.toggle('active', mode === 'callback');
    if (aiChatComposer) {
      aiChatComposer.style.display = mode === 'chat' ? 'block' : 'none';
    }
  }

  function openAiConcierge(mode, initialPrompt) {
    if (!aiConciergeBackdrop) return;
    switchAiDrawerMode(mode || 'chat');
    aiConciergeBackdrop.classList.add('open');
    aiConciergeBackdrop.setAttribute('aria-hidden', 'false');

    if (initialPrompt && mode === 'chat') {
      sendUserMessageToBarnaby(initialPrompt);
    }
  }

  function closeAiConcierge() {
    if (!aiConciergeBackdrop) return;
    aiConciergeBackdrop.classList.remove('open');
    aiConciergeBackdrop.setAttribute('aria-hidden', 'true');
  }

  if (closeAiDrawerBtn) {
    closeAiDrawerBtn.addEventListener('click', closeAiConcierge);
  }

  if (aiConciergeBackdrop) {
    aiConciergeBackdrop.addEventListener('click', function (e) {
      if (e.target === aiConciergeBackdrop) closeAiConcierge();
    });
  }

  aiModeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchAiDrawerMode(btn.getAttribute('data-ai-tab') || 'chat');
    });
  });

  document.querySelectorAll('[data-open-ai-mode]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const targetMode = btn.getAttribute('data-open-ai-mode') || 'chat';
      openAiConcierge(targetMode);
    });
  });

  // Hero Contextual AI Dock quick-action scenario chips
  document.querySelectorAll('[data-ai-prompt]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      const promptText = chip.getAttribute('data-ai-prompt') || '';
      if (heroAiDockInput) heroAiDockInput.value = promptText;
      openAiConcierge('chat', promptText);
    });
  });

  // In-drawer chat suggestion chips
  document.querySelectorAll('[data-chat-suggest]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      const promptText = chip.getAttribute('data-chat-suggest') || '';
      sendUserMessageToBarnaby(promptText);
    });
  });

  if (heroAiDockForm) {
    heroAiDockForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const query = heroAiDockInput && heroAiDockInput.value.trim()
        ? heroAiDockInput.value.trim()
        : 'Calculate my max buying power and monthly payment on a $485,000 home';
      openAiConcierge('chat', query);
    });
  }

  const quoteContinueAiBtn = document.getElementById('quoteContinueAiBtn');
  if (quoteContinueAiBtn) {
    quoteContinueAiBtn.addEventListener('click', function () {
      const priceVal = quoteLoanAmount ? quoteLoanAmount.value : '$485,000';
      const rateVal = quoteResultRate ? quoteResultRate.textContent : '5.990%';
      openAiConcierge(
        'chat',
        'I just ran a ' + selectedQuoteGoal + ' quote for ' + priceVal + ' at ' + rateVal + '. Can you break down my cash to close?'
      );
    });
  }

  // Regulation Z-Compliant Conversational Mortgage Calculator Engine
  function buildBarnabyResponseHtml(userText) {
    const lower = userText.toLowerCase();

    // Parse dollar figure if present (e.g. "$550,000" or "$550k")
    let amount = 485000;
    const kMatch = userText.match(/\$?\s*(\d{2,4})\s*k\b/i);
    const fullMatch = userText.match(/\$\s*([\d,]{5,9})/);
    if (kMatch) {
      amount = parseInt(kMatch[1], 10) * 1000;
    } else if (fullMatch) {
      amount = parseInt(fullMatch[1].replace(/,/g, ''), 10) || 485000;
    }

    if (lower.includes('va') || lower.includes('veteran')) {
      const vaRate = 5.490;
      const vaApr = 5.638;
      const vaPI = calculateMonthlyPI(amount, vaRate, 30);
      return (
        'For a <strong>VA Zero-Down Home Loan</strong> on <strong>' + formatCurrency(amount) + '</strong>, eligible veterans and active-duty service members put <strong>$0 down (100% LTV)</strong> and pay <strong>$0 monthly PMI</strong>.' +
        '<div class="chat-rate-box tabular-nums">' +
          'Estimated P&amp;I: <strong>' + formatCurrency(vaPI) + '/mo</strong> at <strong>' + vaRate.toFixed(3) + '% Rate (' + vaApr.toFixed(3) + '% APR)</strong>.' +
          '<span class="chat-regz-note">Reg Z Term: 360 monthly payments on ' + formatCurrency(amount) + ' at 0.250 points. Property taxes &amp; homeowners insurance extra.</span>' +
        '</div>' +
        'Want Alan Schtein (VA Specialist · NMLS #2126949) to text your Certificate of Eligibility &amp; zero-down worksheet? Fill in your mobile number below.'
      );
    }

    if (lower.includes('15-yr') || lower.includes('15-year') || lower.includes('compare')) {
      const loanAmt = amount * 0.80;
      const pi30 = calculateMonthlyPI(loanAmt, 5.990, 30);
      const pi15 = calculateMonthlyPI(loanAmt, 5.375, 15);
      const totalInterestSaved = Math.round((pi30 * 360) - (pi15 * 180));
      return (
        'Here is your side-by-side comparison on a <strong>' + formatCurrency(amount) + '</strong> home (20% down / <strong>' + formatCurrency(loanAmt) + '</strong> loan):' +
        '<div class="chat-rate-box tabular-nums">' +
          '• <strong>30-Yr Fixed:</strong> ' + formatCurrency(pi30) + '/mo at <strong>5.990% Rate (6.084% APR)</strong><br/>' +
          '• <strong>15-Yr Fixed:</strong> ' + formatCurrency(pi15) + '/mo at <strong>5.375% Rate (5.485% APR)</strong><br/>' +
          '• <strong>Lifetime Interest Saved:</strong> ' + formatCurrency(totalInterestSaved) +
          '<span class="chat-regz-note">Reg Z Note: 360 vs. 180 monthly P&amp;I payments at 80% LTV. Taxes &amp; insurance extra.</span>' +
        '</div>'
      );
    }

    if (lower.includes('refi') || lower.includes('6.875')) {
      const loanAmt = 400000;
      const oldPI = calculateMonthlyPI(loanAmt, 6.875, 30);
      const newPI = calculateMonthlyPI(loanAmt, 5.875, 30);
      const monthlySavings = Math.round(oldPI - newPI);
      return (
        'Dropping from <strong>6.875%</strong> to today\'s <strong>5.875% Rate (5.962% APR)</strong> on a $400,000 balance saves approximately <strong>' + formatCurrency(monthlySavings) + '/month (' + formatCurrency(monthlySavings * 12) + '/year)</strong>.' +
        '<div class="chat-rate-box tabular-nums">' +
          'New P&amp;I: <strong>' + formatCurrency(newPI) + '/mo</strong> (down from ' + formatCurrency(oldPI) + '/mo) · Est. Breakeven: <strong>11 Months</strong>.' +
          '<span class="chat-regz-note">Reg Z Disclosure: 360 monthly payments at 5.875% Rate / 5.962% APR.</span>' +
        '</div>'
      );
    }

    if (lower.includes('cash to close') || lower.includes('closing') || lower.includes('credit')) {
      const downPayment = amount * 0.20;
      const estClosing = Math.round(amount * 0.022);
      const lenderCredit = Math.round(amount * 0.004);
      return (
        'For a <strong>' + formatCurrency(amount) + '</strong> purchase, here is your transparent cash-to-close estimate and credit guidance:' +
        '<div class="chat-rate-box tabular-nums">' +
          '• <strong>Conventional (620+ FICO):</strong> 3%–20% down · <strong>5.990% Rate (6.084% APR)</strong><br/>' +
          '• <strong>FHA Loan (580+ FICO):</strong> 3.5% down · <strong>5.625% Rate (6.020% APR)</strong><br/>' +
          '• <strong>Est. Title/Escrow Fees:</strong> ' + formatCurrency(estClosing) + ' (Up to <strong>-' + formatCurrency(lenderCredit) + '</strong> offset with our Lender Credit tier)' +
          '<span class="chat-regz-note">Illustrative educational estimate; actual closing costs vary by state and county recording fees.</span>' +
        '</div>'
      );
    }

    // Default Buying Power & Custom Scenario Calculation
    const downPct = lower.includes('10%') ? 0.10 : lower.includes('5%') ? 0.05 : 0.20;
    const loanPrincipal = amount * (1 - downPct);
    const rate = 5.990;
    const apr = 6.084;
    const monthlyPI = calculateMonthlyPI(loanPrincipal, rate, 30);
    const estTaxesIns = Math.round((amount * 0.0138) / 12);

    return (
      'Based on a <strong>' + formatCurrency(amount) + '</strong> target with <strong>' + Math.round(downPct * 100) + '% down (' + formatCurrency(loanPrincipal) + ' loan)</strong>, here is your live payment breakdown:' +
      '<div class="chat-rate-box tabular-nums">' +
        '• <strong>Principal &amp; Interest:</strong> ' + formatCurrency(monthlyPI) + '/mo at <strong>' + rate.toFixed(3) + '% Rate (' + apr.toFixed(3) + '% APR)</strong><br/>' +
        '• <strong>Est. Taxes &amp; Insurance:</strong> ' + formatCurrency(estTaxesIns) + '/mo<br/>' +
        '• <strong>Total Est. Monthly Payment:</strong> <strong>' + formatCurrency(monthlyPI + estTaxesIns) + '/mo</strong>' +
        '<span class="chat-regz-note">Reg Z Note: Based on 360 monthly payments at ' + Math.round((1 - downPct) * 100) + '% LTV.</span>' +
      '</div>' +
      'Enter your name and mobile number below so our licensed Loan Officer can text this itemized pre-approval worksheet to your phone.'
    );
  }

  function sendUserMessageToBarnaby(text) {
    if (!aiChatStream || !text) return;

    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.textContent = text;

    if (aiInlineLeadCard && aiInlineLeadCard.parentNode === aiChatStream) {
      aiChatStream.insertBefore(userBubble, aiInlineLeadCard);
    } else {
      aiChatStream.appendChild(userBubble);
    }

    const replyBubble = document.createElement('div');
    replyBubble.className = 'chat-bubble assistant';
    replyBubble.innerHTML = buildBarnabyResponseHtml(text);

    if (aiInlineLeadCard && aiInlineLeadCard.parentNode === aiChatStream) {
      aiChatStream.insertBefore(replyBubble, aiInlineLeadCard);
    } else {
      aiChatStream.appendChild(replyBubble);
    }

    aiChatStream.scrollTop = aiChatStream.scrollHeight;
  }

  if (aiDrawerChatForm) {
    aiDrawerChatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!aiDrawerChatInput || !aiDrawerChatInput.value.trim()) return;
      const msg = aiDrawerChatInput.value.trim();
      aiDrawerChatInput.value = '';
      sendUserMessageToBarnaby(msg);
    });
  }

  // Handle Lead Capture Submissions across all 3 AI Concierge Modes
  const aiInlineLeadForm = document.getElementById('aiInlineLeadForm');
  const aiInlineLeadSuccess = document.getElementById('aiInlineLeadSuccess');
  if (aiInlineLeadForm) {
    aiInlineLeadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (aiInlineLeadSuccess) aiInlineLeadSuccess.classList.add('visible');
    });
  }

  const aiSmsQuoteForm = document.getElementById('aiSmsQuoteForm');
  const aiSmsSuccessMsg = document.getElementById('aiSmsSuccessMsg');
  if (aiSmsQuoteForm) {
    aiSmsQuoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (aiSmsSuccessMsg) aiSmsSuccessMsg.classList.add('visible');
    });
  }

  const aiCallbackForm = document.getElementById('aiCallbackForm');
  const aiCallbackSuccessMsg = document.getElementById('aiCallbackSuccessMsg');
  if (aiCallbackForm) {
    aiCallbackForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (aiCallbackSuccessMsg) aiCallbackSuccessMsg.classList.add('visible');
    });
  }

  /* ==========================================================================
     INITIALIZE PAGE STATE & START DAMPED R-A-F LOOP
     ========================================================================== */

  updateHeroSnapshot();
  renderRatesTable();
  evaluateMobileScrollMode();
  updateTargetScrollProgress();
  updateFloatingLauncherVisibility();
  requestAnimationFrame(renderRoadAheadFrame);
})();

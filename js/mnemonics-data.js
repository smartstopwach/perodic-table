/**
 * Finalized Desi Hinglish Periodic Table Mnemonics Dataset
 * d-Block customized with user-selected B-B-A-B series choices:
 *   - 3d (Option B): "Suno Tum Vivaah Karlo Mujhse — Phir Koi Nahi Kahega Zanu!"
 *   - 4d (Option B): "Yeh Zindagi Nahi Mohabbat Teri — Ro-Ro kar Pukaregi Aaj Chandni!"
 *   - 5d (Option A): "La Haf-Ta Warna Re — Os Iron-rod se Pitai Aur Hogi!"
 *   - 6d (Option B): "Accha R.D. Sharma Book mein Hain Maths ke Difficult Rog-type Coins!"
 */
(function () {
  'use strict';

  const MNEMONIC_TABS = {
    d: {
      id: 'd',
      tabLabel: 'd-Block (Row-wise 3d–6d)',
      practiceScope: 'd',
      practiceLabel: '🎯 Practice d-Block Now',
      series: [
        {
          id: '3d',
          badge: '3d Series · Period 4 (Z = 21–30)',
          line: 'Suno Tum Vivaah Karlo Mujhse — Phir Koi Nahi Kahega Zanu!',
          note: 'Config Exceptions: Cr (24) = [Ar] 3d⁵ 4s¹ · Cu (29) = [Ar] 3d¹⁰ 4s¹',
          pairs: [
            ['Sc', 21, 'Suno'],
            ['Ti', 22, 'Tum'],
            ['V', 23, 'Vivaah'],
            ['Cr', 24, 'Karlo'],
            ['Mn', 25, 'Mujhse'],
            ['Fe', 26, 'Phir'],
            ['Co', 27, 'Koi'],
            ['Ni', 28, 'Nahi'],
            ['Cu', 29, 'Kahega'],
            ['Zn', 30, 'Zanu']
          ]
        },
        {
          id: '4d',
          badge: '4d Series · Period 5 (Z = 39–48)',
          line: 'Yeh Zindagi Nahi Mohabbat Teri — Ro-Ro kar Pukaregi Aaj Chandni!',
          note: 'Special Note: Palladium (46 Pd) has ZERO 5s electrons → [Kr] 4d¹⁰!',
          pairs: [
            ['Y', 39, 'Yeh'],
            ['Zr', 40, 'Zindagi'],
            ['Nb', 41, 'Nahi'],
            ['Mo', 42, 'Mohabbat'],
            ['Tc', 43, 'Teri'],
            ['Ru', 44, 'Ro-'],
            ['Rh', 45, '-Ro kar'],
            ['Pd', 46, 'Pukaregi'],
            ['Ag', 47, 'Aaj'],
            ['Cd', 48, 'Chandni']
          ]
        },
        {
          id: '5d',
          badge: '5d Series · Period 6 (Z = 57 La, 72–80)',
          line: 'La Haf-Ta Warna Re — Os (Us) Iron-rod se Pitai Aur Hogi!',
          note: 'Exam Trap: La (57) ke baad 58–71 Lanthanides aate hain, isliye Hf seedha Z=72 se start hota hai!',
          pairs: [
            ['La', 57, 'La'],
            ['Hf', 72, 'Haf-'],
            ['Ta', 73, '-Ta'],
            ['W', 74, 'Warna'],
            ['Re', 75, 'Re'],
            ['Os', 76, 'Os (Us)'],
            ['Ir', 77, 'Iron-rod'],
            ['Pt', 78, 'Pitai'],
            ['Au', 79, 'Aur'],
            ['Hg', 80, 'Hogi']
          ]
        },
        {
          id: '6d',
          badge: '6d Series · Period 7 (Z = 89 Ac, 104–112)',
          line: 'Accha R.D. Sharma Book mein Hain Maths ke Difficult Rog-type Coins!',
          note: 'Exam Trap: Ac (89) ke baad 90–103 Actinides aate hain, isliye Rf seedha Z=104 se start hota hai!',
          pairs: [
            ['Ac', 89, 'Accha'],
            ['Rf', 104, 'R.'],
            ['Db', 105, 'D.'],
            ['Sg', 106, 'Sharma'],
            ['Bh', 107, 'Book'],
            ['Hs', 108, 'Hain'],
            ['Mt', 109, 'Maths'],
            ['Ds', 110, 'Difficult'],
            ['Rg', 111, 'Rog-type'],
            ['Cn', 112, 'Coins']
          ]
        }
      ]
    },

    d_groups: {
      id: 'd_groups',
      tabLabel: 'd-Block (Column-wise G3–G12)',
      practiceScope: 'd',
      practiceLabel: '🎯 Practice d-Block Now',
      series: [
        {
          id: 'g3',
          badge: 'Group 3',
          line: 'Scooter Yamaha La Activa',
          note: 'Top to Bottom vertical column 3',
          pairs: [['Sc', 21, 'Scooter'], ['Y', 39, 'Yamaha'], ['La', 57, 'La'], ['Ac', 89, 'Activa']]
        },
        {
          id: 'g4',
          badge: 'Group 4',
          line: 'Tea Zara Half Refill',
          note: 'Top to Bottom vertical column 4',
          pairs: [['Ti', 22, 'Tea'], ['Zr', 40, 'Zara'], ['Hf', 72, 'Half'], ['Rf', 104, 'Refill']]
        },
        {
          id: 'g5',
          badge: 'Group 5',
          line: 'Vo Nawab Ta Dubai',
          note: 'Top to Bottom vertical column 5',
          pairs: [['V', 23, 'Vo'], ['Nb', 41, 'Nawab'], ['Ta', 73, 'Ta'], ['Db', 105, 'Dubai']]
        },
        {
          id: 'g6',
          badge: 'Group 6',
          line: 'Croma Mobile Wala Sagar',
          note: 'Cr, Mo, W famous high-melting group',
          pairs: [['Cr', 24, 'Croma'], ['Mo', 42, 'Mobile'], ['W', 74, 'Wala'], ['Sg', 106, 'Sagar']]
        },
        {
          id: 'g7',
          badge: 'Group 7',
          line: 'Man Tak Re Bhai',
          note: 'Top to Bottom vertical column 7',
          pairs: [['Mn', 25, 'Man'], ['Tc', 43, 'Tak'], ['Re', 75, 'Re'], ['Bh', 107, 'Bhai']]
        },
        {
          id: 'g8',
          badge: 'Group 8',
          line: 'Fer Ruka Osama Haste',
          note: 'Top to Bottom vertical column 8',
          pairs: [['Fe', 26, 'Fer'], ['Ru', 44, 'Ruka'], ['Os', 76, 'Osama'], ['Hs', 108, 'Haste']]
        },
        {
          id: 'g9',
          badge: 'Group 9',
          line: 'Con Rhega Ireland Mat pooch',
          note: 'Top to Bottom vertical column 9',
          pairs: [['Co', 27, 'Con'], ['Rh', 45, 'Rhega'], ['Ir', 77, 'Ireland'], ['Mt', 109, 'Mat']]
        },
        {
          id: 'g10',
          badge: 'Group 10',
          line: 'Nihi Pdhoge toh Ptoge Dost',
          note: 'Catalytic metals column (Ni, Pd, Pt)',
          pairs: [['Ni', 28, 'Nihi'], ['Pd', 46, 'Pdhoge'], ['Pt', 78, 'Ptoge'], ['Ds', 110, 'Dost']]
        },
        {
          id: 'g11',
          badge: 'Group 11 · Coinage Metals',
          line: 'Cute Age Aur Rag (Copper · Chandi · Sona)',
          note: 'Highest electrical conductivity group',
          pairs: [['Cu', 29, 'Cute'], ['Ag', 47, 'Age'], ['Au', 79, 'Aur'], ['Rg', 111, 'Rag']]
        },
        {
          id: 'g12',
          badge: 'Group 12 · Volatile Metals',
          line: 'Zindagi Cadbury Hogayi Candy',
          note: 'Full d¹⁰ configuration group',
          pairs: [['Zn', 30, 'Zindagi'], ['Cd', 48, 'Cadbury'], ['Hg', 80, 'Hogayi'], ['Cn', 112, 'Candy']]
        }
      ]
    },

    sp: {
      id: 'sp',
      tabLabel: 's & p Block (Groups 1–18)',
      practiceScope: 'sp',
      practiceLabel: '🎯 Practice s & p Block Now',
      series: [
        {
          id: 'g1',
          badge: 'Group 1 · Alkali Metals',
          line: 'HaLiNa Ki Rab Se Fariyaad!',
          note: 'Outer configuration: ns¹',
          pairs: [
            ['H', 1, 'Ha'], ['Li', 3, 'Li'], ['Na', 11, 'Na'], ['K', 19, 'Ki'],
            ['Rb', 37, 'Rab'], ['Cs', 55, 'Se'], ['Fr', 87, 'Fariyaad']
          ]
        },
        {
          id: 'g2',
          badge: 'Group 2 · Alkaline Earth Metals',
          line: 'Beta Mange Car Scooter Baap Raazi!',
          note: 'Outer configuration: ns²',
          pairs: [
            ['Be', 4, 'Beta'], ['Mg', 12, 'Mange'], ['Ca', 20, 'Car'],
            ['Sr', 38, 'Scooter'], ['Ba', 56, 'Baap'], ['Ra', 88, 'Raazi']
          ]
        },
        {
          id: 'g13',
          badge: 'Group 13 · Boron Family',
          line: 'Baingan Aaloo Gajar In Thaila!',
          note: 'Outer configuration: ns² np¹',
          pairs: [
            ['B', 5, 'Baingan'], ['Al', 13, 'Aaloo'], ['Ga', 31, 'Gajar'],
            ['In', 49, 'In'], ['Tl', 81, 'Thaila'], ['Nh', 113, '(Nh)']
          ]
        },
        {
          id: 'g14',
          badge: 'Group 14 · Carbon Family',
          line: 'Kahe Sita Ji Suno Prabhu!',
          note: 'Outer configuration: ns² np²',
          pairs: [
            ['C', 6, 'Kahe'], ['Si', 14, 'Sita'], ['Ge', 32, 'Ji'],
            ['Sn', 50, 'Suno'], ['Pb', 82, 'Prabhu'], ['Fl', 114, '(Fl)']
          ]
        },
        {
          id: 'g15',
          badge: 'Group 15 · Nitrogen Family',
          line: 'Nana Patekar Aishwarya Sab Bindaas!',
          note: 'Outer configuration: ns² np³',
          pairs: [
            ['N', 7, 'Nana'], ['P', 15, 'Patekar'], ['As', 33, 'Aishwarya'],
            ['Sb', 51, 'Sab'], ['Bi', 83, 'Bindaas'], ['Mc', 115, '(Mc)']
          ]
        },
        {
          id: 'g16',
          badge: 'Group 16 · Oxygen Family',
          line: 'Old Style Se TePo!',
          note: 'Outer configuration: ns² np⁴',
          pairs: [
            ['O', 8, 'Old'], ['S', 16, 'Style'], ['Se', 34, 'Se'],
            ['Te', 52, 'Te-'], ['Po', 84, '-Po'], ['Lv', 116, '(Lv)']
          ]
        },
        {
          id: 'g17',
          badge: 'Group 17 · Halogens',
          line: 'Fir Call Bahar Aayi Aunty!',
          note: 'Outer configuration: ns² np⁵',
          pairs: [
            ['F', 9, 'Fir'], ['Cl', 17, 'Call'], ['Br', 35, 'Bahar'],
            ['I', 53, 'Aayi'], ['At', 85, 'Aunty'], ['Ts', 117, '(Ts)']
          ]
        },
        {
          id: 'g18',
          badge: 'Group 18 · Noble Gases',
          line: 'Heena Neena Aur Kareena Ka X-ray Rangeen!',
          note: 'Complete shell: ns² np⁶ (He = 1s²)',
          pairs: [
            ['He', 2, 'Heena'], ['Ne', 10, 'Neena'], ['Ar', 18, 'Aur'],
            ['Kr', 36, 'Kareena'], ['Xe', 54, 'X-ray'], ['Rn', 86, 'Rangeen'], ['Og', 118, '(Og)']
          ]
        }
      ]
    },

    f: {
      id: 'f',
      tabLabel: 'f-Block (Lanthanide & Actinide)',
      practiceScope: 'f',
      practiceLabel: '🎯 Practice f-Block Now',
      series: [
        {
          id: '4f',
          badge: '4f Lanthanides · Row 6* (Z = 57–71)',
          line: 'Laal Cera Par Nadi Prem Samaye — Europe Gadbad Tab Dil Ho Eram Tum Yebhi Luto!',
          note: '15 Rare-Earth Lanthanide elements (57 La to 71 Lu)',
          pairs: [
            ['La', 57, 'Laal'], ['Ce', 58, 'Cera'], ['Pr', 59, 'Par'], ['Nd', 60, 'Nadi'], ['Pm', 61, 'Prem'],
            ['Sm', 62, 'Samaye'], ['Eu', 63, 'Europe'], ['Gd', 64, 'Gadbad'], ['Tb', 65, 'Tab'], ['Dy', 66, 'Dil'],
            ['Ho', 67, 'Ho'], ['Er', 68, 'Eram'], ['Tm', 69, 'Tum'], ['Yb', 70, 'Yebhi'], ['Lu', 71, 'Luto']
          ]
        },
        {
          id: '5f',
          badge: '5f Actinides · Row 7* (Z = 89–103)',
          line: 'Aaj Thode Paapad Upar Naapo — Purane Aam Kam Bikenge Cafe Aish Farmate Madam Nobel Lawrencium!',
          note: '15 Radioactive Actinide elements (89 Ac to 103 Lr)',
          pairs: [
            ['Ac', 89, 'Aaj'], ['Th', 90, 'Thode'], ['Pa', 91, 'Paapad'], ['U', 92, 'Upar'], ['Np', 93, 'Naapo'],
            ['Pu', 94, 'Purane'], ['Am', 95, 'Aam'], ['Cm', 96, 'Kam'], ['Bk', 97, 'Bikenge'], ['Cf', 98, 'Cafe'],
            ['Es', 99, 'Aish'], ['Fm', 100, 'Farmate'], ['Md', 101, 'Madam'], ['No', 102, 'Nobel'], ['Lr', 103, 'Lawrencium']
          ]
        }
      ]
    }
  };

  // Build quick per-element mnemonic lookup (Prioritize primary row/group mnemonics: d -> sp -> f)
  const BY_ELEMENT_Z = new Map();
  ['d', 'sp', 'f'].forEach((tabKey) => {
    MNEMONIC_TABS[tabKey].series.forEach((s) => {
      s.pairs.forEach(([sym, z, word]) => {
        if (!BY_ELEMENT_Z.has(z)) {
          const highlighted = s.pairs
            .map(([, pz, pw]) => (pz === z ? `[${pw.toUpperCase()} -> ${sym}]` : pw))
            .join(' ');
          BY_ELEMENT_Z.set(z, {
            seriesBadge: s.badge,
            word,
            line: s.line,
            highlighted
          });
        }
      });
    });
  });

  window.MNEMONICS_DATA = {
    TABS: MNEMONIC_TABS,
    BY_ELEMENT_Z
  };
})();

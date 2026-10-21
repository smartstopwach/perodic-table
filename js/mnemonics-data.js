/**
 * Multi-Option + Custom User-Editable Desi Periodic Table Mnemonics Engine
 * - Every single Series & Group across s, p, d, and f blocks includes 3 built-in Desi Hinglish options!
 * - Users can pick their favorite preset OR write/edit their own custom sentence + word-per-element mapping,
 *   persisted permanently in localStorage ('pt_user_mnemonics_v2').
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'pt_user_mnemonics_v2';

  // Helper to build compact preset entries cleanly
  // symbols: [[sym, z], ...]
  // options: [{ label, line, words: [...] }, ...]
  const RAW_TABS = {
    d: {
      id: 'd',
      tabLabel: 'd-Block (Row 3d–6d)',
      practiceScope: 'd',
      practiceLabel: '🎯 Practice d-Block Now',
      series: [
        {
          id: 'd_3d',
          badge: '3d Series · Period 4 (Z = 21–30)',
          note: 'Exceptions: Cr (24) = [Ar] 3d⁵ 4s¹ · Cu (29) = [Ar] 3d¹⁰ 4s¹',
          elements: [
            ['Sc', 21], ['Ti', 22], ['V', 23], ['Cr', 24], ['Mn', 25],
            ['Fe', 26], ['Co', 27], ['Ni', 28], ['Cu', 29], ['Zn', 30]
          ],
          options: [
            {
              label: 'Option 1 (Filmy)',
              line: 'Suno Tum Vivaah Karlo Mujhse — Phir Koi Nahi Kahega Zanu!',
              words: ['Suno', 'Tum', 'Vivaah', 'Karlo', 'Mujhse', 'Phir', 'Koi', 'Nahi', 'Kahega', 'Zanu']
            },
            {
              label: 'Option 2 (Kota Classic)',
              line: 'Science Teacher Vineeta Criplani — Man Fenko Co Ni, Kyun Jaan!',
              words: ['Science', 'Teacher', 'Vineeta', 'Criplani', 'Man', 'Fenko', 'Co', 'Ni', 'Kyun', 'Jaan']
            },
            {
              label: 'Option 3 (Cricket Special)',
              line: 'Sachin Tendulkar Very Crazy Man — Fer Coi Nahi Cup Jeetega!',
              words: ['Sachin', 'Tendulkar', 'Very', 'Crazy', 'Man', 'Fer', 'Coi', 'Nahi', 'Cup', 'Jeetega']
            }
          ]
        },
        {
          id: 'd_4d',
          badge: '4d Series · Period 5 (Z = 39–48)',
          note: 'Special Note: Palladium (46 Pd) has ZERO 5s electrons → [Kr] 4d¹⁰!',
          elements: [
            ['Y', 39], ['Zr', 40], ['Nb', 41], ['Mo', 42], ['Tc', 43],
            ['Ru', 44], ['Rh', 45], ['Pd', 46], ['Ag', 47], ['Cd', 48]
          ],
          options: [
            {
              label: 'Option 1 (Bollywood)',
              line: 'Yeh Zindagi Nahi Mohabbat Teri — Ro-Ro kar Pukaregi Aaj Chandni!',
              words: ['Yeh', 'Zindagi', 'Nahi', 'Mohabbat', 'Teri', 'Ro-', '-Ro kar', 'Pukaregi', 'Aaj', 'Chandni']
            },
            {
              label: 'Option 2 (Yaari Classic)',
              line: 'Yaari Zara Nibhana Mout Tak — Rukawat Raah Pade Aage Kood Jaa!',
              words: ['Yaari', 'Zara', 'Nibhana', 'Mout', 'Tak', 'Rukawat', 'Raah', 'Pade', 'Aage', 'Kood']
            },
            {
              label: 'Option 3 (Funny Student)',
              line: 'Yaar Zara Naam Bolo Mera —Tubelight Rozana Padhe Aaj क्लास-mein!',
              words: ['Yaar', 'Zara', 'Naam-Bolo', 'Mera', 'Tubelight', 'Roz', 'Raat', 'Padhe', 'Aaj', 'Cadbury']
            }
          ]
        },
        {
          id: 'd_5d',
          badge: '5d Series · Period 6 (Z = 57 La, 72–80)',
          note: 'Exam Trap: La (57) ke baad 58–71 Lanthanides aate hain, isliye Hf seedha Z=72 se start hota hai!',
          elements: [
            ['La', 57], ['Hf', 72], ['Ta', 73], ['W', 74], ['Re', 75],
            ['Os', 76], ['Ir', 77], ['Pt', 78], ['Au', 79], ['Hg', 80]
          ],
          options: [
            {
              label: 'Option 1 (Vasooli Hit)',
              line: 'La Haf-Ta Warna Re — Os (Us) Iron-rod se Pitai Aur Hogi!',
              words: ['La', 'Haf-', '-Ta', 'Warna', 'Re', 'Os (Us)', 'Iron-rod', 'Pitai', 'Aur', 'Hogi']
            },
            {
              label: 'Option 2 (Irfan Style)',
              line: 'La Hafta Warna Re Osama — Irfan Peetega Aur Hasega!',
              words: ['La', 'Haf-', '-ta', 'Warna', 'Re', 'Osama', 'Irfan', 'Peetega', 'Aur', 'Hasega']
            },
            {
              label: 'Option 3 (Foodie Trick)',
              line: 'Lao Halwa Taza Warna Re — Ustad Irani Paratha Aur Hoga!',
              words: ['Lao', 'Halwa', 'Taza', 'Warna', 'Re', 'Ustad', 'Irani', 'Paratha', 'Aur', 'Hoga']
            }
          ]
        },
        {
          id: 'd_6d',
          badge: '6d Series · Period 7 (Z = 89 Ac, 104–112)',
          note: 'Exam Trap: Ac (89) ke baad 90–103 Actinides aate hain, isliye Rf seedha Z=104 se start hota hai!',
          elements: [
            ['Ac', 89], ['Rf', 104], ['Db', 105], ['Sg', 106], ['Bh', 107],
            ['Hs', 108], ['Mt', 109], ['Ds', 110], ['Rg', 111], ['Cn', 112]
          ],
          options: [
            {
              label: 'Option 1 (R.D. Sharma)',
              line: 'Accha R.D. Sharma Book mein Hain Maths ke Difficult Rog-type Coins!',
              words: ['Accha', 'R.', 'D.', 'Sharma', 'Book', 'Hain', 'Maths', 'Difficult', 'Rog-type', 'Coins']
            },
            {
              label: 'Option 2 (Action Style)',
              line: 'Accha Raftar Dabang Singham Bahut Hasmukh — Mat Das Rag-rag Chaunk!',
              words: ['Accha', 'Raftar', 'Dabang', 'Singham', 'Bahut', 'Hasmukh', 'Mat', 'Das', 'Rag-rag', 'Chaunk']
            },
            {
              label: 'Option 3 (Exact 2-Letter Match)',
              line: 'Actually R-father Dubey Sang Bhajan Haste Mast — Dost Ragini Concert!',
              words: ['Actually', 'R-father', 'Dubey', 'Sang', 'Bhajan', 'Haste', 'Mast', 'Dost', 'Ragini', 'Concert']
            }
          ]
        }
      ]
    },

    d_groups: {
      id: 'd_groups',
      tabLabel: 'd-Block (Column G3–G12)',
      practiceScope: 'd',
      practiceLabel: '🎯 Practice d-Block Now',
      series: [
        {
          id: 'dg_3',
          badge: 'Group 3 (Top → Bottom)',
          note: 'Sc · Y · La · Ac',
          elements: [['Sc', 21], ['Y', 39], ['La', 57], ['Ac', 89]],
          options: [
            { label: 'Option 1', line: 'Scooter Yamaha La Activa!', words: ['Scooter', 'Yamaha', 'La', 'Activa'] },
            { label: 'Option 2', line: 'Second Year Laye Ac!', words: ['Second', 'Year', 'Laye', 'Ac'] },
            { label: 'Option 3', line: 'Sachin Yuvraj Lara Achhe!', words: ['Sachin', 'Yuvraj', 'Lara', 'Achhe'] }
          ]
        },
        {
          id: 'dg_4',
          badge: 'Group 4 (Top → Bottom)',
          note: 'Ti · Zr · Hf · Rf',
          elements: [['Ti', 22], ['Zr', 40], ['Hf', 72], ['Rf', 104]],
          options: [
            { label: 'Option 1', line: 'Tea Zara Half Refill!', words: ['Tea', 'Zara', 'Half', 'Refill'] },
            { label: 'Option 2', line: 'Tum Zara Hafta Rafa-dafa karo!', words: ['Tum', 'Zara', 'Hafta', 'Rafa-dafa'] },
            { label: 'Option 3', line: 'Tiger Zinda Hai Raftaar!', words: ['Tiger', 'Zinda', 'Hai', 'Raftaar'] }
          ]
        },
        {
          id: 'dg_5',
          badge: 'Group 5 (Top → Bottom)',
          note: 'V · Nb · Ta · Db',
          elements: [['V', 23], ['Nb', 41], ['Ta', 73], ['Db', 105]],
          options: [
            { label: 'Option 1', line: 'Vo Nawab Ta Dubai!', words: ['Vo', 'Nawab', 'Ta', 'Dubai'] },
            { label: 'Option 2', line: 'Virat Ne Tora Dabba!', words: ['Virat', 'Ne', 'Tora', 'Dabba'] },
            { label: 'Option 3', line: 'Vada-pav Nawab Taza Dabeli!', words: ['Vada-pav', 'Nawab', 'Taza', 'Dabeli'] }
          ]
        },
        {
          id: 'dg_6',
          badge: 'Group 6 (Top → Bottom)',
          note: 'Cr · Mo · W · Sg',
          elements: [['Cr', 24], ['Mo', 42], ['W', 74], ['Sg', 106]],
          options: [
            { label: 'Option 1', line: 'Croma Mobile Wala Sagar!', words: ['Croma', 'Mobile', 'Wala', 'Sagar'] },
            { label: 'Option 2', line: 'Crore-pati Mol-bhav Wala Seth-ji!', words: ['Crore-pati', 'Mol-bhav', 'Wala', 'Seth-ji'] },
            { label: 'Option 3', line: 'Car Motor WagonR Swag!', words: ['Car', 'Motor', 'WagonR', 'Swag'] }
          ]
        },
        {
          id: 'dg_7',
          badge: 'Group 7 (Top → Bottom)',
          note: 'Mn · Tc · Re · Bh',
          elements: [['Mn', 25], ['Tc', 43], ['Re', 75], ['Bh', 107]],
          options: [
            { label: 'Option 1', line: 'Man Tak Re Bhai!', words: ['Man', 'Tak', 'Re', 'Bhai'] },
            { label: 'Option 2', line: 'Mann Tera Re भोला (Bhola)!', words: ['Mann', 'Tera', 'Re', 'Bhola'] },
            { label: 'Option 3', line: 'Munna Ticket Rakh जेब-Bhar!', words: ['Munna', 'Ticket', 'Rakh', 'Bhar'] }
          ]
        },
        {
          id: 'dg_8',
          badge: 'Group 8 (Top → Bottom)',
          note: 'Fe · Ru · Os · Hs',
          elements: [['Fe', 26], ['Ru', 44], ['Os', 76], ['Hs', 108]],
          options: [
            { label: 'Option 1', line: 'Fer Ruka Osama Haste!', words: ['Fer', 'Ruka', 'Osama', 'Haste'] },
            { label: 'Option 2', line: 'Firoz Rutha Os Hasa!', words: ['Firoz', 'Rutha', 'Os', 'Hasa'] },
            { label: 'Option 3', line: 'Ferraricar Rukegi Us Highway-par!', words: ['Ferrari', 'Rukegi', 'Us', 'Highway'] }
          ]
        },
        {
          id: 'dg_9',
          badge: 'Group 9 (Top → Bottom)',
          note: 'Co · Rh · Ir · Mt',
          elements: [['Co', 27], ['Rh', 45], ['Ir', 77], ['Mt', 109]],
          options: [
            { label: 'Option 1', line: 'Con Rhega Ireland Mat pooch!', words: ['Con', 'Rhega', 'Ireland', 'Mat'] },
            { label: 'Option 2', line: 'Coach Rohit Irfan Mast!', words: ['Coach', 'Rohit', 'Irfan', 'Mast'] },
            { label: 'Option 3', line: 'Coffee Rahat Irani Mithai!', words: ['Coffee', 'Rahat', 'Irani', 'Mithai'] }
          ]
        },
        {
          id: 'dg_10',
          badge: 'Group 10 (Top → Bottom)',
          note: 'Ni · Pd · Pt · Ds',
          elements: [['Ni', 28], ['Pd', 46], ['Pt', 78], ['Ds', 110]],
          options: [
            { label: 'Option 1', line: 'Nihi Pdhoge toh Ptoge Dost!', words: ['Nihi', 'Pdhoge', 'Ptoge', 'Dost'] },
            { label: 'Option 2', line: 'Nikhil Padha लिखा Pt Dost!', words: ['Nikhil', 'Padha', 'Pt', 'Dost'] },
            { label: 'Option 3', line: 'Nita Paidalnikli Patna Das-baje!', words: ['Nita', 'Paidal', 'Patna', 'Das'] }
          ]
        },
        {
          id: 'dg_11',
          badge: 'Group 11 · Coinage Metals',
          note: 'Cu · Ag · Au · Rg (Copper, Silver, Gold)',
          elements: [['Cu', 29], ['Ag', 47], ['Au', 79], ['Rg', 111]],
          options: [
            { label: 'Option 1', line: 'Cute Age Aur Rag!', words: ['Cute', 'Age', 'Aur', 'Rag'] },
            { label: 'Option 2', line: 'kyun Aage Aau Raja!', words: ['Kyun', 'Aage', 'Aau', 'Raja'] },
            { label: 'Option 3', line: 'Copper Chandi Sona Royal!', words: ['Copper', 'Chandi(Ag)', 'Sona(Au)', 'Royal(Rg)'] }
          ]
        },
        {
          id: 'dg_12',
          badge: 'Group 12 · Volatile Metals',
          note: 'Zn · Cd · Hg · Cn',
          elements: [['Zn', 30], ['Cd', 48], ['Hg', 80], ['Cn', 112]],
          options: [
            { label: 'Option 1', line: 'Zindagi Cadbury Hogayi Candy!', words: ['Zindagi', 'Cadbury', 'Hogayi', 'Candy'] },
            { label: 'Option 2', line: 'Zara Codd-liver Hoga Cure!', words: ['Zara', 'Codd', 'Hoga', 'Cure'] },
            { label: 'Option 3', line: 'Zandu Cold-balm Hoga Changa!', words: ['Zandu', 'Cold', 'Hoga', 'Changa'] }
          ]
        }
      ]
    },

    sp: {
      id: 'sp',
      tabLabel: 's & p Block (G1–G18)',
      practiceScope: 'sp',
      practiceLabel: '🎯 Practice s & p Block Now',
      series: [
        {
          id: 'sp_g1',
          badge: 'Group 1 · Alkali Metals',
          note: 'Valence config: ns¹',
          elements: [['H', 1], ['Li', 3], ['Na', 11], ['K', 19], ['Rb', 37], ['Cs', 55], ['Fr', 87]],
          options: [
            { label: 'Option 1 (Classic)', line: 'HaLiNa Ki Rab Se Fariyaad!', words: ['Ha', 'Li', 'Na', 'Ki', 'Rab', 'Se', 'Fariyaad'] },
            { label: 'Option 2 (Funny)', line: 'Hamare Liye Na Karo Rab Se Fariyaad!', words: ['Hamare', 'Liye', 'Na', 'Karo', 'Rab', 'Se', 'Fariyaad'] },
            { label: 'Option 3 (Short)', line: 'Hi Li Na K Rb Cs Fr — Happy Little NaUGHTY Kids Rub Cats Fur!', words: ['Happy', 'Little', 'Naughty', 'Kids', 'Rub', 'Cats', 'Fur'] }
          ]
        },
        {
          id: 'sp_g2',
          badge: 'Group 2 · Alkaline Earth Metals',
          note: 'Valence config: ns²',
          elements: [['Be', 4], ['Mg', 12], ['Ca', 20], ['Sr', 38], ['Ba', 56], ['Ra', 88]],
          options: [
            { label: 'Option 1 (All-Time Hit)', line: 'Beta Mange Car Scooter Baap Raazi!', words: ['Beta', 'Mange', 'Car', 'Scooter', 'Baap', 'Raazi'] },
            { label: 'Option 2 (twist)', line: 'Beta Mange Kanya Sundar Baap Roye!', words: ['Beta', 'Mange', 'Kanya', 'Sundar', 'Baap', 'Roye'] },
            { label: 'Option 3 (Foodie)', line: 'Bina Maggi Burger-Cake Sirf Baasi Roti!', words: ['Bina', 'Maggi', 'Cake', 'Sirf', 'Baasi', 'Roti'] }
          ]
        },
        {
          id: 'sp_g13',
          badge: 'Group 13 · Boron Family',
          note: 'Valence config: ns² np¹',
          elements: [['B', 5], ['Al', 13], ['Ga', 31], ['In', 49], ['Tl', 81], ['Nh', 113]],
          options: [
            { label: 'Option 1 (Mandi Hit)', line: 'Baingan Aaloo Gajar In Thaila Nahi!', words: ['Baingan', 'Aaloo', 'Gajar', 'In', 'Thaila', 'Nahi'] },
            { label: 'Option 2 (Filmy)', line: 'BAl GAngadhar In Tilak Nihal!', words: ['Bal', 'Al-', 'Gangadhar', 'In', 'Tilak', 'Nihal'] },
            { label: 'Option 3 (Cricket)', line: 'Bumrah All-out Gill Ishan Tilak Nehra!', words: ['Bumrah', 'All-out', 'Gill', 'Ishan', 'Tilak', 'Nehra'] }
          ]
        },
        {
          id: 'sp_g14',
          badge: 'Group 14 · Carbon Family',
          note: 'Valence config: ns² np²',
          elements: [['C', 6], ['Si', 14], ['Ge', 32], ['Sn', 50], ['Pb', 82], ['Fl', 114]],
          options: [
            { label: 'Option 1 (Bhakti Classic)', line: 'Kahe Sita Ji Suno Prabhu Filar!', words: ['Kahe', 'Sita', 'Ji', 'Suno', 'Prabhu', 'Filar'] },
            { label: 'Option 2 (College)', line: 'Chemistry Sir Gives Sanki Problems Full!', words: ['Chemistry', 'Sir', 'Gives', 'Sanki', 'Problems', 'Full'] },
            { label: 'Option 3 (Cinema)', line: 'Chale Shiv Ji Sang Parvati कैलाश-Flower!', words: ['Chale', 'Shiv', 'Ji', 'Sang', 'Parvati', 'Flower'] }
          ]
        },
        {
          id: 'sp_g15',
          badge: 'Group 15 · Nitrogen Family (Pnictogens)',
          note: 'Valence config: ns² np³',
          elements: [['N', 7], ['P', 15], ['As', 33], ['Sb', 51], ['Bi', 83], ['Mc', 115]],
          options: [
            { label: 'Option 1 (Bollywood)', line: 'Nana Patekar Aishwarya Sab Bindaas मचाएं!', words: ['Nana', 'Patekar', 'Aishwarya', 'Sab', 'Bindaas', 'Machaye'] },
            { label: 'Option 2 (Desi)', line: 'Nepal Pakistan Australia Sab Bhikhari/Bindaas Match!', words: ['Nepal', 'Pakistan', 'Australia', 'Sab', 'Bindaas', 'Match'] },
            { label: 'Option 3 ( Hostel )', line: 'Nahi Pasand Aise Sab बेकार बहाने Mujhko!', words: ['Nahi', 'Pasand', 'Aise', 'Sab', 'Bahane', 'Mujhko'] }
          ]
        },
        {
          id: 'sp_g16',
          badge: 'Group 16 · Oxygen Family (Chalcogens)',
          note: 'Valence config: ns² np⁴',
          elements: [['O', 8], ['S', 16], ['Se', 34], ['Te', 52], ['Po', 84], ['Lv', 116]],
          options: [
            { label: 'Option 1 (Exam Favorite)', line: 'Old Style Se Te-Po Live!', words: ['Old', 'Style', 'Se', 'Te-', '-Po', 'Live'] },
            { label: 'Option 2 (Funny)', line: 'Os Se Te-Po — Us Se Chepo Love-letter!', words: ['Os', 'Se', 'Se-2', 'Te-', '-Po', 'Love'] },
            { label: 'Option 3 (Sweet)', line: 'O Soniye Seene Tera Pyar Lovely!', words: ['O', 'Soniye', 'Seene', 'Tera', 'Pyar', 'Lovely'] }
          ]
        },
        {
          id: 'sp_g17',
          badge: 'Group 17 · Halogens',
          note: 'Valence config: ns² np⁵',
          elements: [['F', 9], ['Cl', 17], ['Br', 35], ['I', 53], ['At', 85], ['Ts', 117]],
          options: [
            { label: 'Option 1 (Classic Hit)', line: 'Fir Call Bahar Aayi Aunty Tension-mein!', words: ['Fir', 'Call', 'Bahar', 'Aayi', 'Aunty', 'Tension'] },
            { label: 'Option 2 (School)', line: 'First Class Biriyani In Austria Tasty!', words: ['First', 'Class', 'Biriyani', 'In', 'Austria', 'Tasty'] },
            { label: 'Option 3 (Cricket)', line: 'Faf Clean-bowled Bumrah Ishant Ashwin Test!', words: ['Faf', 'Clean', 'Bumrah', 'Ishant', 'Ashwin', 'Test'] }
          ]
        },
        {
          id: 'sp_g18',
          badge: 'Group 18 · Noble Gases',
          note: 'Complete octet: ns² np⁶ (He = 1s²)',
          elements: [['He', 2], ['Ne', 10], ['Ar', 18], ['Kr', 36], ['Xe', 54], ['Rn', 86], ['Og', 118]],
          options: [
            { label: 'Option 1 (Bollywood Hit)', line: 'Heena Neena Aur Kareena Ka X-ray Rangeen OMG!', words: ['Heena', 'Neena', 'Aur', 'Kareena', 'X-ray', 'Rangeen', 'OMG'] },
            { label: 'Option 2 (Cricket)', line: 'Harbhajan Nehra Agarkar Karthik पर Zero Run Out!', words: ['Harbhajan', 'Nehra', 'Agarkar', 'Karthik', 'Xero', 'Run', 'Out'] },
            { label: 'Option 3 (Desi)', line: 'Hero Ne Arrogant Krantikari X-men Roka Original!', words: ['Hero', 'Ne', 'Arrogant', 'Krantikari', 'X-men', 'Roka', 'Original'] }
          ]
        }
      ]
    },

    f: {
      id: 'f',
      tabLabel: 'f-Block (4f & 5f)',
      practiceScope: 'f',
      practiceLabel: '🎯 Practice f-Block Now',
      series: [
        {
          id: 'f_4f',
          badge: '4f Lanthanides · Row 6* (Z = 57–71)',
          note: '15 Rare-Earth Lanthanide elements (57 La to 71 Lu)',
          elements: [
            ['La', 57], ['Ce', 58], ['Pr', 59], ['Nd', 60], ['Pm', 61],
            ['Sm', 62], ['Eu', 63], ['Gd', 64], ['Tb', 65], ['Dy', 66],
            ['Ho', 67], ['Er', 68], ['Tm', 69], ['Yb', 70], ['Lu', 71]
          ],
          options: [
            {
              label: 'Option 1 (Desi Story)',
              line: 'Laal Cera Par Nadi Prem Samaye — Europe Gadbad Tab Dil Ho Eram Tum Yebhi Luto!',
              words: ['Laal', 'Cera', 'Par', 'Nadi', 'Prem', 'Samaye', 'Europe', 'Gadbad', 'Tab', 'Dil', 'Ho', 'Eram', 'Tum', 'Yebhi', 'Luto']
            },
            {
              label: 'Option 2 (Kota Famous)',
              line: 'Lallu Se Pravin Ne कहा Pammy Samajh — Europe Gaya Toh Didi Ho Errey Tum Yahan Lauto!',
              words: ['Lallu', 'Se', 'Pravin', 'Ne', 'Pammy', 'Samajh', 'Europe', 'Gaya', 'Toh', 'Didi', 'Ho', 'Errey', 'Tum', 'Yahan', 'Lauto']
            },
            {
              label: 'Option 3 (Easy English-Hindi)',
              line: 'Ladies Can’t Put Needles Properly in Slot-machine — Every Girl Tries Daily, However Every Time You Lose!',
              words: ['Ladies', 'Can’t', 'Put', 'Needles', 'Properly', 'Slot', 'Every', 'Girl', 'Tries', 'Daily', 'However', 'Every', 'Time', 'You', 'Lose']
            }
          ]
        },
        {
          id: 'f_5f',
          badge: '5f Actinides · Row 7* (Z = 89–103)',
          note: '15 Radioactive Actinide elements (89 Ac to 103 Lr)',
          elements: [
            ['Ac', 89], ['Th', 90], ['Pa', 91], ['U', 92], ['Np', 93],
            ['Pu', 94], ['Am', 95], ['Cm', 96], ['Bk', 97], ['Cf', 98],
            ['Es', 99], ['Fm', 100], ['Md', 101], ['No', 102], ['Lr', 103]
          ],
          options: [
            {
              label: 'Option 1 (Aam Papad Hit)',
              line: 'Aaj Thode Paapad Upar Naapo — Purane Aam Kam Bikenge Cafe Aish Farmate Madam Nobel Lawrencium!',
              words: ['Aaj', 'Thode', 'Paapad', 'Upar', 'Naapo', 'Purane', 'Aam', 'Kam', 'Bikenge', 'Cafe', 'Aish', 'Farmate', 'Madam', 'Nobel', 'Lawrencium']
            },
            {
              label: 'Option 2 (Tange Wala)',
              line: 'Accha Tha Paagal Unse Nipta — Purana Aam Kamao, Bank Californium Einsteinium Fermium Mendelevium Nobelium Lawrencium!',
              words: ['Accha', 'Tha', 'Paagal', 'Unse', 'Nipta', 'Purana', 'Aam', 'Kamao', 'Bank', 'Calif.', 'Einst.', 'Ferm.', 'Mendel.', 'Nobel.', 'Lawr.']
            },
            {
              label: 'Option 3 (Action Hero)',
              line: 'Action Thor Paas Uranus Neptune Pluto — America Curium Berkeley California Einstein Family Made No-1 Leader!',
              words: ['Action', 'Thor', 'Paas', 'Uranus', 'Neptune', 'Pluto', 'America', 'Curium', 'Berkeley', 'Calif.', 'Einstein', 'Family', 'Made', 'No-1', 'Leader']
            }
          ]
        }
      ]
    }
  };

  // Load saved user preferences & custom mnemonics from localStorage
  // Schema: { selectedChoice: { [seriesId]: number | 'custom' }, customData: { [seriesId]: { line: string, words: string[] } } }
  function loadUserStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          selectedChoice: parsed.selectedChoice || {},
          customData: parsed.customData || {}
        };
      }
    } catch (_) {}
    return { selectedChoice: {}, customData: {} };
  }

  let store = loadUserStore();

  function saveUserStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (_) {}
  }

  function findSeriesById(seriesId) {
    for (const tab of Object.values(RAW_TABS)) {
      const found = tab.series.find((s) => s.id === seriesId);
      if (found) return found;
    }
    return null;
  }

  function getResolvedSeries(seriesObj) {
    const custom = store.customData[seriesObj.id] || null;
    let choice = store.selectedChoice[seriesObj.id];
    if (choice === undefined) choice = 0;
    if (choice === 'custom' && !custom) choice = 0;

    let activeEntry;
    if (choice === 'custom' && custom) {
      activeEntry = {
        label: '★ Mera Custom',
        line: custom.line,
        words: custom.words
      };
    } else {
      const idx = typeof choice === 'number' && seriesObj.options[choice] ? choice : 0;
      choice = idx;
      activeEntry = seriesObj.options[idx];
    }

    const pairs = seriesObj.elements.map(([sym, z], idx) => [
      sym,
      z,
      activeEntry.words[idx] || sym
    ]);

    return {
      ...seriesObj,
      activeChoice: choice,
      hasCustom: Boolean(custom),
      customEntry: custom,
      line: activeEntry.line,
      pairs
    };
  }

  // Dynamic per-element active mnemonic lookup (always reflects user's latest selected preset or custom line!)
  function getForElement(z) {
    for (const tabKey of ['d', 'sp', 'f']) {
      for (const s of RAW_TABS[tabKey].series) {
        const idx = s.elements.findIndex(([, ez]) => ez === z);
        if (idx !== -1) {
          const resolved = getResolvedSeries(s);
          const [sym, , word] = resolved.pairs[idx];
          const highlighted = resolved.pairs
            .map(([, pz, pw]) => (pz === z ? `[${pw.toUpperCase()} → ${sym}]` : pw))
            .join(' ');
          return {
            seriesId: s.id,
            seriesBadge: s.badge,
            word,
            line: resolved.line,
            highlighted
          };
        }
      }
    }
    return null;
  }

  window.MNEMONICS_DATA = {
    TABS: RAW_TABS,
    getResolvedSeries,
    getForElement,

    selectOption(seriesId, choice) {
      store.selectedChoice[seriesId] = choice;
      saveUserStore();
    },

    saveCustomMnemonic(seriesId, line, wordsArray) {
      const s = findSeriesById(seriesId);
      if (!s) return false;
      const cleanLine = String(line || '').trim();
      const autoTokens = cleanLine ? cleanLine.replace(/—/g, ' ').split(/\s+/).filter(Boolean) : [];
      const finalWords = s.elements.map(([sym], idx) => {
        const explicit = wordsArray && wordsArray[idx] ? String(wordsArray[idx]).trim() : '';
        return explicit || autoTokens[idx] || sym;
      });
      store.customData[seriesId] = {
        line: cleanLine || finalWords.join(' '),
        words: finalWords
      };
      store.selectedChoice[seriesId] = 'custom';
      saveUserStore();
      return true;
    },

    deleteCustomMnemonic(seriesId) {
      delete store.customData[seriesId];
      if (store.selectedChoice[seriesId] === 'custom') {
        store.selectedChoice[seriesId] = 0;
      }
      saveUserStore();
    },

    splitLineIntoWords(line, count) {
      const clean = String(line || '').replace(/[—–]+/g, ' ').trim();
      if (!clean) return new Array(count).fill('');
      const parts = clean.split(/\s+/).filter(Boolean);
      const out = [];
      for (let i = 0; i < count; i++) {
        if (i < count - 1) {
          out.push(parts[i] || '');
        } else {
          // Last slot absorbs any remaining words cleanly!
          out.push(parts.slice(i).join(' ') || '');
        }
      }
      return out;
    }
  };
})();

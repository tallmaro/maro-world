export const places=[
  {id:'library',name:'Bocconi library',short:'The library',city:'Milan',chapter:'University days',color:'#a77339',position:[-8.2,0,-6.6],
    intro:'Most of my university time was spent here. A little piece of Milan, with a place to sit and study.',
    note:'The Via Gobbi library, in miniature. The study layout is an interpretation, not a reconstruction of a particular seat.',
    views:[['place','Outside'],['study','Study room'],['entrance','At the door']],
    music:{artist:'Jürgen Paape',title:'So weit wie noch nie',version:'Original Mix',provider:'Spotify',url:'https://open.spotify.com/track/72aZrJKq734qOVBMUpBd0L',embed:'https://open.spotify.com/embed/track/72aZrJKq734qOVBMUpBd0L?utm_source=oembed',height:152}},
  {id:'room',name:'My workspace',short:'At home',city:'Tbilisi',chapter:'The everyday',color:'#326653',position:[-8.2,0,6.6],
    intro:'I work mostly from home in Tbilisi. Here’s my corner of it: green curtains, a pale desk, and a little lamplight.',
    note:'A stylised cutaway of one room. No address, house exterior or hidden rooms are represented.',
    views:[['place','The room'],['desk','At the desk'],['shelves','The shelves']],
    music:{artist:'Serge Gainsbourg',title:'La Javanaise',version:'Mono Version',provider:'Spotify',url:'https://open.spotify.com/track/09xJRXtKNRont6AXJlog44',embed:'https://open.spotify.com/embed/track/09xJRXtKNRont6AXJlog44?utm_source=oembed',height:152}},
  {id:'qsi',name:'QSI Tbilisi',short:'School days',city:'Tbilisi',chapter:'School days',color:'#9b493c',position:[8.2,0,6.6],
    intro:'Before Milan, there was QSI International School of Tbilisi. The red roofs, the veranda, the school grounds.',
    note:'A reference-based miniature of the Zurgovani campus, not a year-exact reconstruction. No school interiors are modelled.',
    views:[['place','The campus'],['facade','The veranda'],['field','The field']],
    music:{artist:'Pop Smoke',title:'Dior',version:'Meet The Woo · explicit lyrics',provider:'Spotify',url:'https://open.spotify.com/track/1SslOor5usE3EFLGtiMyIn',embed:'https://open.spotify.com/embed/track/1SslOor5usE3EFLGtiMyIn?utm_source=oembed',height:152}},
  {id:'stamba',name:'Stamba',short:'At Stamba',city:'Tbilisi',chapter:'A meeting place',color:'#805846',position:[8.2,0,-6.6],
    intro:'A place for meetings in Tbilisi, among brick, books and greenery.',
    note:'A compressed collection of Stamba’s public spaces. The café seating is illustrative, not a reconstruction of my meetings.',
    views:[['place','The courtyard'],['atrium','Books & greenery'],['street','Street side']],
    music:{artist:'Radiohead',title:'Weird Fishes / Arpeggi',version:'In Rainbows',provider:'Spotify',url:'https://open.spotify.com/track/4wajJ1o7jWIg62YqpkHC7S',embed:'https://open.spotify.com/embed/track/4wajJ1o7jWIg62YqpkHC7S?utm_source=oembed',height:152}}
];
const titles=[
  ['Mathematics','Mathematical Analysis'],['Mathematics','Algebra and Geometry'],['Mathematics','Probability'],['Mathematics','Mathematical Statistics'],['Mathematics','Advanced Analysis and Optimization'],
  ['Computing & AI','Computer Science'],['Computing & AI','Advanced Programming and Optimization Algorithms'],['Computing & AI','Mathematical Modelling in Machine Learning'],['Computing & AI','Machine Learning and Artificial Intelligence'],['Computing & AI','Foundations of Data Science'],
  ['Decisions','Foundations of Economic Sciences'],['Decisions','Decision Theory and Human Behavior'],['Decisions','Game Theory and Mechanism Design'],['Decisions','Mathematical Modelling for Finance'],['Decisions','Marketing'],
  ['Other studies','Mathematical Modelling for Neuroscience'],['Other studies','Stochastic Processes and Simulation in Natural Sciences']
];
export const courses=titles.map(([area,title])=>({area,title,takeaway:null}));

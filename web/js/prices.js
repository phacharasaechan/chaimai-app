/* ChaiMai — reference price baselines for risk calculations. Loaded before js/app.js. */
var usbBaseline=[{maxGb:32,rate:8.0},{maxGb:64,rate:5.6},{maxGb:128,rate:4.0},{maxGb:256,rate:2.9},{maxGb:512,rate:2.7},{maxGb:1024,rate:2.6},{maxGb:999999,rate:2.5}];
function getUsbRate(gb){ for(var i=0;i<usbBaseline.length;i++){ if(gb<=usbBaseline[i].maxGb) return usbBaseline[i].rate; } return usbBaseline[usbBaseline.length-1].rate; }
function gbLabel(gb){ return gb>=1024?(gb/1024)+'TB':gb+'GB'; }
var brandNamesUsb={sandisk:'SanDisk',kingston:'Kingston',samsung:'Samsung',lexar:'Lexar',transcend:'Transcend',adata:'ADATA',hp:'HP',sony:'Sony',toshiba:'Toshiba'};
var brandNamesPower={anker:'Anker',xiaomi:'Xiaomi',baseus:'Baseus',romoss:'Romoss',ugreen:'UGREEN',hp:'HP'};

var powerBaseline=[{maxMah:10000,rate:0.09},{maxMah:20000,rate:0.075},{maxMah:30000,rate:0.065},{maxMah:50000,rate:0.06},{maxMah:9999999,rate:0.055}];
function getPowerRate(mah){ for(var i=0;i<powerBaseline.length;i++){ if(mah<=powerBaseline[i].maxMah) return powerBaseline[i].rate; } return powerBaseline[powerBaseline.length-1].rate; }

var chargerRates=[{maxW:20,rate:12},{maxW:35,rate:12},{maxW:70,rate:12},{maxW:100,rate:13},{maxW:99999,rate:14}];
function getChargerRate(w){ for(var i=0;i<chargerRates.length;i++){ if(w<=chargerRates[i].maxW) return chargerRates[i].rate; } return 14; }
var brandNamesCh={apple:'Apple',samsung:'Samsung',anker:'Anker',baseus:'Baseus',ugreen:'UGREEN',xiaomi:'Xiaomi',belkin:'Belkin'};

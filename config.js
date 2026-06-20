/**
 * config.js – Application Configuration
 * 
 * This file contains all sensitive/configuration data.
 * For production, add this file to .gitignore and provide a sample config.
 */

const CONFIG = {
  // ── Firebase Configuration ──
  firebase: {
    apiKey: "AIzaSyCrxaEnJ0R7mTJdiJ9vLgQFikoAncAuG7E",
    authDomain: "money-carhire.firebaseapp.com",
    projectId: "money-carhire",
    storageBucket: "money-carhire.firebasestorage.app",
    messagingSenderId: "269929325057",
    appId: "1:269929325057:web:3469a8281944d990cd1600",
    measurementId: "G-156QZDLS94"
  },
  
  // ── EmailJS Configuration ──
  emailjs: {
    publicKey: 'GrwmOU4hjzqu9yLEP',
    serviceId: 'service_4sf99gj',
    customerTemplate: 'template_ho9ezeu',
    ownerTemplate: 'template_jtnrwul',
    ownerEmail: 'moneycarhire@gmail.com'
  },
  
  // ── Admin Configuration ──
  admin: {
    username: 'Money',
    password: 'yktvwithkyle'
  },
  
  // ── Business Rules ──
  deliveryFee: 1000  // KSh 1,000 delivery fee
};

// Make config globally available
window.CONFIG = CONFIG;
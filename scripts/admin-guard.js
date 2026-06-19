// scripts/admin-guard.js
(function() {
  const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
  const currentPath = window.location.pathname;
  if ((currentPath.includes('admin.html') || currentPath.includes('admin-fleet.html')) && !isLoggedIn) {
    window.location.href = 'admin-login.html';
  }
})();
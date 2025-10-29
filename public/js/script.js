// Mobile Navbar Toggle
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('show');
});

// -------- Flip-Card Login/Sign Up --------
const flipCard = document.getElementById('flipCard');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');

if (flipCard) { // Ensure flipCard exists on the page
  // Function to flip to signup
  function flipToSignup() {
    flipCard.classList.add('flipped');
  }

  // Function to flip to login
  function flipToLogin() {
    flipCard.classList.remove('flipped');
  }

  // Event listeners for buttons
  if (showSignupBtn) showSignupBtn.addEventListener('click', flipToSignup);
  if (showLoginBtn) showLoginBtn.addEventListener('click', flipToLogin);

  // Auto-flip based on URL query (e.g., ?show=signup)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('show') === 'signup') {
    flipToSignup();
  }
}

